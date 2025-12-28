use aws_sdk_s3::primitives::ByteStream;
use axum::{
    extract::{Multipart, Path, Query, State},
    http::header,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    error::{AppError, AppResult},
    handlers::public::PaginationQuery,
    models::*,
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct MediaListQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub folder: Option<String>,
    pub artist_id: Option<Uuid>,
}

// ============ MEDIA ============

pub async fn list_media(
    State(state): State<AppState>,
    Query(query): Query<MediaListQuery>,
) -> AppResult<Json<Vec<MediaWithArtist>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(50).min(500);
    let offset = (page - 1) * per_page;

    let media = match (&query.folder, &query.artist_id) {
        (Some(folder), Some(artist_id)) => {
            sqlx::query_as::<_, MediaWithArtist>(
                r#"
                SELECT m.*, a.name as artist_name
                FROM media m
                LEFT JOIN artists a ON m.artist_id = a.id
                WHERE m.folder = $3 AND m.artist_id = $4
                ORDER BY m.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
            )
            .bind(per_page as i64)
            .bind(offset as i64)
            .bind(folder)
            .bind(artist_id)
            .fetch_all(&state.db)
            .await?
        }
        (Some(folder), None) => {
            sqlx::query_as::<_, MediaWithArtist>(
                r#"
                SELECT m.*, a.name as artist_name
                FROM media m
                LEFT JOIN artists a ON m.artist_id = a.id
                WHERE m.folder = $3
                ORDER BY m.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
            )
            .bind(per_page as i64)
            .bind(offset as i64)
            .bind(folder)
            .fetch_all(&state.db)
            .await?
        }
        (None, Some(artist_id)) => {
            sqlx::query_as::<_, MediaWithArtist>(
                r#"
                SELECT m.*, a.name as artist_name
                FROM media m
                LEFT JOIN artists a ON m.artist_id = a.id
                WHERE m.artist_id = $3
                ORDER BY m.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
            )
            .bind(per_page as i64)
            .bind(offset as i64)
            .bind(artist_id)
            .fetch_all(&state.db)
            .await?
        }
        (None, None) => {
            sqlx::query_as::<_, MediaWithArtist>(
                r#"
                SELECT m.*, a.name as artist_name
                FROM media m
                LEFT JOIN artists a ON m.artist_id = a.id
                ORDER BY m.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
            )
            .bind(per_page as i64)
            .bind(offset as i64)
            .fetch_all(&state.db)
            .await?
        }
    };

    Ok(Json(media))
}

pub async fn list_media_folders(
    State(state): State<AppState>,
) -> AppResult<Json<Vec<String>>> {
    let folders: Vec<(Option<String>,)> = sqlx::query_as(
        r#"
        SELECT DISTINCT folder FROM media
        WHERE folder IS NOT NULL AND folder != ''
        ORDER BY folder
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(folders.into_iter().filter_map(|(f,)| f).collect()))
}

pub async fn upload_media(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> AppResult<Json<Media>> {
    let mut file_data: Option<(String, Vec<u8>, String)> = None;
    let mut alt: Option<String> = None;
    let mut credit: Option<String> = None;
    let mut folder: Option<String> = None;
    let mut artist_id: Option<Uuid> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "file" => {
                let filename = field
                    .file_name()
                    .ok_or_else(|| AppError::BadRequest("Missing filename".to_string()))?
                    .to_string();
                let content_type = field
                    .content_type()
                    .unwrap_or("application/octet-stream")
                    .to_string();
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?
                    .to_vec();
                file_data = Some((filename, data, content_type));
            }
            "alt" => {
                alt = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::BadRequest(e.to_string()))?,
                );
            }
            "credit" => {
                credit = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::BadRequest(e.to_string()))?,
                );
            }
            "folder" => {
                folder = Some(
                    field
                        .text()
                        .await
                        .map_err(|e| AppError::BadRequest(e.to_string()))?,
                );
            }
            "artist_id" => {
                let text = field
                    .text()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?;
                if !text.is_empty() {
                    artist_id = Some(
                        Uuid::parse_str(&text)
                            .map_err(|e| AppError::BadRequest(format!("Invalid artist_id: {}", e)))?,
                    );
                }
            }
            _ => {}
        }
    }

    let (original_filename, data, content_type) =
        file_data.ok_or_else(|| AppError::BadRequest("No file provided".to_string()))?;

    // Generate unique filename
    let extension = original_filename
        .rsplit('.')
        .next()
        .unwrap_or("bin");
    let unique_filename = format!("{}.{}", Uuid::new_v4(), extension);

    // Upload to S3
    state
        .s3_client
        .put_object()
        .bucket(&state.config.s3_bucket)
        .key(&unique_filename)
        .body(ByteStream::from(data))
        .content_type(&content_type)
        .send()
        .await?;

    let url = format!("{}/{}", state.config.s3_public_url, unique_filename);

    let media = sqlx::query_as::<_, Media>(
        r#"
        INSERT INTO media (filename, url, alt, credit, folder, artist_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(&unique_filename)
    .bind(&url)
    .bind(&alt)
    .bind(&credit)
    .bind(&folder)
    .bind(&artist_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(media))
}

pub async fn update_media(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateMediaRequest>,
) -> AppResult<Json<Media>> {
    let media = sqlx::query_as::<_, Media>(
        r#"
        UPDATE media
        SET alt = COALESCE($2, alt),
            credit = COALESCE($3, credit),
            folder = COALESCE($4, folder),
            artist_id = COALESCE($5, artist_id)
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.alt)
    .bind(&payload.credit)
    .bind(&payload.folder)
    .bind(&payload.artist_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Media not found".to_string()))?;

    Ok(Json(media))
}

pub async fn delete_media(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let media = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Media not found".to_string()))?;

    // Delete from S3
    state
        .s3_client
        .delete_object()
        .bucket(&state.config.s3_bucket)
        .key(&media.filename)
        .send()
        .await?;

    sqlx::query("DELETE FROM media WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}

// ============ ARTISTS ============

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

pub async fn list_artists(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<ArtistWithPortrait>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let artists = if let Some(search) = &query.q {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Artist>(
            r#"
            SELECT * FROM artists
            WHERE name ILIKE $1 OR slug ILIKE $1 OR bio_md ILIKE $1
            ORDER BY updated_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_pattern)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Artist>(
            r#"
            SELECT * FROM artists
            ORDER BY updated_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    };

    let mut result = Vec::new();
    for artist in artists {
        let portrait = if let Some(media_id) = artist.portrait_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };
        result.push(ArtistWithPortrait { artist, portrait });
    }

    Ok(Json(result))
}

pub async fn get_artist(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<ArtistWithPortrait>> {
    let artist = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Artist not found".to_string()))?;

    let portrait = if let Some(media_id) = artist.portrait_media_id {
        sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
            .bind(media_id)
            .fetch_optional(&state.db)
            .await?
    } else {
        None
    };

    Ok(Json(ArtistWithPortrait { artist, portrait }))
}

pub async fn create_artist(
    State(state): State<AppState>,
    Json(payload): Json<CreateArtistRequest>,
) -> AppResult<Json<Artist>> {
    let slug = slug::slugify(&payload.name);
    let now = Utc::now();
    let published_at = if payload.published.unwrap_or(false) {
        Some(now)
    } else {
        None
    };

    let artist = sqlx::query_as::<_, Artist>(
        r#"
        INSERT INTO artists (name, slug, bio_md, portrait_media_id, artsper_url, website_url, instagram_url, published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#,
    )
    .bind(&payload.name)
    .bind(&slug)
    .bind(&payload.bio_md)
    .bind(&payload.portrait_media_id)
    .bind(&payload.artsper_url)
    .bind(&payload.website_url)
    .bind(&payload.instagram_url)
    .bind(payload.published.unwrap_or(false))
    .bind(published_at)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(artist))
}

pub async fn update_artist(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateArtistRequest>,
) -> AppResult<Json<Artist>> {
    let now = Utc::now();

    // Get current artist to check publish state change
    let current = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Artist not found".to_string()))?;

    let new_slug = payload.name.as_ref().map(|n| slug::slugify(n));

    let published_at = match (current.published, payload.published) {
        (false, Some(true)) => Some(now),
        (_, Some(false)) => None,
        _ => current.published_at,
    };

    let artist = sqlx::query_as::<_, Artist>(
        r#"
        UPDATE artists
        SET name = COALESCE($2, name),
            slug = COALESCE($3, slug),
            bio_md = COALESCE($4, bio_md),
            portrait_media_id = COALESCE($5, portrait_media_id),
            artsper_url = COALESCE($6, artsper_url),
            website_url = COALESCE($7, website_url),
            instagram_url = COALESCE($8, instagram_url),
            published = COALESCE($9, published),
            published_at = $10,
            updated_at = $11
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.name)
    .bind(&new_slug)
    .bind(&payload.bio_md)
    .bind(&payload.portrait_media_id)
    .bind(&payload.artsper_url)
    .bind(&payload.website_url)
    .bind(&payload.instagram_url)
    .bind(payload.published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(artist))
}

pub async fn delete_artist(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    sqlx::query("DELETE FROM artists WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}

pub async fn toggle_artist_publish(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Artist>> {
    let current = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Artist not found".to_string()))?;

    let now = Utc::now();
    let (new_published, published_at) = if current.published {
        (false, None)
    } else {
        (true, Some(now))
    };

    let artist = sqlx::query_as::<_, Artist>(
        r#"
        UPDATE artists
        SET published = $2, published_at = $3, updated_at = $4
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(new_published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(artist))
}

// ============ ARTWORKS ============

pub async fn list_artworks(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<ArtworkWithMedia>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let artworks = if let Some(search) = &query.q {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Artwork>(
            r#"
            SELECT aw.* FROM artworks aw
            LEFT JOIN artists ar ON aw.artist_id = ar.id
            WHERE aw.title ILIKE $1
                OR aw.medium ILIKE $1
                OR aw.dimensions ILIKE $1
                OR ar.name ILIKE $1
            ORDER BY aw.updated_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_pattern)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Artwork>(
            r#"
            SELECT * FROM artworks
            ORDER BY updated_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    };

    let mut result = Vec::new();
    for artwork in artworks {
        let media = sqlx::query_as::<_, Media>(
            r#"
            SELECT m.* FROM media m
            JOIN artwork_media am ON m.id = am.media_id
            WHERE am.artwork_id = $1
            ORDER BY am.sort_order ASC
            "#,
        )
        .bind(artwork.id)
        .fetch_all(&state.db)
        .await?;

        let artist = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
            .bind(artwork.artist_id)
            .fetch_optional(&state.db)
            .await?;

        result.push(ArtworkWithMedia {
            artwork,
            media,
            artist_name: artist.as_ref().map(|a| a.name.clone()),
            artist_slug: artist.map(|a| a.slug),
        });
    }

    Ok(Json(result))
}

pub async fn get_artwork(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<ArtworkWithMedia>> {
    let artwork = sqlx::query_as::<_, Artwork>("SELECT * FROM artworks WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Artwork not found".to_string()))?;

    let media = sqlx::query_as::<_, Media>(
        r#"
        SELECT m.* FROM media m
        JOIN artwork_media am ON m.id = am.media_id
        WHERE am.artwork_id = $1
        ORDER BY am.sort_order ASC
        "#,
    )
    .bind(artwork.id)
    .fetch_all(&state.db)
    .await?;

    let artist = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
        .bind(artwork.artist_id)
        .fetch_optional(&state.db)
        .await?;

    Ok(Json(ArtworkWithMedia {
        artwork,
        media,
        artist_name: artist.as_ref().map(|a| a.name.clone()),
        artist_slug: artist.map(|a| a.slug),
    }))
}

pub async fn create_artwork(
    State(state): State<AppState>,
    Json(payload): Json<CreateArtworkRequest>,
) -> AppResult<Json<Artwork>> {
    let slug = slug::slugify(&payload.title);
    let now = Utc::now();
    let published_at = if payload.published.unwrap_or(false) {
        Some(now)
    } else {
        None
    };

    let artwork = sqlx::query_as::<_, Artwork>(
        r#"
        INSERT INTO artworks (artist_id, title, slug, year, medium, dimensions, price_note, artsper_url, published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#,
    )
    .bind(&payload.artist_id)
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.year)
    .bind(&payload.medium)
    .bind(&payload.dimensions)
    .bind(&payload.price_note)
    .bind(&payload.artsper_url)
    .bind(payload.published.unwrap_or(false))
    .bind(published_at)
    .fetch_one(&state.db)
    .await?;

    // Add media associations
    if let Some(media_ids) = payload.media_ids {
        for (order, media_id) in media_ids.iter().enumerate() {
            sqlx::query(
                "INSERT INTO artwork_media (artwork_id, media_id, sort_order) VALUES ($1, $2, $3)",
            )
            .bind(artwork.id)
            .bind(media_id)
            .bind(order as i32)
            .execute(&state.db)
            .await?;
        }
    }

    Ok(Json(artwork))
}

pub async fn update_artwork(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateArtworkRequest>,
) -> AppResult<Json<Artwork>> {
    let now = Utc::now();

    let current = sqlx::query_as::<_, Artwork>("SELECT * FROM artworks WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Artwork not found".to_string()))?;

    let new_slug = payload.title.as_ref().map(|t| slug::slugify(t));

    let published_at = match (current.published, payload.published) {
        (false, Some(true)) => Some(now),
        (_, Some(false)) => None,
        _ => current.published_at,
    };

    let artwork = sqlx::query_as::<_, Artwork>(
        r#"
        UPDATE artworks
        SET artist_id = COALESCE($2, artist_id),
            title = COALESCE($3, title),
            slug = COALESCE($4, slug),
            year = COALESCE($5, year),
            medium = COALESCE($6, medium),
            dimensions = COALESCE($7, dimensions),
            price_note = COALESCE($8, price_note),
            artsper_url = COALESCE($9, artsper_url),
            published = COALESCE($10, published),
            published_at = $11,
            updated_at = $12
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.artist_id)
    .bind(&payload.title)
    .bind(&new_slug)
    .bind(&payload.year)
    .bind(&payload.medium)
    .bind(&payload.dimensions)
    .bind(&payload.price_note)
    .bind(&payload.artsper_url)
    .bind(payload.published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    // Update media associations if provided
    if let Some(media_ids) = payload.media_ids {
        sqlx::query("DELETE FROM artwork_media WHERE artwork_id = $1")
            .bind(id)
            .execute(&state.db)
            .await?;

        for (order, media_id) in media_ids.iter().enumerate() {
            sqlx::query(
                "INSERT INTO artwork_media (artwork_id, media_id, sort_order) VALUES ($1, $2, $3)",
            )
            .bind(id)
            .bind(media_id)
            .bind(order as i32)
            .execute(&state.db)
            .await?;
        }
    }

    Ok(Json(artwork))
}

pub async fn delete_artwork(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    sqlx::query("DELETE FROM artworks WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}

// ============ EVENTS ============

pub async fn list_events(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<EventWithDetails>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let events = if let Some(search) = &query.q {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Event>(
            r#"
            SELECT * FROM events
            WHERE title ILIKE $1
                OR location ILIKE $1
                OR description_md ILIKE $1
            ORDER BY start_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_pattern)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Event>(
            r#"
            SELECT * FROM events
            ORDER BY start_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    };

    let mut result = Vec::new();
    for event in events {
        let hero = if let Some(media_id) = event.hero_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };

        let artists = sqlx::query_as::<_, Artist>(
            r#"
            SELECT a.* FROM artists a
            JOIN event_artists ea ON a.id = ea.artist_id
            WHERE ea.event_id = $1
            "#,
        )
        .bind(event.id)
        .fetch_all(&state.db)
        .await?;

        let mut artists_with_portrait = Vec::new();
        for artist in artists {
            let portrait = if let Some(media_id) = artist.portrait_media_id {
                sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                    .bind(media_id)
                    .fetch_optional(&state.db)
                    .await?
            } else {
                None
            };
            artists_with_portrait.push(ArtistWithPortrait { artist, portrait });
        }

        result.push(EventWithDetails {
            event,
            hero,
            artists: artists_with_portrait,
        });
    }

    Ok(Json(result))
}

pub async fn get_event(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<EventWithDetails>> {
    let event = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Event not found".to_string()))?;

    let hero = if let Some(media_id) = event.hero_media_id {
        sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
            .bind(media_id)
            .fetch_optional(&state.db)
            .await?
    } else {
        None
    };

    let artists = sqlx::query_as::<_, Artist>(
        r#"
        SELECT a.* FROM artists a
        JOIN event_artists ea ON a.id = ea.artist_id
        WHERE ea.event_id = $1
        "#,
    )
    .bind(event.id)
    .fetch_all(&state.db)
    .await?;

    let mut artists_with_portrait = Vec::new();
    for artist in artists {
        let portrait = if let Some(media_id) = artist.portrait_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };
        artists_with_portrait.push(ArtistWithPortrait { artist, portrait });
    }

    Ok(Json(EventWithDetails {
        event,
        hero,
        artists: artists_with_portrait,
    }))
}

pub async fn create_event(
    State(state): State<AppState>,
    Json(payload): Json<CreateEventRequest>,
) -> AppResult<Json<Event>> {
    let slug = slug::slugify(&payload.title);
    let now = Utc::now();
    let published_at = if payload.published.unwrap_or(false) {
        Some(now)
    } else {
        None
    };

    let event = sqlx::query_as::<_, Event>(
        r#"
        INSERT INTO events (title, slug, start_at, end_at, location, description_md, hero_media_id, published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#,
    )
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.start_at)
    .bind(&payload.end_at)
    .bind(&payload.location)
    .bind(&payload.description_md)
    .bind(&payload.hero_media_id)
    .bind(payload.published.unwrap_or(false))
    .bind(published_at)
    .fetch_one(&state.db)
    .await?;

    if let Some(artist_ids) = payload.artist_ids {
        for artist_id in artist_ids {
            sqlx::query("INSERT INTO event_artists (event_id, artist_id) VALUES ($1, $2)")
                .bind(event.id)
                .bind(artist_id)
                .execute(&state.db)
                .await?;
        }
    }

    Ok(Json(event))
}

pub async fn update_event(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateEventRequest>,
) -> AppResult<Json<Event>> {
    let now = Utc::now();

    let current = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Event not found".to_string()))?;

    let new_slug = payload.title.as_ref().map(|t| slug::slugify(t));

    let published_at = match (current.published, payload.published) {
        (false, Some(true)) => Some(now),
        (_, Some(false)) => None,
        _ => current.published_at,
    };

    let event = sqlx::query_as::<_, Event>(
        r#"
        UPDATE events
        SET title = COALESCE($2, title),
            slug = COALESCE($3, slug),
            start_at = COALESCE($4, start_at),
            end_at = COALESCE($5, end_at),
            location = COALESCE($6, location),
            description_md = COALESCE($7, description_md),
            hero_media_id = COALESCE($8, hero_media_id),
            published = COALESCE($9, published),
            published_at = $10,
            updated_at = $11
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.title)
    .bind(&new_slug)
    .bind(&payload.start_at)
    .bind(&payload.end_at)
    .bind(&payload.location)
    .bind(&payload.description_md)
    .bind(&payload.hero_media_id)
    .bind(payload.published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    if let Some(artist_ids) = payload.artist_ids {
        sqlx::query("DELETE FROM event_artists WHERE event_id = $1")
            .bind(id)
            .execute(&state.db)
            .await?;

        for artist_id in artist_ids {
            sqlx::query("INSERT INTO event_artists (event_id, artist_id) VALUES ($1, $2)")
                .bind(id)
                .bind(artist_id)
                .execute(&state.db)
                .await?;
        }
    }

    Ok(Json(event))
}

pub async fn delete_event(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    sqlx::query("DELETE FROM events WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}

// ============ POSTS ============

pub async fn list_posts(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<PostWithHero>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let posts = if let Some(search) = &query.q {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Post>(
            r#"
            SELECT * FROM posts
            WHERE title ILIKE $1 OR body_md ILIKE $1
            ORDER BY updated_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_pattern)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Post>(
            r#"
            SELECT * FROM posts
            ORDER BY updated_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    };

    let mut result = Vec::new();
    for post in posts {
        let hero = if let Some(media_id) = post.hero_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };
        result.push(PostWithHero { post, hero });
    }

    Ok(Json(result))
}

pub async fn get_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<PostWithHero>> {
    let post = sqlx::query_as::<_, Post>("SELECT * FROM posts WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Post not found".to_string()))?;

    let hero = if let Some(media_id) = post.hero_media_id {
        sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
            .bind(media_id)
            .fetch_optional(&state.db)
            .await?
    } else {
        None
    };

    Ok(Json(PostWithHero { post, hero }))
}

pub async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<CreatePostRequest>,
) -> AppResult<Json<Post>> {
    let slug = slug::slugify(&payload.title);
    let now = Utc::now();
    let published_at = if payload.published.unwrap_or(false) {
        Some(now)
    } else {
        None
    };

    let post = sqlx::query_as::<_, Post>(
        r#"
        INSERT INTO posts (title, slug, body_md, hero_media_id, published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.body_md)
    .bind(&payload.hero_media_id)
    .bind(payload.published.unwrap_or(false))
    .bind(published_at)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(post))
}

pub async fn update_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdatePostRequest>,
) -> AppResult<Json<Post>> {
    let now = Utc::now();

    let current = sqlx::query_as::<_, Post>("SELECT * FROM posts WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Post not found".to_string()))?;

    let new_slug = payload.title.as_ref().map(|t| slug::slugify(t));

    let published_at = match (current.published, payload.published) {
        (false, Some(true)) => Some(now),
        (_, Some(false)) => None,
        _ => current.published_at,
    };

    let post = sqlx::query_as::<_, Post>(
        r#"
        UPDATE posts
        SET title = COALESCE($2, title),
            slug = COALESCE($3, slug),
            body_md = COALESCE($4, body_md),
            hero_media_id = COALESCE($5, hero_media_id),
            published = COALESCE($6, published),
            published_at = $7,
            updated_at = $8
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.title)
    .bind(&new_slug)
    .bind(&payload.body_md)
    .bind(&payload.hero_media_id)
    .bind(payload.published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(post))
}

pub async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    sqlx::query("DELETE FROM posts WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}

// ============ PAGES ============

pub async fn list_pages(State(state): State<AppState>) -> AppResult<Json<Vec<PageWithHero>>> {
    let pages = sqlx::query_as::<_, Page>("SELECT * FROM pages ORDER BY key ASC")
        .fetch_all(&state.db)
        .await?;

    let mut result = Vec::new();
    for page in pages {
        let hero = if let Some(media_id) = page.hero_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };
        result.push(PageWithHero { page, hero });
    }

    Ok(Json(result))
}

pub async fn get_page(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> AppResult<Json<PageWithHero>> {
    let page = sqlx::query_as::<_, Page>("SELECT * FROM pages WHERE key = $1")
        .bind(&key)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Page not found".to_string()))?;

    let hero = if let Some(media_id) = page.hero_media_id {
        sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
            .bind(media_id)
            .fetch_optional(&state.db)
            .await?
    } else {
        None
    };

    Ok(Json(PageWithHero { page, hero }))
}

pub async fn update_page(
    State(state): State<AppState>,
    Path(key): Path<String>,
    Json(payload): Json<UpdatePageRequest>,
) -> AppResult<Json<Page>> {
    let now = Utc::now();

    let page = sqlx::query_as::<_, Page>(
        r#"
        UPDATE pages
        SET title = COALESCE($2, title),
            body_md = COALESCE($3, body_md),
            hero_media_id = COALESCE($4, hero_media_id),
            updated_at = $5
        WHERE key = $1
        RETURNING *
        "#,
    )
    .bind(&key)
    .bind(&payload.title)
    .bind(&payload.body_md)
    .bind(&payload.hero_media_id)
    .bind(now)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Page not found".to_string()))?;

    Ok(Json(page))
}

// ============ CONTACT MESSAGES ============

pub async fn list_messages(
    State(state): State<AppState>,
    Query(query): Query<PaginationQuery>,
) -> AppResult<Json<Vec<ContactMessage>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(50).min(100);
    let offset = (page - 1) * per_page;

    let messages = sqlx::query_as::<_, ContactMessage>(
        r#"
        SELECT * FROM contact_messages
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(messages))
}

pub async fn update_message_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateContactStatusRequest>,
) -> AppResult<Json<ContactMessage>> {
    let message = sqlx::query_as::<_, ContactMessage>(
        "UPDATE contact_messages SET status = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(&payload.status)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Message not found".to_string()))?;

    Ok(Json(message))
}

// ============ WAITLIST ============

pub async fn list_waitlist(
    State(state): State<AppState>,
    Query(query): Query<PaginationQuery>,
) -> AppResult<Json<Vec<WaitlistEntry>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(50).min(100);
    let offset = (page - 1) * per_page;

    let entries = sqlx::query_as::<_, WaitlistEntry>(
        r#"
        SELECT * FROM labomaton_waitlist
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(entries))
}

pub async fn export_waitlist(State(state): State<AppState>) -> impl IntoResponse {
    let entries = sqlx::query_as::<_, WaitlistEntry>(
        "SELECT * FROM labomaton_waitlist ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let mut wtr = csv::Writer::from_writer(vec![]);
    wtr.write_record(["email", "source", "created_at"]).unwrap();

    for entry in entries {
        wtr.write_record([
            &entry.email,
            &entry.source.unwrap_or_default(),
            &entry.created_at.to_rfc3339(),
        ])
        .unwrap();
    }

    let csv_data = String::from_utf8(wtr.into_inner().unwrap()).unwrap();

    (
        [
            (header::CONTENT_TYPE, "text/csv"),
            (
                header::CONTENT_DISPOSITION,
                "attachment; filename=\"waitlist.csv\"",
            ),
        ],
        csv_data,
    )
}

// ============ EDITIONS ============

pub async fn list_editions(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<EditionWithMedia>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let editions = if let Some(search) = &query.q {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Edition>(
            r#"
            SELECT ed.* FROM editions ed
            LEFT JOIN artists ar ON ed.artist_id = ar.id
            WHERE ed.title ILIKE $1
                OR ed.medium ILIKE $1
                OR ed.dimensions ILIKE $1
                OR ed.edition_size ILIKE $1
                OR ar.name ILIKE $1
            ORDER BY ed.updated_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_pattern)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Edition>(
            r#"
            SELECT * FROM editions
            ORDER BY updated_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(&state.db)
        .await?
    };

    let mut result = Vec::new();
    for edition in editions {
        let media = sqlx::query_as::<_, Media>(
            r#"
            SELECT m.* FROM media m
            JOIN edition_media em ON m.id = em.media_id
            WHERE em.edition_id = $1
            ORDER BY em.sort_order ASC
            "#,
        )
        .bind(edition.id)
        .fetch_all(&state.db)
        .await?;

        let artist = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
            .bind(edition.artist_id)
            .fetch_optional(&state.db)
            .await?;

        result.push(EditionWithMedia {
            edition,
            media,
            artist_name: artist.as_ref().map(|a| a.name.clone()),
            artist_slug: artist.map(|a| a.slug),
        });
    }

    Ok(Json(result))
}

pub async fn get_edition(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<EditionWithMedia>> {
    let edition = sqlx::query_as::<_, Edition>("SELECT * FROM editions WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Edition not found".to_string()))?;

    let media = sqlx::query_as::<_, Media>(
        r#"
        SELECT m.* FROM media m
        JOIN edition_media em ON m.id = em.media_id
        WHERE em.edition_id = $1
        ORDER BY em.sort_order ASC
        "#,
    )
    .bind(edition.id)
    .fetch_all(&state.db)
    .await?;

    let artist = sqlx::query_as::<_, Artist>("SELECT * FROM artists WHERE id = $1")
        .bind(edition.artist_id)
        .fetch_optional(&state.db)
        .await?;

    Ok(Json(EditionWithMedia {
        edition,
        media,
        artist_name: artist.as_ref().map(|a| a.name.clone()),
        artist_slug: artist.map(|a| a.slug),
    }))
}

pub async fn create_edition(
    State(state): State<AppState>,
    Json(payload): Json<CreateEditionRequest>,
) -> AppResult<Json<Edition>> {
    let slug = slug::slugify(&payload.title);
    let now = Utc::now();
    let published_at = if payload.published.unwrap_or(false) {
        Some(now)
    } else {
        None
    };

    let edition = sqlx::query_as::<_, Edition>(
        r#"
        INSERT INTO editions (artist_id, title, slug, year, medium, dimensions, edition_size, price_note, artsper_url, published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        "#,
    )
    .bind(&payload.artist_id)
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.year)
    .bind(&payload.medium)
    .bind(&payload.dimensions)
    .bind(&payload.edition_size)
    .bind(&payload.price_note)
    .bind(&payload.artsper_url)
    .bind(payload.published.unwrap_or(false))
    .bind(published_at)
    .fetch_one(&state.db)
    .await?;

    // Add media associations
    if let Some(media_ids) = payload.media_ids {
        for (order, media_id) in media_ids.iter().enumerate() {
            sqlx::query(
                "INSERT INTO edition_media (edition_id, media_id, sort_order) VALUES ($1, $2, $3)",
            )
            .bind(edition.id)
            .bind(media_id)
            .bind(order as i32)
            .execute(&state.db)
            .await?;
        }
    }

    Ok(Json(edition))
}

pub async fn update_edition(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateEditionRequest>,
) -> AppResult<Json<Edition>> {
    let now = Utc::now();

    let current = sqlx::query_as::<_, Edition>("SELECT * FROM editions WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Edition not found".to_string()))?;

    let new_slug = payload.title.as_ref().map(|t| slug::slugify(t));

    let published_at = match (current.published, payload.published) {
        (false, Some(true)) => Some(now),
        (_, Some(false)) => None,
        _ => current.published_at,
    };

    let edition = sqlx::query_as::<_, Edition>(
        r#"
        UPDATE editions
        SET artist_id = COALESCE($2, artist_id),
            title = COALESCE($3, title),
            slug = COALESCE($4, slug),
            year = COALESCE($5, year),
            medium = COALESCE($6, medium),
            dimensions = COALESCE($7, dimensions),
            edition_size = COALESCE($8, edition_size),
            price_note = COALESCE($9, price_note),
            artsper_url = COALESCE($10, artsper_url),
            published = COALESCE($11, published),
            published_at = $12,
            updated_at = $13
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.artist_id)
    .bind(&payload.title)
    .bind(&new_slug)
    .bind(&payload.year)
    .bind(&payload.medium)
    .bind(&payload.dimensions)
    .bind(&payload.edition_size)
    .bind(&payload.price_note)
    .bind(&payload.artsper_url)
    .bind(payload.published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    // Update media associations if provided
    if let Some(media_ids) = payload.media_ids {
        sqlx::query("DELETE FROM edition_media WHERE edition_id = $1")
            .bind(id)
            .execute(&state.db)
            .await?;

        for (order, media_id) in media_ids.iter().enumerate() {
            sqlx::query(
                "INSERT INTO edition_media (edition_id, media_id, sort_order) VALUES ($1, $2, $3)",
            )
            .bind(id)
            .bind(media_id)
            .bind(order as i32)
            .execute(&state.db)
            .await?;
        }
    }

    Ok(Json(edition))
}

pub async fn delete_edition(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    sqlx::query("DELETE FROM editions WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}

pub async fn toggle_edition_publish(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Edition>> {
    let current = sqlx::query_as::<_, Edition>("SELECT * FROM editions WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Edition not found".to_string()))?;

    let now = Utc::now();
    let (new_published, published_at) = if current.published {
        (false, None)
    } else {
        (true, Some(now))
    };

    let edition = sqlx::query_as::<_, Edition>(
        r#"
        UPDATE editions
        SET published = $2, published_at = $3, updated_at = $4
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(new_published)
    .bind(published_at)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(edition))
}

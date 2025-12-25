use axum::{
    extract::{Path, Query, State},
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::{
    error::{AppError, AppResult},
    models::*,
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct HomeData {
    pub current_event: Option<EventWithDetails>,
    pub upcoming_events: Vec<EventWithDetails>,
    pub featured_artists: Vec<ArtistWithPortrait>,
    pub latest_posts: Vec<PostWithHero>,
}

pub async fn get_home(State(state): State<AppState>) -> AppResult<Json<HomeData>> {
    let now = Utc::now();

    // Current event (ongoing)
    let current_event = sqlx::query_as::<_, Event>(
        r#"
        SELECT * FROM events
        WHERE published = true
        AND start_at <= $1
        AND (end_at IS NULL OR end_at >= $1)
        ORDER BY start_at DESC
        LIMIT 1
        "#,
    )
    .bind(now)
    .fetch_optional(&state.db)
    .await?;

    let current_event = if let Some(event) = current_event {
        Some(get_event_with_details(&state, event).await?)
    } else {
        None
    };

    // Upcoming events
    let upcoming = sqlx::query_as::<_, Event>(
        r#"
        SELECT * FROM events
        WHERE published = true AND start_at > $1
        ORDER BY start_at ASC
        LIMIT 3
        "#,
    )
    .bind(now)
    .fetch_all(&state.db)
    .await?;

    let mut upcoming_events = Vec::new();
    for event in upcoming {
        upcoming_events.push(get_event_with_details(&state, event).await?);
    }

    // Featured artists (latest published)
    let artists = sqlx::query_as::<_, Artist>(
        r#"
        SELECT * FROM artists
        WHERE published = true
        ORDER BY published_at DESC NULLS LAST
        LIMIT 4
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    let mut featured_artists = Vec::new();
    for artist in artists {
        let portrait = if let Some(media_id) = artist.portrait_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };
        featured_artists.push(ArtistWithPortrait { artist, portrait });
    }

    // Latest posts
    let posts = sqlx::query_as::<_, Post>(
        r#"
        SELECT * FROM posts
        WHERE published = true
        ORDER BY published_at DESC NULLS LAST
        LIMIT 3
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    let mut latest_posts = Vec::new();
    for post in posts {
        let hero = if let Some(media_id) = post.hero_media_id {
            sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
                .bind(media_id)
                .fetch_optional(&state.db)
                .await?
        } else {
            None
        };
        latest_posts.push(PostWithHero { post, hero });
    }

    Ok(Json(HomeData {
        current_event,
        upcoming_events,
        featured_artists,
        latest_posts,
    }))
}

// Artists
pub async fn list_artists(
    State(state): State<AppState>,
    Query(query): Query<PaginationQuery>,
) -> AppResult<Json<Vec<ArtistWithPortrait>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let artists = sqlx::query_as::<_, Artist>(
        r#"
        SELECT * FROM artists
        WHERE published = true
        ORDER BY name ASC
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

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

#[derive(Debug, Serialize)]
pub struct ArtistDetailResponse {
    #[serde(flatten)]
    pub artist: ArtistWithPortrait,
    pub artworks: Vec<ArtworkWithMedia>,
}

pub async fn get_artist(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> AppResult<Json<ArtistDetailResponse>> {
    let artist = sqlx::query_as::<_, Artist>(
        "SELECT * FROM artists WHERE slug = $1 AND published = true",
    )
    .bind(&slug)
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

    let artworks = sqlx::query_as::<_, Artwork>(
        r#"
        SELECT * FROM artworks
        WHERE artist_id = $1 AND published = true
        ORDER BY year DESC NULLS LAST, title ASC
        "#,
    )
    .bind(artist.id)
    .fetch_all(&state.db)
    .await?;

    let mut artworks_with_media = Vec::new();
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

        artworks_with_media.push(ArtworkWithMedia {
            artwork,
            media,
            artist_name: Some(artist.name.clone()),
            artist_slug: Some(artist.slug.clone()),
        });
    }

    Ok(Json(ArtistDetailResponse {
        artist: ArtistWithPortrait { artist, portrait },
        artworks: artworks_with_media,
    }))
}

// Events
pub async fn list_events(
    State(state): State<AppState>,
    Query(query): Query<PaginationQuery>,
) -> AppResult<Json<Vec<EventWithDetails>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let events = sqlx::query_as::<_, Event>(
        r#"
        SELECT * FROM events
        WHERE published = true
        ORDER BY start_at DESC
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    let mut result = Vec::new();
    for event in events {
        result.push(get_event_with_details(&state, event).await?);
    }

    Ok(Json(result))
}

pub async fn get_event(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> AppResult<Json<EventWithDetails>> {
    let event = sqlx::query_as::<_, Event>(
        "SELECT * FROM events WHERE slug = $1 AND published = true",
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Event not found".to_string()))?;

    Ok(Json(get_event_with_details(&state, event).await?))
}

async fn get_event_with_details(state: &AppState, event: Event) -> AppResult<EventWithDetails> {
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
        ORDER BY a.name ASC
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

    Ok(EventWithDetails {
        event,
        hero,
        artists: artists_with_portrait,
    })
}

// Posts
pub async fn list_posts(
    State(state): State<AppState>,
    Query(query): Query<PaginationQuery>,
) -> AppResult<Json<Vec<PostWithHero>>> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    let posts = sqlx::query_as::<_, Post>(
        r#"
        SELECT * FROM posts
        WHERE published = true
        ORDER BY published_at DESC NULLS LAST
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

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
    Path(slug): Path<String>,
) -> AppResult<Json<PostWithHero>> {
    let post = sqlx::query_as::<_, Post>(
        "SELECT * FROM posts WHERE slug = $1 AND published = true",
    )
    .bind(&slug)
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

// Pages
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

// Contact
pub async fn create_contact(
    State(state): State<AppState>,
    Json(payload): Json<CreateContactRequest>,
) -> AppResult<Json<ContactMessage>> {
    let created = sqlx::query_as::<_, ContactMessage>(
        r#"
        INSERT INTO contact_messages (name, email, message)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&payload.message)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(created))
}

// Waitlist
pub async fn create_waitlist(
    State(state): State<AppState>,
    Json(payload): Json<CreateWaitlistRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Try to insert, ignore if duplicate
    let result = sqlx::query(
        r#"
        INSERT INTO labomaton_waitlist (email, source)
        VALUES ($1, $2)
        ON CONFLICT (email) DO NOTHING
        "#,
    )
    .bind(&payload.email)
    .bind(&payload.source)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": if result.rows_affected() > 0 {
            "Successfully joined the waitlist"
        } else {
            "You are already on the waitlist"
        }
    })))
}

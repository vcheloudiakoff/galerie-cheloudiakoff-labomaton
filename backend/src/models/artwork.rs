use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

use super::Media;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Artwork {
    pub id: Uuid,
    pub artist_id: Uuid,
    pub title: String,
    pub slug: String,
    pub year: Option<i32>,
    pub medium: Option<String>,
    pub dimensions: Option<String>,
    pub price_note: Option<String>,
    pub artsper_url: Option<String>,
    pub published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ArtworkWithMedia {
    #[serde(flatten)]
    pub artwork: Artwork,
    pub media: Vec<Media>,
    pub artist_name: Option<String>,
    pub artist_slug: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateArtworkRequest {
    pub artist_id: Uuid,
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: String,
    pub year: Option<i32>,
    pub medium: Option<String>,
    pub dimensions: Option<String>,
    pub price_note: Option<String>,
    #[validate(url(message = "Invalid Artsper URL"))]
    pub artsper_url: Option<String>,
    pub media_ids: Option<Vec<Uuid>>,
    pub published: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateArtworkRequest {
    pub artist_id: Option<Uuid>,
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: Option<String>,
    pub year: Option<i32>,
    pub medium: Option<String>,
    pub dimensions: Option<String>,
    pub price_note: Option<String>,
    #[validate(url(message = "Invalid Artsper URL"))]
    pub artsper_url: Option<String>,
    pub media_ids: Option<Vec<Uuid>>,
    pub published: Option<bool>,
}

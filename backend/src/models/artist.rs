use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

use super::Media;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Artist {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub bio_md: Option<String>,
    pub portrait_media_id: Option<Uuid>,
    pub artsper_url: Option<String>,
    pub website_url: Option<String>,
    pub instagram_url: Option<String>,
    pub published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ArtistWithPortrait {
    #[serde(flatten)]
    pub artist: Artist,
    pub portrait: Option<Media>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateArtistRequest {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    pub bio_md: Option<String>,
    pub portrait_media_id: Option<Uuid>,
    #[validate(url(message = "Invalid Artsper URL"))]
    pub artsper_url: Option<String>,
    #[validate(url(message = "Invalid website URL"))]
    pub website_url: Option<String>,
    #[validate(url(message = "Invalid Instagram URL"))]
    pub instagram_url: Option<String>,
    pub published: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateArtistRequest {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: Option<String>,
    pub bio_md: Option<String>,
    pub portrait_media_id: Option<Uuid>,
    #[validate(url(message = "Invalid Artsper URL"))]
    pub artsper_url: Option<String>,
    #[validate(url(message = "Invalid website URL"))]
    pub website_url: Option<String>,
    #[validate(url(message = "Invalid Instagram URL"))]
    pub instagram_url: Option<String>,
    pub published: Option<bool>,
}

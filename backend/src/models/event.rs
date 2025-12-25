use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

use super::{ArtistWithPortrait, Media};

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Event {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub start_at: DateTime<Utc>,
    pub end_at: Option<DateTime<Utc>>,
    pub location: Option<String>,
    pub description_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct EventWithDetails {
    #[serde(flatten)]
    pub event: Event,
    pub hero: Option<Media>,
    pub artists: Vec<ArtistWithPortrait>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEventRequest {
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: String,
    pub start_at: DateTime<Utc>,
    pub end_at: Option<DateTime<Utc>>,
    pub location: Option<String>,
    pub description_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub artist_ids: Option<Vec<Uuid>>,
    pub published: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEventRequest {
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: Option<String>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_at: Option<DateTime<Utc>>,
    pub location: Option<String>,
    pub description_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub artist_ids: Option<Vec<Uuid>>,
    pub published: Option<bool>,
}

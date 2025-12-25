use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

use super::Media;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Page {
    pub key: String,
    pub title: String,
    pub body_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PageWithHero {
    #[serde(flatten)]
    pub page: Page,
    pub hero: Option<Media>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePageRequest {
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: Option<String>,
    pub body_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
}

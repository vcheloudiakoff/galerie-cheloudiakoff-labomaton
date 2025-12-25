use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

use super::Media;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Post {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub body_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PostWithHero {
    #[serde(flatten)]
    pub post: Post,
    pub hero: Option<Media>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePostRequest {
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: String,
    pub body_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub published: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePostRequest {
    #[validate(length(min = 1, message = "Title is required"))]
    pub title: Option<String>,
    pub body_md: Option<String>,
    pub hero_media_id: Option<Uuid>,
    pub published: Option<bool>,
}

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Media {
    pub id: Uuid,
    pub filename: String,
    pub url: String,
    pub alt: Option<String>,
    pub credit: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMediaRequest {
    pub alt: Option<String>,
    pub credit: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMediaRequest {
    pub alt: Option<String>,
    pub credit: Option<String>,
}

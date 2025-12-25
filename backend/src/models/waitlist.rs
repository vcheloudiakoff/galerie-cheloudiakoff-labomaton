use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct WaitlistEntry {
    pub id: Uuid,
    pub email: String,
    pub source: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateWaitlistRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    pub source: Option<String>,
}

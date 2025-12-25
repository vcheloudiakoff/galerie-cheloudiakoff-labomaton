use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct ContactMessage {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub message: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateContactRequest {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 10, message = "Message must be at least 10 characters"))]
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateContactStatusRequest {
    pub status: String,
}

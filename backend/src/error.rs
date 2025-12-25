use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    Conflict(String),
    Internal(String),
    Validation(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            AppError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg),
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {:?}", err);
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Resource not found".to_string()),
            sqlx::Error::Database(db_err) if db_err.is_unique_violation() => {
                AppError::Conflict("Resource already exists".to_string())
            }
            _ => AppError::Internal("Database error".to_string()),
        }
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(_: jsonwebtoken::errors::Error) -> Self {
        AppError::Unauthorized("Invalid token".to_string())
    }
}

impl From<aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::put_object::PutObjectError>>
    for AppError
{
    fn from(err: aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::put_object::PutObjectError>) -> Self {
        tracing::error!("S3 upload error: {:?}", err);
        AppError::Internal("Failed to upload file".to_string())
    }
}

impl From<aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::delete_object::DeleteObjectError>>
    for AppError
{
    fn from(err: aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::delete_object::DeleteObjectError>) -> Self {
        tracing::error!("S3 delete error: {:?}", err);
        AppError::Internal("Failed to delete file".to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;

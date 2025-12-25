use axum::{
    body::Body,
    extract::Request,
    http::header::AUTHORIZATION,
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::error::AppError;

use super::jwt::verify_token;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub role: String,
}

pub async fn require_auth(
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_default();

    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization header".to_string()))?;

    let claims = verify_token(token, &jwt_secret)?;

    let user = AuthUser {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
    };

    request.extensions_mut().insert(user);

    Ok(next.run(request).await)
}

pub async fn require_admin(
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_default();

    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization header".to_string()))?;

    let claims = verify_token(token, &jwt_secret)?;

    if claims.role != "admin" {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    let user = AuthUser {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
    };

    request.extensions_mut().insert(user);

    Ok(next.run(request).await)
}

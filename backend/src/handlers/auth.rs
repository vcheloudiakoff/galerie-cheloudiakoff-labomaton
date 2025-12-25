use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{extract::State, Extension, Json};

use crate::{
    auth::{create_token, AuthUser},
    error::{AppError, AppResult},
    models::{LoginRequest, LoginResponse, User, UserResponse},
    AppState,
};

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> AppResult<Json<LoginResponse>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::Internal("Invalid password hash".to_string()))?;

    Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid credentials".to_string()))?;

    let token = create_token(user.id, &user.email, &user.role, &state.config.jwt_secret)?;

    Ok(Json(LoginResponse {
        token,
        user: user.into(),
    }))
}

pub async fn me(Extension(user): Extension<AuthUser>) -> AppResult<Json<UserResponse>> {
    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        role: user.role,
    }))
}

use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHasher,
};
use sqlx::PgPool;

use crate::config::Config;

pub async fn seed_admin(pool: &PgPool, config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        .fetch_one(pool)
        .await?;

    if existing > 0 {
        tracing::info!("Admin user already exists, skipping seed");
        return Ok(());
    }

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(config.admin_password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to hash password: {}", e))?
        .to_string();

    sqlx::query(
        r#"
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, 'admin')
        "#,
    )
    .bind(&config.admin_email)
    .bind(&password_hash)
    .execute(pool)
    .await?;

    tracing::info!("Admin user created: {}", config.admin_email);
    Ok(())
}

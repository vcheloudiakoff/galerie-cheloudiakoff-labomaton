use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub s3_endpoint: String,
    pub s3_region: String,
    pub s3_bucket: String,
    pub s3_access_key: String,
    pub s3_secret_key: String,
    pub s3_public_url: String,
    pub host: String,
    pub port: u16,
    pub admin_email: String,
    pub admin_password: String,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        Ok(Self {
            database_url: env::var("DATABASE_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            s3_endpoint: env::var("S3_ENDPOINT")?,
            s3_region: env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
            s3_bucket: env::var("S3_BUCKET")?,
            s3_access_key: env::var("S3_ACCESS_KEY")?,
            s3_secret_key: env::var("S3_SECRET_KEY")?,
            s3_public_url: env::var("S3_PUBLIC_URL")?,
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
            admin_email: env::var("ADMIN_EMAIL")?,
            admin_password: env::var("ADMIN_PASSWORD")?,
        })
    }
}

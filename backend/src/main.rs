use std::net::SocketAddr;
use std::sync::Arc;

use aws_sdk_s3::config::Credentials;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod config;
mod db;
mod error;
mod handlers;
mod models;
mod routes;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<Config>,
    pub s3_client: aws_sdk_s3::Client,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "galerie_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    tracing::info!("Running migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;

    let credentials = Credentials::new(
        &config.s3_access_key,
        &config.s3_secret_key,
        None,
        None,
        "static",
    );

    let s3_client = aws_sdk_s3::Client::from_conf(
        aws_sdk_s3::Config::builder()
            .behavior_version(aws_sdk_s3::config::BehaviorVersion::latest())
            .endpoint_url(&config.s3_endpoint)
            .region(aws_sdk_s3::config::Region::new(config.s3_region.clone()))
            .credentials_provider(credentials)
            .force_path_style(true)
            .build(),
    );

    db::seed_admin(&pool, &config).await?;

    let state = AppState {
        db: pool,
        config: Arc::new(config.clone()),
        s3_client,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .nest("/api", routes::api_routes())
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
    tracing::info!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

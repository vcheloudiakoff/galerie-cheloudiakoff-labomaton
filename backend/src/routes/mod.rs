use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

use crate::{auth, handlers, AppState};

pub fn api_routes() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth_routes())
        .nest("/public", public_routes())
        .nest("/admin", admin_routes())
}

fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(handlers::auth::login))
        .route(
            "/me",
            get(handlers::auth::me).route_layer(middleware::from_fn(auth::require_auth)),
        )
}

fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/home", get(handlers::public::get_home))
        .route("/artists", get(handlers::public::list_artists))
        .route("/artists/{slug}", get(handlers::public::get_artist))
        .route("/events", get(handlers::public::list_events))
        .route("/events/{slug}", get(handlers::public::get_event))
        .route("/posts", get(handlers::public::list_posts))
        .route("/posts/{slug}", get(handlers::public::get_post))
        .route("/pages/{key}", get(handlers::public::get_page))
        .route("/contact", post(handlers::public::create_contact))
        .route("/waitlist", post(handlers::public::create_waitlist))
}

fn admin_routes() -> Router<AppState> {
    Router::new()
        // Media
        .route("/media", get(handlers::admin::list_media))
        .route("/media", post(handlers::admin::upload_media))
        .route("/media/{id}", put(handlers::admin::update_media))
        .route("/media/{id}", delete(handlers::admin::delete_media))
        // Artists
        .route("/artists", get(handlers::admin::list_artists))
        .route("/artists", post(handlers::admin::create_artist))
        .route("/artists/{id}", get(handlers::admin::get_artist))
        .route("/artists/{id}", put(handlers::admin::update_artist))
        .route("/artists/{id}", delete(handlers::admin::delete_artist))
        .route(
            "/artists/{id}/publish",
            post(handlers::admin::toggle_artist_publish),
        )
        // Artworks
        .route("/artworks", get(handlers::admin::list_artworks))
        .route("/artworks", post(handlers::admin::create_artwork))
        .route("/artworks/{id}", get(handlers::admin::get_artwork))
        .route("/artworks/{id}", put(handlers::admin::update_artwork))
        .route("/artworks/{id}", delete(handlers::admin::delete_artwork))
        // Events
        .route("/events", get(handlers::admin::list_events))
        .route("/events", post(handlers::admin::create_event))
        .route("/events/{id}", get(handlers::admin::get_event))
        .route("/events/{id}", put(handlers::admin::update_event))
        .route("/events/{id}", delete(handlers::admin::delete_event))
        // Posts
        .route("/posts", get(handlers::admin::list_posts))
        .route("/posts", post(handlers::admin::create_post))
        .route("/posts/{id}", get(handlers::admin::get_post))
        .route("/posts/{id}", put(handlers::admin::update_post))
        .route("/posts/{id}", delete(handlers::admin::delete_post))
        // Pages
        .route("/pages", get(handlers::admin::list_pages))
        .route("/pages/{key}", get(handlers::admin::get_page))
        .route("/pages/{key}", put(handlers::admin::update_page))
        // Messages
        .route("/messages", get(handlers::admin::list_messages))
        .route(
            "/messages/{id}/status",
            put(handlers::admin::update_message_status),
        )
        // Waitlist
        .route("/waitlist", get(handlers::admin::list_waitlist))
        .route("/waitlist/export", get(handlers::admin::export_waitlist))
        .route_layer(middleware::from_fn(auth::require_auth))
}

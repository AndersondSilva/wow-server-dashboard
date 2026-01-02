use axum::{
    routing::{get, post, put},
    Router,
    extract::State,
    response::Json,
    http::Method,
};
use mongodb::{Client, options::ClientOptions};
use sqlx::mysql::MySqlPoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use dotenvy::dotenv;
use std::env;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod models;
mod handlers;

#[derive(Clone)]
pub struct AppState {
    pub mongo: mongodb::Database,
    pub mysql_auth: sqlx::MySqlPool,
    pub mysql_char: sqlx::MySqlPool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!(">>> RUST BACKEND STARTING...");
    dotenv().ok();
    
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    println!(">>> Logger initialized.");

    let mongo_uri = env::var("MONGODB_URI").expect("MONGODB_URI must be set");
    let mysql_user = env::var("DB_USER").unwrap_or_else(|_| "wowuser".to_string());
    let mysql_pass = env::var("DB_PASS").unwrap_or_else(|_| "".to_string());
    let mysql_host = env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string());
    let db_auth = env::var("DB_AUTH").unwrap_or_else(|_| "acore_auth".to_string());
    let db_char = env::var("DB_CHAR").unwrap_or_else(|_| "characters".to_string());

    tracing::info!("Connecting to MongoDB at {}", mongo_uri);
    // MongoDB Connection
    let mut client_options = ClientOptions::parse(&mongo_uri).await?;
    let client = Client::with_options(client_options)?;
    let mongo_db = client.database("wow_dashboard");
    tracing::info!("MongoDB connected");

    tracing::info!("Connecting to MySQL at {}", mysql_host);
    // MySQL Connections
    let mysql_auth_url = format!("mysql://{}:{}@{}/{}", mysql_user, mysql_pass, mysql_host, db_auth);
    let mysql_char_url = format!("mysql://{}:{}@{}/{}", mysql_user, mysql_pass, mysql_host, db_char);
    
    let mysql_auth_pool = match MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&mysql_auth_url)
        .await {
            Ok(pool) => {
                tracing::info!("Connected to MySQL Auth DB");
                pool
            },
            Err(e) => {
                tracing::error!("Failed to connect to MySQL Auth DB: {}", e);
                return Err(e.into());
            }
        };

    let mysql_char_pool = match MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&mysql_char_url)
        .await {
            Ok(pool) => {
                tracing::info!("Connected to MySQL Char DB");
                pool
            },
            Err(e) => {
                tracing::error!("Failed to connect to MySQL Char DB: {}", e);
                return Err(e.into());
            }
        };

    // Initialize Realmlist
    if let Err(e) = init_realmlist(&mysql_auth_pool).await {
        tracing::warn!("Failed to initialize realmlist: {}", e);
    }

    let state = AppState {
        mongo: mongo_db,
        mysql_auth: mysql_auth_pool,
        mysql_char: mysql_char_pool,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any) 
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/auth/signup", post(handlers::signup))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/google", post(handlers::login_google))
        .route("/api/auth/login-game", post(handlers::login_game))
        .route("/api/auth/me", get(handlers::me))
        .route("/api/auth/profile", put(handlers::update_profile))
        .route("/api/auth/check-username", post(handlers::check_username))
        .route("/api/characters", get(handlers::list_characters))
        .route("/api/admin/config", get(handlers::get_server_config).put(handlers::update_server_config))
        .layer(cors)
        .with_state(state);

    let port = env::var("PORT").unwrap_or_else(|_| "4000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "backend": "rust" }))
}

async fn init_realmlist(pool: &sqlx::MySqlPool) -> Result<(), sqlx::Error> {
    tracing::info!("Initializing Realmlist...");
    
    // Check if realmlist exists and update, or insert if missing
    // We set address to game.aethelgard-wow.com and port 8085
    let rows_affected = sqlx::query("UPDATE realmlist SET address = ?, name = ?, port = 8085 WHERE id = 1")
        .bind("game.aethelgard-wow.com")
        .bind("Aethelgard")
        .execute(pool)
        .await?
        .rows_affected();

    if rows_affected == 0 {
        tracing::info!("Realmlist id 1 not found, inserting...");
        // Default values for other columns: icon=1, color=0, timezone=1, allowedSecurityLevel=0, population=0
        sqlx::query("INSERT INTO realmlist (id, name, address, port, icon, color, timezone, allowedSecurityLevel, population) VALUES (1, ?, ?, 8085, 1, 0, 1, 0, 0)")
            .bind("Aethelgard")
            .bind("game.aethelgard-wow.com")
            .execute(pool)
            .await?;
    } else {
        tracing::info!("Realmlist updated successfully.");
    }
    
    Ok(())
}

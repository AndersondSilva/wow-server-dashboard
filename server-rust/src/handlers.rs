use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use crate::{AppState, models::{User, CreateUserRequest, LoginRequest, LoginResponse, UserResponse, GoogleLoginRequest, LoginGameRequest}};
use mongodb::{bson::doc, bson::oid::ObjectId, Collection};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use sqlx::Row;
use sha1::{Sha1, Digest};
use rand::{distributions::Alphanumeric, Rng};

use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
    role: String,
}

#[derive(Debug, Deserialize)]
struct GoogleTokenInfo {
    email: String,
    name: Option<String>,
    picture: Option<String>,
    given_name: Option<String>,
    family_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CheckUsernameRequest {
    username: String,
}

#[derive(Debug, Serialize)]
pub struct CheckUsernameResponse {
    available: bool,
}

fn generate_random_password() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(10)
        .map(char::from)
        .collect()
}

async fn send_game_password_email(email: &str, username: &str, password: &str) -> Result<(), String> {
    let smtp_host = std::env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string());
    let smtp_user = std::env::var("SMTP_USER").unwrap_or_default();
    let smtp_pass = std::env::var("SMTP_PASS").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@aethelgard-wow.com".to_string());

    if smtp_user.is_empty() || smtp_pass.is_empty() {
        tracing::warn!("SMTP credentials not set. Skipping email sending for {}", email);
        tracing::info!("Mock Email - To: {}, User: {}, Pass: {}", email, username, password);
        return Ok(());
    }

    let email_content = Message::builder()
        .from(smtp_from.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .to(email.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .subject("Welcome to Aethelgard WoW!")
        .body(format!(
            "Welcome, Hero!\n\nYour account has been created successfully.\n\nGame Username: {}\nGame Password: {}\n\nRealmlist: set realmlist game.aethelgard-wow.com\n\nSee you in Azeroth!",
            username, password
        ))
        .map_err(|e| e.to_string())?;

    let creds = Credentials::new(smtp_user, smtp_pass);

    let mailer = SmtpTransport::relay(&smtp_host)
        .map_err(|e| e.to_string())?
        .credentials(creds)
        .build();

    // Run in blocking task because lettre is sync (unless using tokio1 feature properly, but relay might be blocking in builder)
    // Actually we enabled 'tokio1' feature in Cargo.toml, so we should use AsyncTransport if available, 
    // but SmtpTransport in recent lettre versions with tokio1 feature usually implies using `send` which is async?
    // Let's check lettre docs or just use blocking for now to be safe/simple or wrap in spawn_blocking.
    // The `AsyncTransport` trait is what we want.
    
    // For simplicity in this context without fighting trait bounds:
    // We will use the sync transport in a blocking thread.
    
    tokio::task::spawn_blocking(move || {
        match mailer.send(&email_content) {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }).await.map_err(|e| e.to_string())??;

    Ok(())
}

pub async fn check_username(
    State(state): State<AppState>,
    Json(payload): Json<CheckUsernameRequest>,
) -> impl IntoResponse {
    let query = "SELECT count(*) as count FROM account WHERE username = ?";
    let count: i64 = match sqlx::query_scalar(query)
        .bind(&payload.username.to_uppercase())
        .fetch_one(&state.mysql_auth)
        .await {
            Ok(c) => c,
            Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
        };

    Json(CheckUsernameResponse { available: count == 0 }).into_response()
}

pub async fn signup(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> impl IntoResponse {
    let collection: Collection<User> = state.mongo.collection("users");

    // Check if user exists in Mongo
    if let Ok(Some(_)) = collection.find_one(doc! { "email": &payload.email }, None).await {
        return (StatusCode::CONFLICT, "Email already exists").into_response();
    }

    // Try to create game account (MySQL)
    // For manual signup, we try to use the nickname as username
    let game_username = payload.nickname.to_uppercase();
    
    // If password provided, use it. If not, generate it.
    let (game_password, is_generated) = match payload.password.as_ref() {
        Some(p) if !p.is_empty() => (p.clone(), false),
        _ => (generate_random_password(), true),
    };

    let to_hash = format!("{}:{}", game_username, game_password.to_uppercase());
    
    let mut hasher = Sha1::new();
    hasher.update(to_hash);
    let result = hasher.finalize();
    let sha_pass_hash = hex::encode(result);

    // Insert into MySQL account table
    // Note: 'expansion' 2 = WotLK
    let mysql_query = "INSERT INTO account (username, sha_pass_hash, email, expansion) VALUES (?, ?, ?, 2)";
    
    let game_account_id = match sqlx::query(mysql_query)
        .bind(&game_username)
        .bind(&sha_pass_hash)
        .bind(&payload.email)
        .execute(&state.mysql_auth)
        .await {
            Ok(result) => Some(result.last_insert_id() as u32),
            Err(e) => {
                tracing::error!("Failed to create MySQL account: {}", e);
                if e.to_string().contains("Duplicate entry") {
                     return (StatusCode::CONFLICT, "Game username already exists").into_response();
                }
                None
            }
        };

    // If we generated a password, send it via email
    if is_generated {
        if let Err(e) = send_game_password_email(&payload.email, &game_username, &game_password).await {
            tracing::error!("Failed to send password email: {}", e);
            // We don't fail the signup, but maybe we should warn?
        }
    }

    // For the dashboard password hash:
    // If user provided a password, hash it.
    // If auto-generated, we can still hash it so they can login to dashboard with it, 
    // OR we set a flag that they need to set a password.
    // Let's hash the used password (whether generated or provided) so they can use it for dashboard too.
    let password_hash = match hash(&game_password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Password hashing failed").into_response(),
    };

    let user = User {
        id: None,
        nickname: payload.nickname,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password_hash,
        avatar_url: payload.avatar_url,
        role: "user".to_string(),
        game_id: game_account_id,
        created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64,
    };

    match collection.insert_one(user, None).await {
        Ok(_) => (StatusCode::CREATED, "User created").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create user").into_response(),
    }
}


pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let collection: Collection<User> = state.mongo.collection("users");

    let user = match collection.find_one(doc! { "email": &payload.email }, None).await {
        Ok(Some(u)) => u,
        Ok(None) => return (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    };

    if !verify(&payload.password, &user.password_hash).unwrap_or(false) {
        return (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response();
    }

    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize + 24 * 3600; // 24 hours

    let claims = Claims {
        sub: user.id.unwrap().to_hex(),
        exp: expiration,
        role: user.role.clone(),
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token = match encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes())) {
        Ok(t) => t,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Token creation failed").into_response(),
    };

    Json(LoginResponse {
        token,
        user: UserResponse {
            id: user.id.unwrap().to_hex(),
            name: user.nickname.clone(),
            nickname: user.nickname.clone(),
            email: user.email,
            first_name: Some(user.first_name),
            last_name: Some(user.last_name),
            avatar_url: user.avatar_url,
            is_admin: user.role == "admin",
            game_id: user.game_id,
        },
    }).into_response()
}

pub async fn login_google(
    State(state): State<AppState>,
    Json(payload): Json<GoogleLoginRequest>,
) -> impl IntoResponse {
    // Validate token with Google
    let client = reqwest::Client::new();
    let resp = match client.get("https://oauth2.googleapis.com/tokeninfo")
        .query(&[("id_token", &payload.token)])
        .send()
        .await {
            Ok(r) => r,
            Err(_) => return (StatusCode::BAD_REQUEST, "Failed to contact Google").into_response(),
        };

    if !resp.status().is_success() {
        return (StatusCode::UNAUTHORIZED, "Invalid Google token").into_response();
    }

    let google_user: GoogleTokenInfo = match resp.json().await {
        Ok(u) => u,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to parse Google response").into_response(),
    };

    let collection: Collection<User> = state.mongo.collection("users");
    
    // Check if user exists
    let user = match collection.find_one(doc! { "email": &google_user.email }, None).await {
        Ok(Some(u)) => {
             // Check for hardcoded admin email
             if u.email == "andersonjsilva@outlook.com" && u.role != "admin" {
                let _ = collection.update_one(
                    doc! { "_id": u.id },
                    doc! { "$set": { "role": "admin" } },
                    None
                ).await;
                // Return updated user object
                let mut updated_u = u;
                updated_u.role = "admin".to_string();
                updated_u
             } else {
                u
             }
        },
        Ok(None) => {
            // Create new user logic
            
            // 1. Generate Game Account Credentials
            // Username: email prefix (sanitized) + random suffix if needed? 
            // Let's start with email prefix.
            let email_prefix = google_user.email.split('@').next().unwrap_or("Player").to_string();
            // Sanitize: only alphanum
            let safe_prefix: String = email_prefix.chars().filter(|c| c.is_alphanumeric()).collect();
            // Ensure unique username by adding random suffix? 
            // For now, let's just append 4 random chars to ensure uniqueness and "gamer tag" feel
            let random_suffix: String = rand::thread_rng().sample_iter(&Alphanumeric).take(4).map(char::from).collect();
            let game_username = format!("{}{}", safe_prefix, random_suffix).to_uppercase();
            let game_password = generate_random_password();
            
            // 2. Hash Password for WoW (SHA1(UPPER(USER):UPPER(PASS)))
            let to_hash = format!("{}:{}", game_username, game_password.to_uppercase());
            let mut hasher = Sha1::new();
            hasher.update(to_hash);
            let sha_pass_hash = hex::encode(hasher.finalize());

            // 3. Create Account in MySQL
            let mysql_query = "INSERT INTO account (username, sha_pass_hash, email, expansion) VALUES (?, ?, ?, 2)";
            let game_account_id = match sqlx::query(mysql_query)
                .bind(&game_username)
                .bind(&sha_pass_hash)
                .bind(&google_user.email)
                .execute(&state.mysql_auth)
                .await {
                    Ok(res) => Some(res.last_insert_id() as u32),
                    Err(e) => {
                        tracing::error!("Failed to create MySQL account for Google user: {}", e);
                        None
                    }
                };

            // 4. Send Email
            if let Err(e) = send_game_password_email(&google_user.email, &game_username, &game_password).await {
                tracing::error!("Failed to send password email to Google user: {}", e);
            }


            let nickname = google_user.name.clone().unwrap_or_else(|| safe_prefix);
            let first_name = google_user.given_name.unwrap_or_else(|| "User".to_string());
            let last_name = google_user.family_name.unwrap_or_else(|| "".to_string());
            
            let role = if google_user.email == "andersonjsilva@outlook.com" {
                "admin".to_string()
            } else {
                "user".to_string()
            };

            let new_user = User {
                id: None,
                nickname: nickname.clone(),
                first_name: first_name.clone(),
                last_name: last_name.clone(),
                email: google_user.email.clone(),
                password_hash: "".to_string(),
                avatar_url: google_user.picture.clone(),
                role,
                game_id: game_account_id,
                created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64,
            };

            let insert_result = match collection.insert_one(new_user, None).await {
                Ok(r) => r,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create user").into_response(),
            };

            // Fetch the created user to get the ID
            let oid = insert_result.inserted_id.as_object_id().unwrap();
             User {
                id: Some(oid),
                nickname,
                first_name,
                last_name,
                email: google_user.email,
                password_hash: "".to_string(), // Don't need hash here
                avatar_url: google_user.picture,
                role: "user".to_string(),
                game_id: game_account_id,
                created_at: 0,
            }
        },
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    };

    // Generate JWT
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize + 24 * 3600; // 24 hours

    let claims = Claims {
        sub: user.id.unwrap().to_hex(),
        exp: expiration,
        role: user.role.clone(),
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token = match encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes())) {
        Ok(t) => t,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Token creation failed").into_response(),
    };

    Json(LoginResponse {
        token,
        user: UserResponse {
            id: user.id.unwrap().to_hex(),
            name: user.nickname.clone(),
            nickname: user.nickname.clone(),
            email: user.email,
            first_name: Some(user.first_name),
            last_name: Some(user.last_name),
            avatar_url: google_user.picture,
            is_admin: user.role == "admin",
            game_id: user.game_id,
        },
    }).into_response()
}

pub async fn me(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> impl IntoResponse {
    let token = match headers.get("Authorization") {
        Some(value) => value.to_str().unwrap_or("").replace("Bearer ", ""),
        None => return (StatusCode::UNAUTHORIZED, "Missing token").into_response(),
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token_data = match jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    ) {
        Ok(data) => data,
        Err(_) => return (StatusCode::UNAUTHORIZED, "Invalid token").into_response(),
    };

    let collection: Collection<User> = state.mongo.collection("users");
    let oid = match ObjectId::parse_str(&token_data.claims.sub) {
        Ok(oid) => oid,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid user ID").into_response(),
    };

    match collection.find_one(doc! { "_id": oid }, None).await {
        Ok(Some(user)) => Json(UserResponse {
            id: user.id.unwrap().to_hex(),
            name: user.nickname.clone(),
            nickname: user.nickname.clone(),
            email: user.email,
            first_name: Some(user.first_name),
            last_name: Some(user.last_name),
            avatar_url: user.avatar_url,
            is_admin: user.role == "admin",
            game_id: user.game_id,
        }).into_response(),
        _ => (StatusCode::NOT_FOUND, "User not found").into_response(),
    }
}

pub async fn list_characters(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // This is just a test endpoint to verify MySQL connection
    // In real app, we would filter by user account
    let query = "SELECT name, race, class, level FROM characters LIMIT 10";
    
    let rows = match sqlx::query(query)
        .fetch_all(&state.mysql_char)
        .await {
            Ok(rows) => rows,
            Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("MySQL error: {}", e)).into_response(),
        };

    let characters: Vec<serde_json::Value> = rows.iter().map(|row| {
        serde_json::json!({
            "name": row.try_get::<String, _>("name").unwrap_or_default(),
            "race": row.try_get::<u8, _>("race").unwrap_or_default(),
            "class": row.try_get::<u8, _>("class").unwrap_or_default(),
            "level": row.try_get::<u8, _>("level").unwrap_or_default(),
        })
    }).collect();

    Json(characters).into_response()
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub email: Option<String>,
    #[serde(rename = "firstName")]
    pub first_name: Option<String>,
    #[serde(rename = "lastName")]
    pub last_name: Option<String>,
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    pub nickname: Option<String>,
}

pub async fn update_profile(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<UpdateProfileRequest>,
) -> impl IntoResponse {
    let token = match headers.get("Authorization") {
        Some(value) => value.to_str().unwrap_or("").replace("Bearer ", ""),
        None => return (StatusCode::UNAUTHORIZED, "Missing token").into_response(),
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token_data = match jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    ) {
        Ok(data) => data,
        Err(_) => return (StatusCode::UNAUTHORIZED, "Invalid token").into_response(),
    };

    let oid = match ObjectId::parse_str(&token_data.claims.sub) {
        Ok(oid) => oid,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid user ID").into_response(),
    };

    let collection: Collection<User> = state.mongo.collection("users");

    // Fetch current user to check for email change
    let current_user = match collection.find_one(doc! { "_id": oid }, None).await {
        Ok(Some(u)) => u,
        _ => return (StatusCode::NOT_FOUND, "User not found").into_response(),
    };

    let mut update_doc = doc! {};
    let mut email_changed = false;
    let mut new_email = String::new();

    if let Some(email) = &payload.email {
        if email != &current_user.email {
            // Check if email already exists
             if let Ok(Some(_)) = collection.find_one(doc! { "email": email }, None).await {
                return (StatusCode::CONFLICT, "Email already exists").into_response();
            }
            update_doc.insert("email", email);
            email_changed = true;
            new_email = email.clone();
        }
    }
    if let Some(first_name) = &payload.first_name {
        update_doc.insert("firstName", first_name);
    }
    if let Some(last_name) = &payload.last_name {
        update_doc.insert("lastName", last_name);
    }
    if let Some(avatar_url) = &payload.avatar_url {
        update_doc.insert("avatarUrl", avatar_url);
    }
    if let Some(nickname) = &payload.nickname {
        update_doc.insert("nickname", nickname);
    }

    if update_doc.is_empty() {
        return (StatusCode::OK, "No changes").into_response();
    }

    if let Err(_) = collection.update_one(doc! { "_id": oid }, doc! { "$set": update_doc }, None).await {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update user").into_response();
    }

    // If email changed, update MySQL account
    if email_changed {
        if let Some(game_id) = current_user.game_id {
            // Update email in account table
            let query = "UPDATE account SET email = ? WHERE id = ?";
            if let Err(e) = sqlx::query(query)
                .bind(&new_email)
                .bind(game_id)
                .execute(&state.mysql_auth)
                .await {
                    tracing::error!("Failed to update MySQL email for account {}: {}", game_id, e);
                    // Warning: data inconsistency between Mongo and MySQL if this fails
                }
        }
    }

    // Return updated user
    let updated_user = UserResponse {
        id: current_user.id.unwrap().to_hex(),
        name: payload.nickname.clone().unwrap_or(current_user.nickname.clone()),
        nickname: payload.nickname.unwrap_or(current_user.nickname),
        email: if email_changed { new_email } else { current_user.email },
        first_name: Some(payload.first_name.unwrap_or(current_user.first_name)),
        last_name: Some(payload.last_name.unwrap_or(current_user.last_name)),
        avatar_url: payload.avatar_url.or(current_user.avatar_url),
        is_admin: current_user.role == "admin",
        game_id: current_user.game_id,
    };

    Json(updated_user).into_response()
}

pub async fn get_server_config(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let collection: Collection<crate::models::ServerConfig> = state.mongo.collection("server_config");
    
    match collection.find_one(doc! {}, None).await {
        Ok(Some(config)) => Json(config).into_response(),
        Ok(None) => {
            // Return default config
            Json(crate::models::ServerConfig {
                id: None,
                server_name: "Aethelgard WoW".to_string(),
                realmlist: "game.aethelgard-wow.com".to_string(),
                expansion: "Wrath of the Lich King (3.3.5a)".to_string(),
                xp_rate: 1.0,
                drop_rate: 1.0,
                gold_rate: 1.0,
                rep_rate: 1.0,
                motd: Some("Welcome to the server!".to_string()),
            }).into_response()
        },
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn update_server_config(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<crate::models::ServerConfig>,
) -> impl IntoResponse {
    // Check admin
    let token = match headers.get("Authorization") {
        Some(value) => value.to_str().unwrap_or("").replace("Bearer ", ""),
        None => return (StatusCode::UNAUTHORIZED, "Missing token").into_response(),
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token_data = match jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    ) {
        Ok(data) => data,
        Err(_) => return (StatusCode::UNAUTHORIZED, "Invalid token").into_response(),
    };

    if token_data.claims.role != "admin" {
        return (StatusCode::FORBIDDEN, "Admin access required").into_response();
    }

    let collection: Collection<crate::models::ServerConfig> = state.mongo.collection("server_config");
    
    // Update or Insert
    // We assume there's only one config doc
    let count = collection.count_documents(doc! {}, None).await.unwrap_or(0);
    
    if count == 0 {
        match collection.insert_one(payload, None).await {
            Ok(_) => (StatusCode::OK, "Config created").into_response(),
            Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create config").into_response(),
        }
    } else {
        // Update first found
        let update_doc = doc! {
            "$set": {
                "serverName": payload.server_name,
                "realmlist": payload.realmlist,
                "expansion": payload.expansion,
                "xpRate": payload.xp_rate,
                "dropRate": payload.drop_rate,
                "goldRate": payload.gold_rate,
                "repRate": payload.rep_rate,
                "motd": payload.motd,
            }
        };
        
        match collection.update_one(doc! {}, update_doc, None).await {
            Ok(_) => (StatusCode::OK, "Config updated").into_response(),
            Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update config").into_response(),
        }
    }
}

pub async fn login_game(
    State(state): State<AppState>,
    Json(payload): Json<LoginGameRequest>,
) -> impl IntoResponse {
    let username_upper = payload.username.to_uppercase();
    let password_upper = payload.password.to_uppercase();
    let to_hash = format!("{}:{}", username_upper, password_upper);
    
    let mut hasher = Sha1::new();
    hasher.update(to_hash);
    let result = hasher.finalize();
    let sha_pass_hash = hex::encode(result); // Node uses lowercase hex by default

    let query = "SELECT id, username FROM account WHERE username = ? AND sha_pass_hash = ?";
    
    let row = sqlx::query(query)
        .bind(&payload.username)
        .bind(&sha_pass_hash)
        .fetch_optional(&state.mysql_auth)
        .await;

    match row {
        Ok(Some(row)) => {
            let id: u32 = row.get("id"); // Using u32 for account id
            let db_username: String = row.get("username");
            
            // Create token
            let claims = Claims {
                sub: id.to_string(),
                exp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as usize + 7 * 24 * 3600,
                role: "user".to_string(), 
            };
             
            let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
            let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes())).unwrap();
            
            Json(serde_json::json!({
                "token": token,
                "user": {
                    "id": id.to_string(),
                    "name": db_username,
                    "isAdmin": false
                }
            })).into_response()
        },
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response(),
    }
}

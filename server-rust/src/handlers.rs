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

fn generate_random_password() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(10)
        .map(char::from)
        .collect()
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
    let game_password = payload.password.to_uppercase();
    let to_hash = format!("{}:{}", game_username, game_password);
    
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
                // If error is duplicate entry, we might want to return conflict or ignore (if user wants to link)
                // For now, let's fail if username taken
                tracing::error!("Failed to create MySQL account: {}", e);
                // We proceed without game account if it fails (e.g. username taken), or return error?
                // User expects account creation. Let's return error if username taken.
                // Simplified check:
                if e.to_string().contains("Duplicate entry") {
                     return (StatusCode::CONFLICT, "Game username already exists").into_response();
                }
                None
            }
        };

    let password_hash = match hash(&payload.password, DEFAULT_COST) {
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
            avatar_url: None,
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
        Ok(Some(u)) => u,
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

            // 4. Send Email (Mock)
            // TODO: Implement actual email sending
            tracing::info!("
                [EMAIL MOCK] To: {}
                Subject: Welcome to WoW Server!
                Body: 
                Hello {},
                Your game account has been created!
                Username: {}
                Password: {}
                
                You can change this password in your profile settings.
            ", google_user.email, google_user.given_name.as_deref().unwrap_or("Hero"), game_username, game_password);


            let nickname = google_user.name.clone().unwrap_or_else(|| safe_prefix);
            let first_name = google_user.given_name.unwrap_or_else(|| "User".to_string());
            let last_name = google_user.family_name.unwrap_or_else(|| "".to_string());
            
            // Random password hash for site (since they use Google, they don't know this)
            let password_hash = hash("GOOGLE_AUTH_NO_PASSWORD", DEFAULT_COST).unwrap();

            let new_user = User {
                id: None,
                nickname: nickname.clone(),
                first_name: first_name.clone(),
                last_name: last_name.clone(),
                email: google_user.email.clone(),
                password_hash,
                role: "user".to_string(),
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
            avatar_url: None,
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

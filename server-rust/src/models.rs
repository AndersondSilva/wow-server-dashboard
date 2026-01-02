use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub nickname: String,
    #[serde(rename = "firstName")]
    pub first_name: String,
    #[serde(rename = "lastName")]
    pub last_name: String,
    pub email: String,
    pub password_hash: String,
    #[serde(rename = "avatarUrl", skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub role: String, // "user", "admin"
    #[serde(rename = "gameId", skip_serializing_if = "Option::is_none")]
    pub game_id: Option<u32>,
    #[serde(default)]
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub nickname: String,
    #[serde(rename = "firstName")]
    pub first_name: String,
    #[serde(rename = "lastName")]
    pub last_name: String,
    pub email: String,
    pub password: Option<String>,
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String, // or username
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginGameRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleLoginRequest {
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub name: String,
    pub nickname: String,
    pub email: String,
    #[serde(rename = "firstName", skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(rename = "lastName", skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
    #[serde(rename = "avatarUrl", skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(rename = "isAdmin")]
    pub is_admin: bool,
    #[serde(rename = "gameId", skip_serializing_if = "Option::is_none")]
    pub game_id: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerConfig {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "serverName")]
    pub server_name: String,
    pub realmlist: String,
    pub expansion: String,
    #[serde(rename = "xpRate")]
    pub xp_rate: f64,
    #[serde(rename = "dropRate")]
    pub drop_rate: f64,
    #[serde(rename = "goldRate")]
    pub gold_rate: f64,
    #[serde(rename = "repRate")]
    pub rep_rate: f64,
    pub motd: Option<String>,
}

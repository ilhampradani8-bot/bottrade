use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use crate::server::api::AppState;
use std::env;
use chrono::{Utc, Duration};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/RegisterRequest.ts")]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/LoginRequest.ts")]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/AuthResponse.ts")]
pub struct AuthResponse {
    pub status: String,
    pub message: String,
    pub token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,
    pub exp: usize,
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let hashed = match hash(payload.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: "Failed to hash password".into(),
            token: None,
        })),
    };

    let result = sqlx::query!(
        "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
        payload.username,
        payload.email,
        hashed
    )
    .fetch_one(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(AuthResponse {
            status: "success".into(),
            message: "User registered successfully".into(),
            token: None,
        })),
        Err(e) => (StatusCode::BAD_REQUEST, Json(AuthResponse {
            status: "error".into(),
            message: format!("Registration failed: {}", e),
            token: None,
        })),
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let user = sqlx::query!(
        "SELECT id, password_hash FROM users WHERE email = $1",
        payload.email
    )
    .fetch_optional(&state.pool)
    .await;

    match user {
        Ok(Some(row)) => {
            if verify(payload.password, &row.password_hash).unwrap_or(false) {
                let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
                let expiration = Utc::now()
                    .checked_add_signed(Duration::hours(24))
                    .expect("valid timestamp")
                    .timestamp();

                let claims = Claims {
                    sub: row.id,
                    exp: expiration as usize,
                };

                let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())).unwrap();

                (StatusCode::OK, Json(AuthResponse {
                    status: "success".into(),
                    message: "Login successful".into(),
                    token: Some(token),
                }))
            } else {
                (StatusCode::UNAUTHORIZED, Json(AuthResponse {
                    status: "error".into(),
                    message: "Invalid credentials".into(),
                    token: None,
                }))
            }
        },
        _ => (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "User not found".into(),
            token: None,
        })),
    }
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/UserProfile.ts")]
pub struct UserProfile {
    pub username: String,
    pub email: String,
    pub created_at: String,
}

pub async fn get_me(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Option<UserProfile>>) {
    let auth_header = headers.get("Authorization").and_then(|h| h.to_str().ok());
    
    if let Some(auth_token) = auth_header {
        let token = auth_token.replace("Bearer ", "");
        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
        
        let token_data = jsonwebtoken::decode::<Claims>(
            &token,
            &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
            &jsonwebtoken::Validation::default(),
        );

        if let Ok(data) = token_data {
            let user = sqlx::query!(
                "SELECT username, email, created_at FROM users WHERE id = $1",
                data.claims.sub
            )
            .fetch_optional(&state.pool)
            .await;

            if let Ok(Some(row)) = user {
                return (StatusCode::OK, Json(Some(UserProfile {
                    username: row.username,
                    email: row.email,
                    created_at: row.created_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
                })));
            }
        }
    }

    (StatusCode::UNAUTHORIZED, Json(None))
}

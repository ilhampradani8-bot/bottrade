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
        "INSERT INTO users_by_usermanagement (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
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
        "SELECT id, password_hash FROM users_by_usermanagement WHERE email = $1",
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
                "SELECT username, email, created_at FROM users_by_usermanagement WHERE id = $1",
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

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/GoogleLoginRequest.ts")]
pub struct GoogleLoginRequest {
    pub credential: String,
}

#[derive(Deserialize)]
pub struct GoogleTokenInfo {
    pub aud: String,
    pub email: String,
    pub email_verified: Option<serde_json::Value>,
    pub name: Option<String>,
}

pub async fn google_login(
    State(state): State<AppState>,
    Json(payload): Json<GoogleLoginRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let client = reqwest::Client::new();
    let url = format!("https://oauth2.googleapis.com/tokeninfo?id_token={}", payload.credential);
    
    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return (StatusCode::BAD_REQUEST, Json(AuthResponse {
            status: "error".into(),
            message: format!("Failed to contact Google: {}", e),
            token: None,
        })),
    };

    if !response.status().is_success() {
        return (StatusCode::BAD_REQUEST, Json(AuthResponse {
            status: "error".into(),
            message: "Invalid Google credential token".into(),
            token: None,
        }));
    }

    let token_info: GoogleTokenInfo = match response.json().await {
        Ok(info) => info,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: "Failed to parse Google response".into(),
            token: None,
        })),
    };

    // Verify Audience/Client ID
    let allowed_client_id = "812430784237-70vet0sepo0f0eti0cs62nnjd4s89ia8.apps.googleusercontent.com";
    if token_info.aud != allowed_client_id {
        return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Client ID mismatch".into(),
            token: None,
        }));
    }

    // Lookup user in DB by email
    let user = sqlx::query!(
        "SELECT id FROM users_by_usermanagement WHERE email = $1",
        token_info.email
    )
    .fetch_optional(&state.pool)
    .await;

    let user_id = match user {
        Ok(Some(row)) => row.id,
        Ok(None) => {
            // User does not exist, let's create a new one!
            let base_username = token_info.email.split('@').next().unwrap_or("user").to_string();
            // Ensure username is unique by checking if it already exists
            let mut username = base_username.clone();
            let mut count = 0;
            loop {
                let check = sqlx::query!(
                    "SELECT id FROM users_by_usermanagement WHERE username = $1",
                    username
                )
                .fetch_optional(&state.pool)
                .await;
                
                if let Ok(None) = check {
                    break;
                }
                count += 1;
                username = format!("{}_{}", base_username, count);
            }

            // Create random password hash for security
            let random_pw = format!("oauth_google_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
            let hashed_pw = match hash(random_pw, DEFAULT_COST) {
                Ok(h) => h,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
                    status: "error".into(),
                    message: "Failed to generate security credential".into(),
                    token: None,
                })),
            };

            let insert_res = sqlx::query!(
                "INSERT INTO users_by_usermanagement (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
                username,
                token_info.email,
                hashed_pw
            )
            .fetch_one(&state.pool)
            .await;

            match insert_res {
                Ok(row) => row.id,
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
                    status: "error".into(),
                    message: format!("Failed to create user: {}", e),
                    token: None,
                })),
            }
        },
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: format!("Database lookup failed: {}", e),
            token: None,
        })),
    };

    // Generate JWT token
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id,
        exp: expiration as usize,
    };

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())).unwrap();

    (StatusCode::OK, Json(AuthResponse {
        status: "success".into(),
        message: "Login successful with Google".into(),
        token: Some(token),
    }))
}


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

#[derive(Serialize)]
struct ResendEmailRequest {
    from: String,
    to: Vec<String>,
    subject: String,
    html: String,
}

pub async fn send_security_email(to_email: &str, subject: &str, html_body: &str) -> Result<(), String> {
    let api_key = match env::var("RESEND_API_KEY") {
        Ok(k) => k,
        Err(_) => return Err("RESEND_API_KEY not set in environment".into()),
    };

    let client = reqwest::Client::new();
    let payload = ResendEmailRequest {
        from: "TradingSafe <onboarding@resend.dev>".into(),
        to: vec![to_email.into()],
        subject: subject.into(),
        html: html_body.into(),
    };

    let response = client
        .post("https://api.resend.com/emails")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&payload)
        .send()
        .await;

    match response {
        Ok(res) => {
            if res.status().is_success() {
                Ok(())
            } else {
                let status = res.status();
                let text = res.text().await.unwrap_or_default();
                Err(format!("Resend API error ({}): {}", status, text))
            }
        }
        Err(e) => Err(format!("Failed to send email request: {}", e)),
    }
}

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
        Ok(_) => {
            let email_clone = payload.email.clone();
            let username_clone = payload.username.clone();
            tokio::spawn(async move {
                let html_body = format!(
                    "<h3>Selamat Datang di TradingSafe, {}!</h3>\
                     <p>Akun Anda dengan email <strong>{}</strong> telah sukses didaftarkan.</p>\
                     <p>Ini adalah notifikasi keamanan otomatis. Jika ini bukan aktivitas Anda, silakan hubungi tim bantuan kami segera.</p>",
                    username_clone, email_clone
                );
                if let Err(e) = send_security_email(&email_clone, "Notifikasi Keamanan: Akun Baru Terdaftar", &html_body).await {
                    eprintln!("Failed to send registration welcome email: {}", e);
                }
            });

            (StatusCode::CREATED, Json(AuthResponse {
                status: "success".into(),
                message: "User registered successfully".into(),
                token: None,
            }))
        }
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

                let email_clone = payload.email.clone();
                tokio::spawn(async move {
                    let html_body = format!(
                        "<h3>Notifikasi Keamanan: Login Baru</h3>\
                         <p>Akun Anda (<strong>{}</strong>) baru saja masuk ke platform TradingSafe.</p>\
                         <p>Waktu aktivitas: {}</p>\
                         <p>Jika ini bukan tindakan Anda, disarankan untuk segera memperbarui kata sandi Anda.</p>",
                        email_clone, Utc::now().to_rfc3339()
                    );
                    if let Err(e) = send_security_email(&email_clone, "Notifikasi Keamanan: Deteksi Login Baru", &html_body).await {
                        eprintln!("Failed to send login alert email: {}", e);
                    }
                });

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
    pub id: i32,
    pub username: String,
    pub email: String,
    pub created_at: String,
    pub status: String,
    pub whatsapp_number: Option<String>,
    pub telegram: Option<String>,
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
                "SELECT id, username, email, created_at, status, whatsapp_number, telegram FROM users_by_usermanagement WHERE id = $1",
                data.claims.sub
            )
            .fetch_optional(&state.pool)
            .await;

            if let Ok(Some(row)) = user {
                return (StatusCode::OK, Json(Some(UserProfile {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    created_at: row.created_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
                    status: row.status.unwrap_or_else(|| "Aktif".into()),
                    whatsapp_number: row.whatsapp_number,
                    telegram: row.telegram,
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

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/UpdateSettingsRequest.ts")]
pub struct UpdateSettingsRequest {
    pub username: String,
    pub notif_signal_enabled: bool,
    pub notif_marketing_enabled: bool,
    pub whatsapp_number: Option<String>,
    pub telegram: Option<String>,
}

pub async fn update_settings(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<UpdateSettingsRequest>,
) -> (StatusCode, Json<AuthResponse>) {
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
            let result = sqlx::query!(
                "UPDATE users_by_usermanagement SET username = $1, notif_signal_enabled = $2, notif_marketing_enabled = $3, whatsapp_number = $4, telegram = $5 WHERE id = $6",
                payload.username,
                payload.notif_signal_enabled,
                payload.notif_marketing_enabled,
                payload.whatsapp_number,
                payload.telegram,
                data.claims.sub
            )
            .execute(&state.pool)
            .await;

            match result {
                Ok(_) => return (StatusCode::OK, Json(AuthResponse {
                    status: "success".into(),
                    message: "Settings updated successfully".into(),
                    token: None,
                })),
                Err(e) => return (StatusCode::BAD_REQUEST, Json(AuthResponse {
                    status: "error".into(),
                    message: format!("Failed to update settings: {}", e),
                    token: None,
                })),
            }
        }
    }

    (StatusCode::UNAUTHORIZED, Json(AuthResponse {
        status: "error".into(),
        message: "Unauthorized".into(),
        token: None,
    }))
}

// --- Verification Handlers ---

#[derive(Deserialize)]
pub struct VerifyTelegramPayload {
    pub telegram_username: String,
}

pub async fn verify_telegram(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<VerifyTelegramPayload>,
) -> (StatusCode, Json<AuthResponse>) {
    let auth_header = headers.get("Authorization").and_then(|h| h.to_str().ok());
    if auth_header.is_none() {
        return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Unauthorized".into(),
            token: None,
        }));
    }
    
    let token = auth_header.unwrap().replace("Bearer ", "");
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    );

    let user_id = match token_data {
        Ok(data) => data.claims.sub,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Invalid token".into(),
            token: None,
        })),
    };

    let bot_token = match env::var("TELEGRAM_BOT_TOKEN") {
        Ok(tok) => tok,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: "Telegram bot token is not configured on the server".into(),
            token: None,
        })),
    };

    let client = reqwest::Client::new();
    let url = format!("https://api.telegram.org/bot{}/getUpdates?timeout=5", bot_token);
    
    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: format!("Failed to contact Telegram API: {}", e),
            token: None,
        })),
    };

    if !response.status().is_success() {
        return (StatusCode::BAD_REQUEST, Json(AuthResponse {
            status: "error".into(),
            message: "Telegram API getUpdates request failed".into(),
            token: None,
        }));
    }

    let json_val: serde_json::Value = match response.json().await {
        Ok(v) => v,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: "Failed to parse Telegram API response".into(),
            token: None,
        })),
    };

    let updates = match json_val.get("result").and_then(|r| r.as_array()) {
        Some(arr) => arr,
        None => return (StatusCode::OK, Json(AuthResponse {
            status: "error".into(),
            message: "Tidak ada interaksi baru dengan bot. Silakan klik start terlebih dahulu!".into(),
            token: None,
        })),
    };

    let target_username = payload.telegram_username.trim().trim_start_matches('@').to_lowercase();
    let user_id_str = user_id.to_string();

    let mut found_chat_id: Option<i64> = None;

    for update in updates {
        if let Some(message) = update.get("message") {
            if let Some(from) = message.get("from") {
                let username = from.get("username").and_then(|u| u.as_str()).unwrap_or_default().to_lowercase();
                let chat_id = message.get("chat").and_then(|c| c.get("id")).and_then(|i| i.as_i64()).unwrap_or_default();
                let text = message.get("text").and_then(|t| t.as_str()).unwrap_or_default().trim();

                if username == target_username || text == format!("/start {}", user_id_str) || (text == "/start" && username == target_username) {
                    found_chat_id = Some(chat_id);
                    break;
                }
            }
        }
    }

    if let Some(chat_id) = found_chat_id {
        let chat_id_str = chat_id.to_string();
        let db_res = sqlx::query!(
            "UPDATE users_by_usermanagement SET telegram = $1 WHERE id = $2",
            chat_id_str,
            user_id
        )
        .execute(&state.pool)
        .await;

        match db_res {
            Ok(_) => {
                let welcome_msg = format!(
                    "🎉 *TradingSafe Notification Link Success!*\n\n\
                     Halo, akun TradingSafe Anda (ID: #{}) telah sukses dihubungkan ke bot ini. \
                     Anda sekarang akan menerima notifikasi sinyal dan log secara langsung di sini.", 
                    user_id
                );
                let send_url = format!("https://api.telegram.org/bot{}/sendMessage", bot_token);
                let _ = client.post(&send_url)
                    .json(&serde_json::json!({
                        "chat_id": chat_id,
                        "text": welcome_msg,
                        "parse_mode": "Markdown"
                    }))
                    .send()
                    .await;

                (StatusCode::OK, Json(AuthResponse {
                    status: "success".into(),
                    message: format!("Berhasil terhubung! Telegram Chat ID {} telah disimpan.", chat_id),
                    token: None,
                }))
            }
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
                status: "error".into(),
                message: format!("Gagal menyimpan ke database: {}", e),
                token: None,
            })),
        }
    } else {
        (StatusCode::OK, Json(AuthResponse {
            status: "error".into(),
            message: "Bot tidak menemukan pesan start dari username Anda. Pastikan Anda sudah membuka bot dan mengklik START!".into(),
            token: None,
        }))
    }
}

#[derive(Deserialize)]
pub struct SendWhatsappOtpPayload {
    pub whatsapp_number: String,
}

pub async fn send_whatsapp_otp(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SendWhatsappOtpPayload>,
) -> (StatusCode, Json<AuthResponse>) {
    let auth_header = headers.get("Authorization").and_then(|h| h.to_str().ok());
    if auth_header.is_none() {
        return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Unauthorized".into(),
            token: None,
        }));
    }

    let token = auth_header.unwrap().replace("Bearer ", "");
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    );

    if token_data.is_err() {
        return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Invalid token".into(),
            token: None,
        }));
    }

    let phone = payload.whatsapp_number.trim().to_string();
    if phone.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(AuthResponse {
            status: "error".into(),
            message: "Nomor WhatsApp tidak boleh kosong".into(),
            token: None,
        }));
    }

    // Generate 6-digit OTP code using system time LCG (no external rand dependency)
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let seed = nanos as u64;
    let next_seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
    let code_num = (next_seed % 900000) + 100000;
    let otp_code = code_num.to_string();

    {
        let mut cache = state.otp_cache.lock().unwrap();
        cache.insert(phone.clone(), otp_code.clone());
    }

    let formatted_num = if phone.contains("@") { phone.clone() } else { format!("{}@s.whatsapp.net", phone) };
    let port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5002".to_string());
    let url = format!("http://127.0.0.1:{}/send", port);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let msg = format!("🔑 *TradingSafe Verification Code*\n\nKode verifikasi Anda adalah: *{}*\n\nJangan bagikan kode ini kepada siapapun.", otp_code);
    
    let req_payload = serde_json::json!({
        "message": msg,
        "group_id": formatted_num
    });

    match client.post(&url).json(&req_payload).send().await {
        Ok(res) => {
            if res.status().is_success() {
                (StatusCode::OK, Json(AuthResponse {
                    status: "success".into(),
                    message: "Kode verifikasi telah dikirim ke WhatsApp Anda!".into(),
                    token: None,
                }))
            } else {
                let err_text = res.text().await.unwrap_or_default();
                (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
                    status: "error".into(),
                    message: format!("Gagal mengirim WA via Bridge: {}", err_text),
                    token: None,
                }))
            }
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: format!("Gagal menghubungi WA bridge: {}", e),
            token: None,
        })),
    }
}

#[derive(Deserialize)]
pub struct VerifyWhatsappOtpPayload {
    pub whatsapp_number: String,
    pub code: String,
}

pub async fn verify_whatsapp_otp(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<VerifyWhatsappOtpPayload>,
) -> (StatusCode, Json<AuthResponse>) {
    let auth_header = headers.get("Authorization").and_then(|h| h.to_str().ok());
    if auth_header.is_none() {
        return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Unauthorized".into(),
            token: None,
        }));
    }

    let token = auth_header.unwrap().replace("Bearer ", "");
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    );

    let user_id = match token_data {
        Ok(data) => data.claims.sub,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(AuthResponse {
            status: "error".into(),
            message: "Invalid token".into(),
            token: None,
        })),
    };

    let phone = payload.whatsapp_number.trim().to_string();
    let code = payload.code.trim().to_string();

    let is_valid = {
        let mut cache = state.otp_cache.lock().unwrap();
        if let Some(cached_code) = cache.get(&phone) {
            if cached_code == &code {
                cache.remove(&phone);
                true
            } else {
                false
            }
        } else {
            false
        }
    };

    if !is_valid {
        return (StatusCode::OK, Json(AuthResponse {
            status: "error".into(),
            message: "Kode verifikasi salah atau kedaluwarsa!".into(),
            token: None,
        }));
    }

    let db_res = sqlx::query!(
        "UPDATE users_by_usermanagement SET whatsapp_number = $1 WHERE id = $2",
        phone,
        user_id
    )
    .execute(&state.pool)
    .await;

    match db_res {
        Ok(_) => (StatusCode::OK, Json(AuthResponse {
            status: "success".into(),
            message: "Berhasil memverifikasi dan menyimpan nomor WhatsApp Anda!".into(),
            token: None,
        })),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthResponse {
            status: "error".into(),
            message: format!("Gagal menyimpan nomor WhatsApp: {}", e),
            token: None,
        })),
    }
}

// --- Social Login (NextAuth.js Integration) ---

#[derive(Deserialize)]
pub struct SocialLoginRequest {
    pub email: String,
    pub name: String,
    pub provider: String,
    pub provider_id: String,
}

#[derive(Serialize)]
pub struct SocialLoginResponse {
    pub status: String,
    pub message: String,
    pub token: Option<String>,
    pub user_id: Option<i32>,
}

pub async fn social_login(
    State(state): State<AppState>,
    Json(payload): Json<SocialLoginRequest>,
) -> (StatusCode, Json<SocialLoginResponse>) {
    // Lookup user in DB by email
    let user = sqlx::query!(
        "SELECT id FROM users_by_usermanagement WHERE email = $1",
        payload.email
    )
    .fetch_optional(&state.pool)
    .await;

    let user_id = match user {
        Ok(Some(row)) => row.id,
        Ok(None) => {
            // Auto-register: user doesn't exist yet
            let base_username = payload.name.replace(' ', "_").to_lowercase();
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

            // Create random password hash for OAuth users
            let random_pw = format!("oauth_{}_{}", payload.provider, chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
            let hashed_pw = match hash(random_pw, DEFAULT_COST) {
                Ok(h) => h,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(SocialLoginResponse {
                    status: "error".into(),
                    message: "Failed to generate security credential".into(),
                    token: None,
                    user_id: None,
                })),
            };

            let insert_res = sqlx::query!(
                "INSERT INTO users_by_usermanagement (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
                username,
                payload.email,
                hashed_pw
            )
            .fetch_one(&state.pool)
            .await;

            match insert_res {
                Ok(row) => {
                    // Send welcome email
                    let email_clone = payload.email.clone();
                    let username_clone = username.clone();
                    let provider_clone = payload.provider.clone();
                    tokio::spawn(async move {
                        let html_body = format!(
                            "<h3>Selamat Datang di TradingSafe, {}!</h3>\
                             <p>Akun Anda telah berhasil dibuat via <strong>{}</strong> dengan email <strong>{}</strong>.</p>\
                             <p>Ini adalah notifikasi keamanan otomatis.</p>",
                            username_clone, provider_clone, email_clone
                        );
                        if let Err(e) = send_security_email(&email_clone, "Notifikasi Keamanan: Akun Baru via Social Login", &html_body).await {
                            eprintln!("Failed to send social registration email: {}", e);
                        }
                    });
                    row.id
                },
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(SocialLoginResponse {
                    status: "error".into(),
                    message: format!("Failed to create user: {}", e),
                    token: None,
                    user_id: None,
                })),
            }
        },
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(SocialLoginResponse {
            status: "error".into(),
            message: format!("Database lookup failed: {}", e),
            token: None,
            user_id: None,
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

    (StatusCode::OK, Json(SocialLoginResponse {
        status: "success".into(),
        message: format!("Login successful with {}", payload.provider),
        token: Some(token),
        user_id: Some(user_id),
    }))
}

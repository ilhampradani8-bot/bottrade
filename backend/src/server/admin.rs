use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::server::api::AppState;
use ts_rs::TS;
use bcrypt::{verify, hash, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use crate::server::postgres_auth_hub::{Claims, AuthResponse};
use std::env;
use chrono::{Utc, Duration};

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../admin/src/types/AdminLoginRequest.ts")]
pub struct AdminLoginRequest {
    pub username: String,
    pub password: String,
}

pub async fn admin_login(
    State(state): State<AppState>,
    Json(payload): Json<AdminLoginRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let user = sqlx::query!(
        "SELECT id, password_hash, role FROM user_admin WHERE LOWER(username) = LOWER($1)",
        payload.username
    )
    .fetch_optional(&state.pool)
    .await;

    match user {
        Ok(Some(row)) => {
            if row.role.as_deref().unwrap_or("") != "admin" {
                return (StatusCode::FORBIDDEN, Json(AuthResponse {
                    status: "error".into(),
                    message: "Access denied. Not an admin.".into(),
                    token: None,
                }));
            }

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
                    message: "Admin login successful".into(),
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
            message: "Admin user not found".into(),
            token: None,
        })),
    }
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../admin/src/types/AdminUser.ts")]
pub struct AdminUser {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub role: Option<String>,
    pub status: Option<String>,
    pub notif_signal_enabled: Option<bool>,
    pub notif_marketing_enabled: Option<bool>,
    pub email_verified: Option<bool>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub whatsapp_number: Option<String>,
    pub telegram: Option<String>,
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../admin/src/types/AdminBot.ts")]
pub struct AdminBot {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub bot_type: String,
    pub pair: String,
    pub status: Option<String>,
    pub username: String, // Owner name
    pub settings: serde_json::Value,
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../admin/src/types/AdminSimulation.ts")]
pub struct AdminSimulation {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub bot_type: String,
    pub pair: String,
    pub status: Option<String>,
    pub username: String, // Owner name
    pub settings: serde_json::Value,
}

#[derive(Deserialize)]
pub struct UpdateBotStatus {
    pub status: String,
}

#[derive(Deserialize)]
pub struct UpdateBotConfig {
    pub name: String,
    pub settings: serde_json::Value,
}

pub async fn get_all_users(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<AdminUser>>) {
    let users = sqlx::query_as!(
        AdminUser,
        "SELECT id as \"id!\", username as \"username!\", email as \"email!\", role, status, notif_signal_enabled as \"notif_signal_enabled?\", notif_marketing_enabled as \"notif_marketing_enabled?\", email_verified as \"email_verified?\", created_at as \"created_at!\", whatsapp_number, telegram FROM users_by_usermanagement ORDER BY created_at DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(users))
}

pub async fn get_all_bots(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<AdminBot>>) {
    let bots = sqlx::query_as!(
        AdminBot,
        "SELECT s.id as \"id!\", s.user_id as \"user_id!\", s.name as \"name!\", s.bot_type as \"bot_type!\", s.pair as \"pair!\", s.status, s.settings as \"settings!\", u.username as \"username!\" 
         FROM strategies_by_strategysettings s 
         JOIN users_by_usermanagement u ON s.user_id = u.id 
         ORDER BY s.id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(bots))
}

pub async fn get_all_simulations(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<AdminSimulation>>) {
    let sims = sqlx::query_as!(
        AdminSimulation,
        "SELECT s.id as \"id!\", s.user_id as \"user_id!\", s.name as \"name!\", s.bot_type as \"bot_type!\", s.pair as \"pair!\", s.status, s.settings as \"settings!\", u.username as \"username!\" 
         FROM simulations_by_simsettings s 
         JOIN users_by_usermanagement u ON s.user_id = u.id 
         ORDER BY s.id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(sims))
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/AdminOverview.ts")]
pub struct AdminOverview {
    pub total_users: i64,
    pub active_bots: i64,
    pub total_trades: i64,
    pub total_profit: f64,
}

pub async fn get_admin_overview(
    State(state): State<AppState>,
) -> (StatusCode, Json<AdminOverview>) {
    let users_count = sqlx::query!("SELECT COUNT(*) FROM users_by_usermanagement")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

    let bots_count = sqlx::query!("SELECT COUNT(*) FROM strategies_by_strategysettings WHERE status = 'Running'")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

    let trades_count = sqlx::query!("SELECT COUNT(*) FROM trades_by_jurnalriwayat")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

    let profit = sqlx::query!("SELECT SUM(pnl) as total_pnl FROM trades_by_jurnalriwayat")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.total_pnl.unwrap_or(rust_decimal::Decimal::ZERO))
        .unwrap_or(rust_decimal::Decimal::ZERO);

    (StatusCode::OK, Json(AdminOverview {
        total_users: users_count,
        active_bots: bots_count,
        total_trades: trades_count,
        total_profit: profit.to_string().parse().unwrap_or(0.0),
    }))
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/MarketSummary.ts")]
pub struct MarketSummary {
    pub symbol: String,
    pub interval: String,
    pub start_time: i64,
    pub end_time: i64,
    pub count: i64,
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../admin/src/types/AdminApiKey.ts")]
pub struct AdminApiKey {
    pub id: i32,
    pub username: String,
    pub platform_name: String,
    pub label: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub status: Option<String>,
}

pub async fn get_market_summary(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<MarketSummary>>) {
    let summary = sqlx::query!(
        "SELECT symbol, interval, MIN(open_time) as start_t, MAX(open_time) as end_t, COUNT(*) as cnt 
         FROM market_data_by_backtest 
         GROUP BY symbol, interval"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|r| MarketSummary {
        symbol: r.symbol,
        interval: r.interval,
        start_time: r.start_t.unwrap_or(0),
        end_time: r.end_t.unwrap_or(0),
        count: r.cnt.unwrap_or(0),
    })
    .collect();

    (StatusCode::OK, Json(summary))
}

pub async fn get_all_api_keys(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<AdminApiKey>>) {
    let keys = sqlx::query_as!(
        AdminApiKey,
        "SELECT a.id, u.username as \"username!\", a.platform_name, a.label, a.created_at as \"created_at!\", a.status 
         FROM api_keys_by_credential a 
         JOIN users_by_usermanagement u ON a.user_id = u.id 
         ORDER BY a.created_at DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(keys))
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../admin/src/types/UpdateApiKeyStatus.ts")]
pub struct UpdateApiKeyStatus {
    pub status: String,
}

pub async fn update_api_key_status(
    State(state): State<AppState>,
    Path(key_id): Path<i32>,
    Json(payload): Json<UpdateApiKeyStatus>,
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "UPDATE api_keys_by_credential SET status = $1 WHERE id = $2",
        payload.status,
        key_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/AdminReport.ts")]
pub struct AdminReport {
    pub recent_trades: Vec<crate::server::api::UserTrade>,
    pub daily_stats: Vec<DailyStat>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/DailyStat.ts")]
pub struct DailyStat {
    pub day: String,
    pub profit: f64,
    pub count: i64,
}

pub async fn get_admin_reports(
    State(state): State<AppState>,
) -> (StatusCode, Json<AdminReport>) {
    let trades = sqlx::query_as!(
        crate::server::api::UserTrade,
        "SELECT id as \"id!\", pair as \"pair!\", strategy_type as \"strategy_type!\", side as \"side!\", price as \"price!\", amount as \"amount!\", pnl as \"pnl?\", created_at as \"created_at!\", status as \"status!\", requested_price as \"requested_price?\", slippage as \"slippage?\", market_regime, is_manual_intervention, intervention_pnl_diff as \"intervention_pnl_diff?\", error_code, error_message, market_session, notes, change_history as \"change_history?\" 
         FROM trades_by_jurnalriwayat ORDER BY created_at DESC LIMIT 20"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let stats = sqlx::query!(
        "SELECT DATE(created_at) as day, SUM(pnl) as total_pnl, COUNT(*) as cnt 
         FROM trades_by_jurnalriwayat 
         GROUP BY DATE(created_at) 
         ORDER BY day DESC LIMIT 7"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|r| DailyStat {
        day: r.day.map(|t| t.to_string()).unwrap_or_default(),
        profit: r.total_pnl.map(|d| d.to_string().parse().unwrap_or(0.0)).unwrap_or(0.0),
        count: r.cnt.unwrap_or(0),
    })
    .collect();

    (StatusCode::OK, Json(AdminReport {
        recent_trades: trades,
        daily_stats: stats,
    }))
}

pub async fn update_user_status(
    State(state): State<AppState>,
    Path(user_id): Path<i32>,
    Json(payload): Json<UpdateBotStatus>, // Reusing status payload
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "UPDATE users_by_usermanagement SET status = $1 WHERE id = $2",
        payload.status,
        user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn update_bot_status(
    State(state): State<AppState>,
    Path(bot_id): Path<i32>,
    Json(payload): Json<UpdateBotStatus>,
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "UPDATE strategies_by_strategysettings SET status = $1 WHERE id = $2",
        payload.status,
        bot_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn update_simulation_status(
    State(state): State<AppState>,
    Path(sim_id): Path<i32>,
    Json(payload): Json<UpdateBotStatus>,
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "UPDATE simulations_by_simsettings SET status = $1 WHERE id = $2",
        payload.status,
        sim_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn update_bot_config(
    State(state): State<AppState>,
    Path(bot_id): Path<i32>,
    Json(payload): Json<UpdateBotConfig>,
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "UPDATE strategies_by_strategysettings SET name = $1, settings = $2 WHERE id = $3",
        payload.name,
        payload.settings,
        bot_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/AdminProfile.ts")]
pub struct AdminProfile {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub role: Option<String>,
}

pub async fn get_admin_me(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Option<AdminProfile>>) {
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
                "SELECT id, username, email, role FROM user_admin WHERE id = $1",
                data.claims.sub
            )
            .fetch_optional(&state.pool)
            .await;

            if let Ok(Some(row)) = user {
                return (StatusCode::OK, Json(Some(AdminProfile {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    role: row.role,
                })));
            }
        }
    }

    (StatusCode::UNAUTHORIZED, Json(None))
}

#[derive(Deserialize)]
pub struct CreateUserPayload {
    pub username: String,
    pub email: String,
    pub password: Option<String>,
    pub role: Option<String>,
    pub status: Option<String>,
    pub notif_signal_enabled: Option<bool>,
    pub notif_marketing_enabled: Option<bool>,
    pub email_verified: Option<bool>,
    pub whatsapp_number: Option<String>,
    pub telegram: Option<String>,
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserPayload>,
) -> (StatusCode, Json<serde_json::Value>) {
    let raw_pw = payload.password.as_deref().unwrap_or("123456");
    let hashed = match hash(raw_pw, DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    };

    let role = payload.role.unwrap_or_else(|| "trader".to_string());
    let status = payload.status.unwrap_or_else(|| "Aktif".to_string());
    let notif_sig = payload.notif_signal_enabled.unwrap_or(true);
    let notif_mkt = payload.notif_marketing_enabled.unwrap_or(false);
    let is_verified = payload.email_verified.unwrap_or(false);

    let result = sqlx::query!(
        "INSERT INTO users_by_usermanagement (username, email, password_hash, role, status, notif_signal_enabled, notif_marketing_enabled, email_verified, whatsapp_number, telegram) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        payload.username,
        payload.email,
        hashed,
        role,
        status,
        notif_sig,
        notif_mkt,
        is_verified,
        payload.whatsapp_number,
        payload.telegram
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Deserialize)]
pub struct UpdateUserPayload {
    pub username: String,
    pub email: String,
    pub password: Option<String>,
    pub role: Option<String>,
    pub status: Option<String>,
    pub notif_signal_enabled: Option<bool>,
    pub notif_marketing_enabled: Option<bool>,
    pub email_verified: Option<bool>,
    pub whatsapp_number: Option<String>,
    pub telegram: Option<String>,
}

pub async fn update_user(
    State(state): State<AppState>,
    Path(user_id): Path<i32>,
    Json(payload): Json<UpdateUserPayload>,
) -> (StatusCode, Json<serde_json::Value>) {
    let role = payload.role.unwrap_or_else(|| "trader".to_string());
    let status = payload.status.unwrap_or_else(|| "Aktif".to_string());
    let notif_sig = payload.notif_signal_enabled.unwrap_or(true);
    let notif_mkt = payload.notif_marketing_enabled.unwrap_or(false);
    let is_verified = payload.email_verified.unwrap_or(false);

    let result = if let Some(ref pw) = payload.password {
        if !pw.trim().is_empty() {
            let hashed = match hash(pw, DEFAULT_COST) {
                Ok(h) => h,
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
            };
            sqlx::query!(
                "UPDATE users_by_usermanagement SET username = $1, email = $2, password_hash = $3, role = $4, status = $5, notif_signal_enabled = $6, notif_marketing_enabled = $7, email_verified = $8, whatsapp_number = $9, telegram = $10 WHERE id = $11",
                payload.username,
                payload.email,
                hashed,
                role,
                status,
                notif_sig,
                notif_mkt,
                is_verified,
                payload.whatsapp_number,
                payload.telegram,
                user_id
            )
            .execute(&state.pool)
            .await
        } else {
            sqlx::query!(
                "UPDATE users_by_usermanagement SET username = $1, email = $2, role = $3, status = $4, notif_signal_enabled = $5, notif_marketing_enabled = $6, email_verified = $7, whatsapp_number = $8, telegram = $9 WHERE id = $10",
                payload.username,
                payload.email,
                role,
                status,
                notif_sig,
                notif_mkt,
                is_verified,
                payload.whatsapp_number,
                payload.telegram,
                user_id
            )
            .execute(&state.pool)
            .await
        }
    } else {
        sqlx::query!(
            "UPDATE users_by_usermanagement SET username = $1, email = $2, role = $3, status = $4, notif_signal_enabled = $5, notif_marketing_enabled = $6, email_verified = $7, whatsapp_number = $8, telegram = $9 WHERE id = $10",
            payload.username,
            payload.email,
            role,
            status,
            notif_sig,
            notif_mkt,
            is_verified,
            payload.whatsapp_number,
            payload.telegram,
            user_id
        )
        .execute(&state.pool)
        .await
    };

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

pub async fn delete_user(
    State(state): State<AppState>,
    Path(user_id): Path<i32>,
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "DELETE FROM users_by_usermanagement WHERE id = $1",
        user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"status": "success"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    }
}

#[derive(Deserialize, Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/NotificationSettings.ts")]
pub struct NotificationSettings {
    pub telegram_bot_token: String,
    pub telegram_chat_id_up: String,
    pub telegram_chat_id_down: String,
    pub whatsapp_group_id_up: String,
    pub whatsapp_group_id_down: String,
    pub whatsapp_port: String,
    pub cooldown_minutes: String,
    pub alert_on_errors: String,
    pub emergency_template_down: Option<String>,
    pub emergency_template_hacked: Option<String>,
    pub emergency_template_maintenance: Option<String>,
}

pub async fn get_notification_settings(
    State(state): State<AppState>,
) -> (StatusCode, Json<NotificationSettings>) {
    let rows = sqlx::query!("SELECT key, value FROM admin_notification_settings")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut settings = NotificationSettings {
        telegram_bot_token: env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default(),
        telegram_chat_id_up: env::var("TELEGRAM_CHAT_ID").unwrap_or_else(|_| "-1003973511282".to_string()),
        telegram_chat_id_down: env::var("TELEGRAM_CHAT_ID_DOWN").unwrap_or_else(|_| "-5215838199".to_string()),
        whatsapp_group_id_up: env::var("WHATSAPP_GROUP_ID").unwrap_or_else(|_| "120363427987942506@g.us".to_string()),
        whatsapp_group_id_down: env::var("WHATSAPP_GROUP_ID_DOWN").unwrap_or_else(|_| "120363409651722299@g.us".to_string()),
        whatsapp_port: env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string()),
        cooldown_minutes: "15".to_string(),
        alert_on_errors: "true".to_string(),
        emergency_template_down: Some("🚨 *SISTEM DOWN*: Kami mendeteksi gangguan pada server. Tim kami sedang menangani pemulihan.".to_string()),
        emergency_template_hacked: Some("⚠️ *SISTEM DIRETAS (EMERGENCY)*: Harap segera amankan akun Anda. Fitur penarikan dana/trading sementara ditangguhkan.".to_string()),
        emergency_template_maintenance: Some("🔧 *PEMELIHARAAN (MAINTENANCE)*: Sistem akan dimatikan sementara untuk pembaruan terjadwal.".to_string()),
    };

    for row in rows {
        match row.key.as_str() {
            "telegram_bot_token" => settings.telegram_bot_token = row.value,
            "telegram_chat_id_up" => settings.telegram_chat_id_up = row.value,
            "telegram_chat_id_down" => settings.telegram_chat_id_down = row.value,
            "whatsapp_group_id_up" => settings.whatsapp_group_id_up = row.value,
            "whatsapp_group_id_down" => settings.whatsapp_group_id_down = row.value,
            "whatsapp_port" => settings.whatsapp_port = row.value,
            "cooldown_minutes" => settings.cooldown_minutes = row.value,
            "alert_on_errors" => settings.alert_on_errors = row.value,
            "emergency_template_down" => settings.emergency_template_down = Some(row.value),
            "emergency_template_hacked" => settings.emergency_template_hacked = Some(row.value),
            "emergency_template_maintenance" => settings.emergency_template_maintenance = Some(row.value),
            _ => {}
        }
    }

    (StatusCode::OK, Json(settings))
}

pub async fn save_notification_settings(
    State(state): State<AppState>,
    Json(payload): Json<NotificationSettings>,
) -> (StatusCode, Json<serde_json::Value>) {
    let settings_map = [
        ("telegram_bot_token", payload.telegram_bot_token),
        ("telegram_chat_id_up", payload.telegram_chat_id_up),
        ("telegram_chat_id_down", payload.telegram_chat_id_down),
        ("whatsapp_group_id_up", payload.whatsapp_group_id_up),
        ("whatsapp_group_id_down", payload.whatsapp_group_id_down),
        ("whatsapp_port", payload.whatsapp_port),
        ("cooldown_minutes", payload.cooldown_minutes),
        ("alert_on_errors", payload.alert_on_errors),
        ("emergency_template_down", payload.emergency_template_down.unwrap_or_default()),
        ("emergency_template_hacked", payload.emergency_template_hacked.unwrap_or_default()),
        ("emergency_template_maintenance", payload.emergency_template_maintenance.unwrap_or_default()),
    ];

    let mut transaction = match state.pool.begin().await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    };

    for (key, val) in settings_map {
        let res = sqlx::query!(
            "INSERT INTO admin_notification_settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            key, val
        )
        .execute(&mut *transaction)
        .await;

        if let Err(e) = res {
            let _ = transaction.rollback().await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()})));
        }
    }

    if let Err(e) = transaction.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()})));
    }

    (StatusCode::OK, Json(serde_json::json!({"status": "success"})))
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../admin/src/types/BroadcastRequest.ts")]
pub struct BroadcastRequest {
    pub channels: Vec<String>,
    pub message: String,
    pub user_ids: Option<Vec<i32>>,
}

pub async fn broadcast_message(
    State(state): State<AppState>,
    Json(payload): Json<BroadcastRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let rows = sqlx::query!("SELECT key, value FROM admin_notification_settings")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut tg_token = env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default();
    let mut tg_chat_up = env::var("TELEGRAM_CHAT_ID").unwrap_or_else(|_| "-1003973511282".to_string());
    let mut tg_chat_down = env::var("TELEGRAM_CHAT_ID_DOWN").unwrap_or_else(|_| "-5215838199".to_string());
    let mut wa_group_up = env::var("WHATSAPP_GROUP_ID").unwrap_or_else(|_| "120363427987942506@g.us".to_string());
    let mut wa_group_down = env::var("WHATSAPP_GROUP_ID_DOWN").unwrap_or_else(|_| "120363409651722299@g.us".to_string());
    let mut wa_port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string());

    for row in rows {
        match row.key.as_str() {
            "telegram_bot_token" => tg_token = row.value,
            "telegram_chat_id_up" => tg_chat_up = row.value,
            "telegram_chat_id_down" => tg_chat_down = row.value,
            "whatsapp_group_id_up" => wa_group_up = row.value,
            "whatsapp_group_id_down" => wa_group_down = row.value,
            "whatsapp_port" => wa_port = row.value,
            _ => {}
        }
    }

    struct TargetUser {
        id: i32,
        username: String,
        telegram: Option<String>,
        whatsapp_number: Option<String>,
        email: String,
    }

    let client = reqwest::Client::new();
    let mut tg_sent = 0;
    let mut wa_sent = 0;
    let mut email_sent = 0;
    let mut web_sent = 0;
    let mut errors = Vec::new();

    // Fetch the list of target users based on user_ids
    let target_users: Vec<TargetUser> = if let Some(ref ids) = payload.user_ids {
        if ids.is_empty() {
            Vec::new()
        } else {
            sqlx::query!(
                "SELECT id, username, telegram, whatsapp_number, email FROM users_by_usermanagement WHERE id = ANY($1)",
                ids
            )
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|r| TargetUser {
                id: r.id,
                username: r.username,
                telegram: r.telegram,
                whatsapp_number: r.whatsapp_number,
                email: r.email,
            })
            .collect()
        }
    } else {
        // Fallback: all users
        sqlx::query!(
            "SELECT id, username, telegram, whatsapp_number, email FROM users_by_usermanagement"
        )
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|r| TargetUser {
            id: r.id,
            username: r.username,
            telegram: r.telegram,
            whatsapp_number: r.whatsapp_number,
            email: r.email,
        })
        .collect()
    };

    for channel in &payload.channels {
        match channel.as_str() {
            // Group channels
            "telegram_up" | "telegram_down" => {
                let chat_id = if channel == "telegram_up" { &tg_chat_up } else { &tg_chat_down };
                if tg_token.is_empty() || chat_id.is_empty() {
                    errors.push(format!("Telegram token or chat ID is empty for channel: {}", channel));
                    continue;
                }
                let tg_url = format!("https://api.telegram.org/bot{}/sendMessage", tg_token);
                let res = client.post(&tg_url)
                    .json(&serde_json::json!({
                        "chat_id": chat_id,
                        "text": payload.message,
                        "parse_mode": "HTML"
                    }))
                    .send()
                    .await;

                match res {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            tg_sent += 1;
                        } else {
                            let err_text = resp.text().await.unwrap_or_default();
                            errors.push(format!("Telegram API error for {}: {}", channel, err_text));
                        }
                    }
                    Err(e) => {
                        errors.push(format!("Telegram request failed for {}: {}", channel, e));
                    }
                }

                // Insert global user notification
                let _ = sqlx::query!(
                    "INSERT INTO notifications (user_id, title, message, category, is_read) VALUES (NULL, $1, $2, 'broadcast', false)",
                    format!("Broadcast Grup: {}", channel),
                    payload.message
                )
                .execute(&state.pool)
                .await;
            }
            "whatsapp_up" | "whatsapp_down" => {
                let group_id = if channel == "whatsapp_up" { &wa_group_up } else { &wa_group_down };
                if group_id.is_empty() {
                    errors.push(format!("WhatsApp group ID is empty for channel: {}", channel));
                    continue;
                }
                let wa_url = format!("http://127.0.0.1:{}/send", wa_port);
                let res = client.post(&wa_url)
                    .json(&serde_json::json!({
                        "message": payload.message,
                        "group_id": group_id
                    }))
                    .send()
                    .await;

                match res {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            wa_sent += 1;
                        } else {
                            let err_text = resp.text().await.unwrap_or_default();
                            errors.push(format!("WhatsApp API error for {}: {}", channel, err_text));
                        }
                    }
                    Err(e) => {
                        errors.push(format!("WhatsApp request failed for {}: {}", channel, e));
                    }
                }

                // Insert global user notification
                let _ = sqlx::query!(
                    "INSERT INTO notifications (user_id, title, message, category, is_read) VALUES (NULL, $1, $2, 'broadcast', false)",
                    format!("Broadcast Grup: {}", channel),
                    payload.message
                )
                .execute(&state.pool)
                .await;
            }
            // Personal/targeted channels mapping directly to the filtered users
            "telegram" | "telegram_all_users" => {
                if tg_token.is_empty() {
                    errors.push("Telegram token is empty for user broadcast".to_string());
                    continue;
                }
                for u in &target_users {
                    if let Some(ref tg_id) = u.telegram {
                        if tg_id.trim().is_empty() { continue; }
                        let tg_url = format!("https://api.telegram.org/bot{}/sendMessage", tg_token);
                        let res = client.post(&tg_url)
                            .json(&serde_json::json!({
                                "chat_id": tg_id,
                                "text": payload.message,
                                "parse_mode": "HTML"
                            }))
                            .send()
                            .await;
                        match res {
                            Ok(resp) => {
                                if resp.status().is_success() {
                                    tg_sent += 1;
                                } else {
                                    let err_text = resp.text().await.unwrap_or_default();
                                    errors.push(format!("Telegram API error for user @{}: {}", u.username, err_text));
                                }
                            }
                            Err(e) => {
                                errors.push(format!("Telegram request failed for user @{}: {}", u.username, e));
                            }
                        }
                    }
                }
            }
            "whatsapp" | "whatsapp_all_users" => {
                for u in &target_users {
                    if let Some(ref wa_num) = u.whatsapp_number {
                        if wa_num.trim().is_empty() { continue; }
                        let jid = if wa_num.contains('@') {
                            wa_num.clone()
                        } else {
                            let clean_num: String = wa_num.chars().filter(|c| c.is_ascii_digit()).collect();
                            format!("{}@s.whatsapp.net", clean_num)
                        };
                        let wa_url = format!("http://127.0.0.1:{}/send", wa_port);
                        let res = client.post(&wa_url)
                            .json(&serde_json::json!({
                                "message": payload.message,
                                "group_id": jid
                            }))
                            .send()
                            .await;
                        match res {
                            Ok(resp) => {
                                if resp.status().is_success() {
                                    wa_sent += 1;
                                } else {
                                    let err_text = resp.text().await.unwrap_or_default();
                                    errors.push(format!("WhatsApp API error for user @{}: {}", u.username, err_text));
                                }
                            }
                            Err(e) => {
                                errors.push(format!("WhatsApp request failed for user @{}: {}", u.username, e));
                            }
                        }
                    }
                }
            }
            "email" | "email_all_users" => {
                for u in &target_users {
                    let email_addr = &u.email;
                    if email_addr.trim().is_empty() { continue; }
                    let email_body = format!(
                        "<div style='font-family: sans-serif; padding: 20px; color: #333;'><h2>Notifikasi Broadcast</h2><p>{}</p></div>",
                        payload.message
                    );
                    match crate::server::postgres_auth_hub::send_security_email(email_addr, "Notifikasi TradingSafe", &email_body).await {
                        Ok(_) => {
                            email_sent += 1;
                        }
                        Err(e) => {
                            errors.push(format!("Email failed for user @{}: {}", u.username, e));
                        }
                    }
                }
            }
            "web" => {
                for u in &target_users {
                    let _ = sqlx::query!(
                        "INSERT INTO notifications (user_id, title, message, category, is_read) VALUES ($1, 'Pemberitahuan Admin', $2, 'broadcast', false)",
                        u.id,
                        payload.message
                    )
                    .execute(&state.pool)
                    .await;
                    web_sent += 1;
                }
            }
            _ => {
                errors.push(format!("Unknown channel type: {}", channel));
            }
        }
    }

    let status_str = if errors.is_empty() { 
        "success".to_string() 
    } else if tg_sent > 0 || wa_sent > 0 || email_sent > 0 || web_sent > 0 { 
        "partial_success".to_string() 
    } else { 
        "failed".to_string() 
    };

    let channels_array: Vec<String> = payload.channels.clone();
    let log_msg = format!("Broadcast to {} users (Telegram: {}, WhatsApp: {}, Email: {}, Web: {}) Msg: {}", target_users.len(), tg_sent, wa_sent, email_sent, web_sent, payload.message);
    let _ = sqlx::query!(
        "INSERT INTO broadcast_logs_by_admin (message, channels, status) VALUES ($1, $2, $3)",
        log_msg, &channels_array, status_str
    )
    .execute(&state.pool)
    .await;

    (StatusCode::OK, Json(serde_json::json!({
        "status": status_str,
        "telegram_sent": tg_sent,
        "whatsapp_sent": wa_sent,
        "email_sent": email_sent,
        "web_sent": web_sent,
        "errors": errors
    })))
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../admin/src/types/BroadcastLog.ts")]
pub struct BroadcastLog {
    pub id: i32,
    pub message: String,
    pub channels: Vec<String>,
    pub status: String,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn get_broadcast_logs(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<BroadcastLog>>) {
    let rows = sqlx::query_as!(
        BroadcastLog,
        "SELECT id, message, channels as \"channels!\", status, created_at FROM broadcast_logs_by_admin ORDER BY created_at DESC LIMIT 50"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(rows))
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/UserNotificationLog.ts")]
pub struct UserNotificationLog {
    pub id: i32,
    pub user_id: Option<i32>,
    pub target_username: Option<String>,
    pub title: String,
    pub message: String,
    pub category: String,
    #[ts(type = "string")]
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub is_read: bool,
}

pub async fn get_user_notifications_logs(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<UserNotificationLog>>) {
    let rows = sqlx::query!(
        r#"
        SELECT 
            n.id, 
            n.user_id, 
            u.username as "target_username?", 
            n.title, 
            n.message, 
            n.category, 
            n.created_at, 
            n.is_read
        FROM notifications n
        LEFT JOIN users_by_usermanagement u ON n.user_id = u.id
        ORDER BY n.created_at DESC 
        LIMIT 100
        "#
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let logs = rows.into_iter().map(|r| UserNotificationLog {
        id: r.id,
        user_id: r.user_id,
        target_username: r.target_username,
        title: r.title,
        message: r.message,
        category: r.category,
        created_at: r.created_at,
        is_read: r.is_read.unwrap_or(false),
    }).collect();

    (StatusCode::OK, Json(logs))
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../admin/src/types/EmergencyBroadcastRequest.ts")]
pub struct EmergencyBroadcastRequest {
    pub message: String,
}

pub async fn emergency_broadcast(
    State(state): State<AppState>,
    Json(payload): Json<EmergencyBroadcastRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let rows = sqlx::query!("SELECT key, value FROM admin_notification_settings")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut tg_token = env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default();
    let mut tg_chat_up = env::var("TELEGRAM_CHAT_ID").unwrap_or_else(|_| "-1003973511282".to_string());
    let mut tg_chat_down = env::var("TELEGRAM_CHAT_ID_DOWN").unwrap_or_else(|_| "-5215838199".to_string());
    let mut wa_group_up = env::var("WHATSAPP_GROUP_ID").unwrap_or_else(|_| "120363427987942506@g.us".to_string());
    let mut wa_group_down = env::var("WHATSAPP_GROUP_ID_DOWN").unwrap_or_else(|_| "120363409651722299@g.us".to_string());
    let mut wa_port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string());

    for row in rows {
        match row.key.as_str() {
            "telegram_bot_token" => tg_token = row.value,
            "telegram_chat_id_up" => tg_chat_up = row.value,
            "telegram_chat_id_down" => tg_chat_down = row.value,
            "whatsapp_group_id_up" => wa_group_up = row.value,
            "whatsapp_group_id_down" => wa_group_down = row.value,
            "whatsapp_port" => wa_port = row.value,
            _ => {}
        }
    }

    let client = reqwest::Client::new();
    let mut tg_sent = 0;
    let mut wa_sent = 0;
    let mut errors = Vec::new();

    // A. Send to Telegram UP & DOWN groups
    for chat_id in &[&tg_chat_up, &tg_chat_down] {
        if !tg_token.is_empty() && !chat_id.is_empty() {
            let tg_url = format!("https://api.telegram.org/bot{}/sendMessage", tg_token);
            let res = client.post(&tg_url)
                .json(&serde_json::json!({
                    "chat_id": chat_id,
                    "text": payload.message,
                    "parse_mode": "HTML"
                }))
                .send()
                .await;
            match res {
                Ok(resp) if resp.status().is_success() => tg_sent += 1,
                Ok(resp) => {
                    let err = resp.text().await.unwrap_or_default();
                    errors.push(format!("Telegram API group error: {}", err));
                }
                Err(e) => errors.push(format!("Telegram group request failed: {}", e)),
            }
        }
    }

    // B. Send to WhatsApp UP & DOWN groups
    for group_id in &[&wa_group_up, &wa_group_down] {
        if !group_id.is_empty() {
            let wa_url = format!("http://127.0.0.1:{}/send", wa_port);
            let res = client.post(&wa_url)
                .json(&serde_json::json!({
                    "message": payload.message,
                    "group_id": group_id
                }))
                .send()
                .await;
            match res {
                Ok(resp) if resp.status().is_success() => wa_sent += 1,
                Ok(resp) => {
                    let err = resp.text().await.unwrap_or_default();
                    errors.push(format!("WhatsApp API group error: {}", err));
                }
                Err(e) => errors.push(format!("WhatsApp group request failed: {}", e)),
            }
        }
    }

    // C. Send to all personal Telegram subscribers
    if !tg_token.is_empty() {
        let users = sqlx::query!("SELECT id, username, telegram FROM users_by_usermanagement WHERE telegram IS NOT NULL")
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();
        for u in users {
            if let Some(ref tg_id) = u.telegram {
                if !tg_id.trim().is_empty() && tg_id.chars().all(|c| c.is_ascii_digit() || c == '-') {
                    let tg_url = format!("https://api.telegram.org/bot{}/sendMessage", tg_token);
                    let res = client.post(&tg_url)
                        .json(&serde_json::json!({
                            "chat_id": tg_id,
                            "text": payload.message,
                            "parse_mode": "HTML"
                        }))
                        .send()
                        .await;
                    match res {
                        Ok(resp) if resp.status().is_success() => tg_sent += 1,
                        Ok(resp) => {
                            let err = resp.text().await.unwrap_or_default();
                            errors.push(format!("Telegram user @{} API error: {}", u.username, err));
                        }
                        Err(e) => errors.push(format!("Telegram user @{} request failed: {}", u.username, e)),
                    }
                }
            }
        }
    }

    // D. Send to all personal WhatsApp subscribers
    let users_wa = sqlx::query!("SELECT id, username, whatsapp_number FROM users_by_usermanagement WHERE whatsapp_number IS NOT NULL")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    for u in users_wa {
        if let Some(ref wa_num) = u.whatsapp_number {
            let jid = if wa_num.contains('@') {
                wa_num.clone()
            } else {
                let clean_num: String = wa_num.chars().filter(|c| c.is_ascii_digit()).collect();
                format!("{}@s.whatsapp.net", clean_num)
            };
            let wa_url = format!("http://127.0.0.1:{}/send", wa_port);
            let res = client.post(&wa_url)
                .json(&serde_json::json!({
                    "message": payload.message,
                    "group_id": jid
                }))
                .send()
                .await;
            match res {
                Ok(resp) if resp.status().is_success() => wa_sent += 1,
                Ok(resp) => {
                    let err = resp.text().await.unwrap_or_default();
                    errors.push(format!("WhatsApp user @{} API error: {}", u.username, err));
                }
                Err(e) => errors.push(format!("WhatsApp user @{} request failed: {}", u.username, e)),
            }
        }
    }

    // Log the broadcast log
    let channels_logged = vec![
        "emergency_telegram_groups".to_string(),
        "emergency_whatsapp_groups".to_string(),
        "emergency_personal_users".to_string()
    ];
    let log_status = if errors.is_empty() { "success" } else { "partial_success" };
    let _ = sqlx::query!(
        "INSERT INTO broadcast_logs_by_admin (message, channels, status) VALUES ($1, $2, $3)",
        payload.message,
        &channels_logged,
        log_status
    )
    .execute(&state.pool)
    .await;

    // Insert global emergency user notification
    let _ = sqlx::query!(
        "INSERT INTO notifications (user_id, title, message, category, is_read) VALUES (NULL, 'Peringatan Darurat', $1, 'emergency', false)",
        payload.message
    )
    .execute(&state.pool)
    .await;

    (StatusCode::OK, Json(serde_json::json!({
        "status": log_status,
        "telegram_sent": tg_sent,
        "whatsapp_sent": wa_sent,
        "errors": errors
    })))
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/TelegramBotUpdate.ts")]
pub struct TelegramBotUpdate {
    pub chat_id: String,
    pub username: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub last_message: Option<String>,
    pub date: Option<i64>,
}

pub async fn get_telegram_bot_updates(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<TelegramBotUpdate>>) {
    let rows = sqlx::query!("SELECT value FROM admin_notification_settings WHERE key = 'telegram_bot_token'")
        .fetch_optional(&state.pool)
        .await
        .unwrap_or_default();

    let bot_token = match rows {
        Some(r) if !r.value.is_empty() => r.value,
        _ => match env::var("TELEGRAM_BOT_TOKEN") {
            Ok(token) => token,
            Err(_) => return (StatusCode::OK, Json(vec![])),
        }
    };

    let client = reqwest::Client::new();
    let url = format!("https://api.telegram.org/bot{}/getUpdates?timeout=5", bot_token);

    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(_) => return (StatusCode::OK, Json(vec![])),
    };

    if !response.status().is_success() {
        return (StatusCode::OK, Json(vec![]));
    }

    let json_val: serde_json::Value = match response.json().await {
        Ok(v) => v,
        Err(_) => return (StatusCode::OK, Json(vec![])),
    };

    let updates = match json_val.get("result").and_then(|r| r.as_array()) {
        Some(arr) => arr,
        None => return (StatusCode::OK, Json(vec![])),
    };

    let mut bot_updates = Vec::new();
    let mut seen_chats = std::collections::HashSet::new();

    for update in updates.iter().rev() {
        let message = update.get("message").or_else(|| update.get("channel_post"));
        if let Some(msg) = message {
            if let Some(chat) = msg.get("chat") {
                if let Some(chat_id) = chat.get("id") {
                    let chat_id_str = chat_id.to_string();
                    if seen_chats.insert(chat_id_str.clone()) {
                        let username = chat.get("username").and_then(|u| u.as_str()).map(|s| s.to_string());
                        let first_name = chat.get("first_name").and_then(|f| f.as_str()).map(|s| s.to_string());
                        let last_name = chat.get("last_name").and_then(|l| l.as_str()).map(|s| s.to_string());
                        let text = msg.get("text").and_then(|t| t.as_str()).map(|s| s.to_string());
                        let date = msg.get("date").and_then(|d| d.as_i64());

                        bot_updates.push(TelegramBotUpdate {
                            chat_id: chat_id_str,
                            username,
                            first_name,
                            last_name,
                            last_message: text,
                            date,
                        });
                    }
                }
            }
        }
    }

    (StatusCode::OK, Json(bot_updates))
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../admin/src/types/SpecialNotificationRequest.ts")]
pub struct SpecialNotificationRequest {
    pub user_id: i32,
    pub message: String,
    pub via_telegram: bool,
    pub via_whatsapp: bool,
    pub via_email: Option<bool>,
}

pub async fn send_special_notification(
    State(state): State<AppState>,
    Json(payload): Json<SpecialNotificationRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let user = sqlx::query!(
        "SELECT username, email, telegram, whatsapp_number FROM users_by_usermanagement WHERE id = $1",
        payload.user_id
    )
    .fetch_optional(&state.pool)
    .await
    .unwrap_or_default();

    let u = match user {
        Some(user) => user,
        None => return (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "status": "error",
            "message": "User not found"
        }))),
    };

    let rows = sqlx::query!("SELECT key, value FROM admin_notification_settings")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut tg_token = env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default();
    let mut wa_port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string());

    for row in rows {
        match row.key.as_str() {
            "telegram_bot_token" => tg_token = row.value,
            "whatsapp_port" => wa_port = row.value,
            _ => {}
        }
    }

    let client = reqwest::Client::new();
    let mut tg_sent = false;
    let mut wa_sent = false;
    let mut email_sent = false;
    let mut errors = Vec::new();

    if payload.via_telegram {
        if let Some(ref tg_id) = u.telegram {
            if !tg_id.trim().is_empty() && !tg_token.is_empty() {
                let tg_url = format!("https://api.telegram.org/bot{}/sendMessage", tg_token);
                let res = client.post(&tg_url)
                    .json(&serde_json::json!({
                        "chat_id": tg_id,
                        "text": payload.message,
                        "parse_mode": "HTML"
                    }))
                    .send()
                    .await;
                match res {
                    Ok(resp) if resp.status().is_success() => tg_sent = true,
                    Ok(resp) => {
                        let err = resp.text().await.unwrap_or_default();
                        errors.push(format!("Telegram API error: {}", err));
                    }
                    Err(e) => errors.push(format!("Telegram request failed: {}", e)),
                }
            } else {
                errors.push("Telegram is not linked or bot token is missing".to_string());
            }
        } else {
            errors.push("Telegram is not linked for this user".to_string());
        }
    }

    if payload.via_whatsapp {
        if let Some(ref wa_num) = u.whatsapp_number {
            if !wa_num.trim().is_empty() {
                let jid = if wa_num.contains('@') {
                    wa_num.clone()
                } else {
                    let clean_num: String = wa_num.chars().filter(|c| c.is_ascii_digit()).collect();
                    format!("{}@s.whatsapp.net", clean_num)
                };
                let wa_url = format!("http://127.0.0.1:{}/send", wa_port);
                let res = client.post(&wa_url)
                    .json(&serde_json::json!({
                        "message": payload.message,
                        "group_id": jid
                      }))
                    .send()
                    .await;
                match res {
                    Ok(resp) if resp.status().is_success() => wa_sent = true,
                    Ok(resp) => {
                        let err = resp.text().await.unwrap_or_default();
                        errors.push(format!("WhatsApp API error: {}", err));
                    }
                    Err(e) => errors.push(format!("WhatsApp request failed: {}", e)),
                }
            } else {
                errors.push("WhatsApp number is empty".to_string());
            }
        } else {
            errors.push("WhatsApp number is not configured for this user".to_string());
        }
    }

    if payload.via_email.unwrap_or(false) {
        let email_body = format!(
            "<div style='font-family: sans-serif; padding: 20px; color: #333;'><h2>Notifikasi Baru</h2><p>{}</p></div>",
            payload.message
        );
        match crate::server::postgres_auth_hub::send_security_email(&u.email, "Notifikasi TradingSafe", &email_body).await {
            Ok(_) => email_sent = true,
            Err(e) => errors.push(format!("Email sending failed: {}", e)),
        }
    }

    let mut channels_logged = Vec::new();
    if tg_sent {
        channels_logged.push(format!("personal_telegram:{}", u.username));
    }
    if wa_sent {
        channels_logged.push(format!("personal_whatsapp:{}", u.username));
    }
    if email_sent {
        channels_logged.push(format!("personal_email:{}", u.username));
    }

    let log_status = if errors.is_empty() { 
        "success".to_string() 
    } else if tg_sent || wa_sent || email_sent { 
        "partial_success".to_string() 
    } else { 
        "failed".to_string() 
    };

    if tg_sent || wa_sent || email_sent {
        let _ = sqlx::query!(
            "INSERT INTO broadcast_logs_by_admin (message, channels, status) VALUES ($1, $2, $3)",
            payload.message,
            &channels_logged,
            log_status
        )
        .execute(&state.pool)
        .await;
    }

    // Insert user notifications table row (wajib)
    let _ = sqlx::query!(
        "INSERT INTO notifications (user_id, title, message, category, is_read) VALUES ($1, 'Pesan Pribadi Admin', $2, 'personal', false)",
        payload.user_id,
        payload.message
    )
    .execute(&state.pool)
    .await;

    (StatusCode::OK, Json(serde_json::json!({
        "status": log_status,
        "errors": errors
    })))
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../admin/src/types/VpsNodeProcess.ts")]
pub struct VpsNodeProcess {
    pub id: i32,
    pub name: String,
    pub category: String,
    pub status: String,
    pub cpu: f64,
    pub memory: u64, // in bytes
    pub restarts: i32,
    pub uptime: u64, // ms
}

fn get_process_category(name: &str) -> &'static str {
    match name {
        "bottrade-backend" | "bottrade-db-admin" | "bottrade-admin" => "Bot Sistem",
        "bottrade-engine" => "Bot Trading",
        "engine-user-operator" => "Bot User",
        "whatsapp-bridge" => "Bot Notifikasi",
        "bottrade-frontend" => "Bot Frontend",
        _ => "Bot Sistem",
    }
}

pub async fn get_vps_nodes() -> (StatusCode, Json<serde_json::Value>) {
    let output = match std::process::Command::new("pm2").arg("jlist").output() {
        Ok(out) => out,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    };

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": err})));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value = match serde_json::from_str(&json_str) {
        Ok(val) => val,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    };

    let mut processes = Vec::new();
    if let Some(arr) = parsed.as_array() {
        for item in arr {
            let id = item.get("pm_id").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
            let category = get_process_category(&name).to_string();
            
            let pm2_env = item.get("pm2_env");
            let status = pm2_env.and_then(|e| e.get("status")).and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
            let restarts = pm2_env.and_then(|e| e.get("restart_time")).and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let uptime = pm2_env.and_then(|e| e.get("pm_uptime")).and_then(|v| v.as_u64()).unwrap_or(0);

            let monit = item.get("monit");
            let cpu = monit.and_then(|m| m.get("cpu")).and_then(|v| v.as_f64()).unwrap_or(0.0);
            let memory = monit.and_then(|m| m.get("memory")).and_then(|v| v.as_u64()).unwrap_or(0);

            processes.push(VpsNodeProcess {
                id,
                name,
                category,
                status,
                cpu,
                memory,
                restarts,
                uptime,
            });
        }
    }

    (StatusCode::OK, Json(serde_json::json!(processes)))
}

pub async fn control_vps_node(
    Path((id, action)): Path<(i32, String)>,
) -> (StatusCode, Json<serde_json::Value>) {
    let action_str = match action.as_str() {
        "restart" => "restart",
        "stop" => "stop",
        "start" => "start",
        _ => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "invalid action"}))),
    };

    let output = match std::process::Command::new("pm2").arg(action_str).arg(id.to_string()).output() {
        Ok(out) => out,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))),
    };

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": err})));
    }

    (StatusCode::OK, Json(serde_json::json!({"status": "success"})))
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../admin/src/types/SystemLog.ts")]
pub struct SystemLog {
    pub id: i32,
    pub process_name: String,
    pub log_level: String,
    pub message: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

async fn scan_and_store_logs(pool: &sqlx::PgPool) {
    use std::fs::File;
    use std::io::{BufRead, BufReader};

    let services = vec![
        "bottrade-backend",
        "bottrade-engine",
        "engine-user-operator",
        "whatsapp-bridge",
        "bottrade-admin",
        "bottrade-frontend",
    ];

    for service in services {
        // 1. Scan error log file (everything in -error.log is an error)
        let err_path = format!("/root/.pm2/logs/{}-error.log", service);
        if std::path::Path::new(&err_path).exists() {
            if let Ok(file) = File::open(&err_path) {
                let reader = BufReader::new(file);
                let lines: Vec<String> = reader.lines().filter_map(Result::ok).collect();
                let last_lines = if lines.len() > 50 { &lines[lines.len() - 50..] } else { &lines[..] };
                for line in last_lines {
                    let clean = line.trim();
                    if !clean.is_empty() {
                        let _ = sqlx::query(
                            "INSERT INTO system_logs_by_admin (process_name, log_level, message) 
                             VALUES ($1, $2, $3) ON CONFLICT (process_name, message) DO NOTHING"
                        )
                        .bind(service)
                        .bind("ERROR")
                        .bind(clean)
                        .execute(pool)
                        .await;
                    }
                }
            }
        }

        // 2. Scan out log file for warnings or errors
        let out_path = format!("/root/.pm2/logs/{}-out.log", service);
        if std::path::Path::new(&out_path).exists() {
            if let Ok(file) = File::open(&out_path) {
                let reader = BufReader::new(file);
                let lines: Vec<String> = reader.lines().filter_map(Result::ok).collect();
                let last_lines = if lines.len() > 50 { &lines[lines.len() - 50..] } else { &lines[..] };
                for line in last_lines {
                    let clean = line.trim();
                    if clean.is_empty() { continue; }
                    let lower = clean.to_lowercase();
                    
                    let level = if lower.contains("error") || lower.contains("panic") || lower.contains("exception") {
                        Some("ERROR")
                    } else if lower.contains("warning") || lower.contains("warn") {
                        Some("WARN")
                    } else if lower.contains("info") {
                        Some("INFO")
                    } else {
                        None
                    };

                    if let Some(lvl) = level {
                        let _ = sqlx::query(
                            "INSERT INTO system_logs_by_admin (process_name, log_level, message) 
                             VALUES ($1, $2, $3) ON CONFLICT (process_name, message) DO NOTHING"
                        )
                        .bind(service)
                        .bind(lvl)
                        .bind(clean)
                        .execute(pool)
                        .await;
                    }
                }
            }
        }
    }
}

pub async fn get_vps_logs(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<SystemLog>>) {
    // Ensure table exists
    let _ = sqlx::query(
        "CREATE TABLE IF NOT EXISTS system_logs_by_admin (
            id SERIAL PRIMARY KEY,
            process_name VARCHAR(100) NOT NULL,
            log_level VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_log UNIQUE (process_name, message)
         )"
    )
    .execute(&state.pool)
    .await;

    // Scan PM2 logs and store new errors/warnings in SQL
    scan_and_store_logs(&state.pool).await;

    // Query logs from SQL
    let logs = sqlx::query_as::<_, SystemLog>(
        "SELECT id, process_name, log_level, message, created_at 
         FROM system_logs_by_admin 
         ORDER BY created_at DESC LIMIT 200"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(logs))
}

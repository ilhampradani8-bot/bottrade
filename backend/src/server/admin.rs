use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::server::api::AppState;
use ts_rs::TS;
use bcrypt::verify;
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
        "SELECT id, password_hash, role FROM users WHERE username = $1",
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
    pub created_at: chrono::DateTime<chrono::Utc>,
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
        "SELECT id as \"id!\", username as \"username!\", email as \"email!\", role, created_at as \"created_at!\" FROM users ORDER BY created_at DESC"
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
        "SELECT s.id as \"id!\", s.user_id as \"user_id!\", s.name as \"name!\", s.bot_type as \"bot_type!\", s.pair as \"pair!\", s.status, u.username as \"username!\" 
         FROM strategies s 
         JOIN users u ON s.user_id = u.id 
         ORDER BY s.id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(bots))
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
    let users_count = sqlx::query!("SELECT COUNT(*) FROM users")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

    let bots_count = sqlx::query!("SELECT COUNT(*) FROM strategies WHERE status = 'Running'")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

    let trades_count = sqlx::query!("SELECT COUNT(*) FROM trades")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.count.unwrap_or(0))
        .unwrap_or(0);

    let profit = sqlx::query!("SELECT SUM(pnl) as total_pnl FROM trades")
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
}

pub async fn get_market_summary(
    State(state): State<AppState>,
) -> (StatusCode, Json<Vec<MarketSummary>>) {
    let summary = sqlx::query!(
        "SELECT symbol, interval, MIN(open_time) as start_t, MAX(open_time) as end_t, COUNT(*) as cnt 
         FROM market_data 
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
        "SELECT a.id, u.username as \"username!\", a.platform_name, a.label, a.created_at as \"created_at!\" 
         FROM api_keys a 
         JOIN users u ON a.user_id = u.id 
         ORDER BY a.created_at DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(keys))
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
        "SELECT id as \"id!\", pair as \"pair!\", strategy_type as \"strategy_type!\", side as \"side!\", price as \"price!\", amount as \"amount!\", pnl as \"pnl?\", created_at as \"created_at!\", status as \"status!\" 
         FROM trades ORDER BY created_at DESC LIMIT 20"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let stats = sqlx::query!(
        "SELECT DATE(created_at) as day, SUM(pnl) as total_pnl, COUNT(*) as cnt 
         FROM trades 
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
        "UPDATE users SET status = $1 WHERE id = $2",
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
        "UPDATE strategies SET status = $1 WHERE id = $2",
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

pub async fn update_bot_config(
    State(state): State<AppState>,
    Path(bot_id): Path<i32>,
    Json(payload): Json<UpdateBotConfig>,
) -> (StatusCode, Json<serde_json::Value>) {
    let result = sqlx::query!(
        "UPDATE strategies SET name = $1, settings = $2 WHERE id = $3",
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

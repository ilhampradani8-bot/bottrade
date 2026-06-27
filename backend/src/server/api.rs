use once_cell::sync::Lazy;
static DB_POOL: Lazy<std::sync::RwLock<Option<sqlx::PgPool>>> = Lazy::new(|| std::sync::RwLock::new(None));

use axum::{
    routing::{get, post, delete, put},
    Json, Router, extract::State,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use dotenvy::dotenv;
use std::env;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

use crate::get_data;
use crate::strategies;
use crate::server::postgres_auth_hub;
use crate::server::strategies as server_strategies;
use crate::api_exchange::ccxt_provider::CcxtProvider;
use ts_rs::TS;
use socketioxide::{
    extract::{Data, SocketRef},
    SocketIo,
};

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/TradeRequest.ts")]
struct TradeRequest {
    provider: String,
    exchange_id: String,
    api_key: String,
    secret: String,
    symbol: String,
    side: String,
    amount: f64,
    price: Option<f64>,
}

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub otp_cache: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, String>>>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/AvailableData.ts")]
struct AvailableData {
    symbol: String,
    interval: String,
    min_time: i64,
    max_time: i64,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/Strategy.ts")]
struct Strategy {
    id: String,
    name: String,
    mode: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/IndicatorInfo.ts")]
struct IndicatorInfo {
    id: String,
    name: String,
    category: String,
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../frontend/src/types/UserTrade.ts")]
pub struct UserTrade {
    pub id: i32,
    pub pair: String,
    pub strategy_type: String,
    pub side: String,
    #[ts(type = "string")]
    pub price: Decimal,
    #[ts(type = "string")]
    pub amount: Decimal,
    #[ts(type = "string | null")]
    pub pnl: Option<Decimal>,
    #[ts(type = "string")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub status: String,
    #[ts(type = "string | null")]
    pub requested_price: Option<Decimal>,
    #[ts(type = "string | null")]
    pub slippage: Option<Decimal>,
    pub market_regime: Option<String>,
    pub is_manual_intervention: Option<bool>,
    #[ts(type = "string | null")]
    pub intervention_pnl_diff: Option<Decimal>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub market_session: Option<String>,
    pub notes: Option<String>,
    pub change_history: Option<String>,
}

#[derive(Serialize, Deserialize, TS, sqlx::FromRow, Clone)]
#[ts(export, export_to = "../../frontend/src/types/ChatMessage.ts")]
struct ChatMessage {
    id: i32,
    user_id: Option<i32>,
    sender: String,
    text: String,
    created_at: chrono::DateTime<chrono::Utc>,
    recipient_id: Option<i32>,
    is_read: Option<bool>,
    session_id: Option<String>,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/SyncRequest.ts")]
struct SyncRequest {
    symbol: String,
    interval: String,
    start_time: Option<i64>,
    end_time: Option<i64>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/SyncResponse.ts")]
struct SyncResponse {
    status: String,
    message: String,
    added_count: u32,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/BacktestRequest.ts")]
struct BacktestRequest {
    strategy_id: String,
    pair: String,
    interval: String,
    #[ts(type = "string")]
    modal: Decimal,
    start_time: Option<i64>,
    end_time: Option<i64>,
    settings: Option<serde_json::Value>,
}

pub async fn start() {
    dotenvy::from_path("/root/bottrade/.env").ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    // Initialize notification & broadcast tables
    let _ = sqlx::query(
        "CREATE TABLE IF NOT EXISTS system_settings_by_admin (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL
         )"
    ).execute(&pool).await;

    let _ = sqlx::query(
        "CREATE TABLE IF NOT EXISTS admin_notification_settings (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL
         )"
    ).execute(&pool).await;

    let _ = sqlx::query(
        "CREATE TABLE IF NOT EXISTS broadcast_logs_by_admin (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            channels TEXT[] NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
         )"
    ).execute(&pool).await;

    let state = AppState { 
        pool: pool.clone(), 
        otp_cache: std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
    };
    *DB_POOL.write().unwrap() = Some(pool.clone());
    
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let (layer, io) = SocketIo::new_layer();
    io.ns("/", on_connect);

    let app = Router::new()
        .route("/api/strategies", get(get_strategies))
        .route("/api/available-data", get(get_available_data))
        .route("/api/sync-data", post(sync_data))
        .route("/api/backtest", post(run_backtest))
        .route("/api/auth/register", post(postgres_auth_hub::register))
        .route("/api/auth/login", post(postgres_auth_hub::login))
        .route("/api/auth/google", post(postgres_auth_hub::google_login))
        .route("/api/auth/social", post(postgres_auth_hub::social_login))
        .route("/api/auth/me", get(postgres_auth_hub::get_me))
        .route("/api/auth/settings", post(postgres_auth_hub::update_settings))
        .route("/api/auth/verify-telegram", post(postgres_auth_hub::verify_telegram))
        .route("/api/auth/send-whatsapp-otp", post(postgres_auth_hub::send_whatsapp_otp))
        .route("/api/auth/verify-whatsapp-otp", post(postgres_auth_hub::verify_whatsapp_otp))
        .route("/api/api-keys", get(server_strategies::get_api_keys))
        .route("/api/api-keys", post(server_strategies::save_api_key))
        .route("/api/strategies/save", post(server_strategies::save_strategy))
        .route("/api/strategies/user", get(server_strategies::get_user_strategies))
        .route("/api/strategies/:id/status", post(server_strategies::toggle_strategy_status))
        .route("/api/strategies/:id", delete(server_strategies::delete_strategy))
        .route("/api/simulations/save", post(crate::realtime_sim::routes::save_simulation))
        .route("/api/simulations/user", get(crate::realtime_sim::routes::get_user_simulations))
        .route("/api/simulations/:id/status", post(crate::realtime_sim::routes::toggle_simulation_status))
        .route("/api/simulations/:id", delete(crate::realtime_sim::routes::delete_simulation))
        .route("/api/simulations/trades", get(crate::realtime_sim::routes::get_simulation_trades))
        .route("/api/overview", get(crate::server::overview::get_overview))
        .route("/api/trade/execute", post(execute_trade))
        .route("/api/exchanges/ccxt", get(get_ccxt_exchanges))
        .route("/api/exchanges/rust", get(get_rust_exchanges))
        .route("/api/indicators", get(get_indicators))
        .route("/api/trades", get(get_trades).post(add_trade))
        .route("/api/trades/:id", put(update_trade).delete(delete_trade))
        .route("/api/notifications", get(get_notifications))
        .route("/api/notifications/:id/read", post(mark_notification_read))
        .route("/api/notifications/:id", delete(delete_notification))
        .route("/api/chat/history", get(get_chat_history))
        .route("/api/chat/sessions", get(get_chat_sessions).post(save_chat_session))
        .route("/api/chat/sessions/:id", delete(delete_chat_session))
        // Admin Routes
        .route("/api/admin/login", post(crate::server::admin::admin_login))
        .route("/api/admin/me", get(crate::server::admin::get_admin_me))
        .route("/api/admin/users", get(crate::server::admin::get_all_users).post(crate::server::admin::create_user))
        .route("/api/admin/users/:id", put(crate::server::admin::update_user).delete(crate::server::admin::delete_user))
        .route("/api/admin/bots", get(crate::server::admin::get_all_bots))
        .route("/api/admin/simulations", get(crate::server::admin::get_all_simulations))
        .route("/api/admin/overview", get(crate::server::admin::get_admin_overview))
        .route("/api/admin/reports", get(crate::server::admin::get_admin_reports))
        .route("/api/admin/trades", get(crate::server::admin::get_admin_trades))
        .route("/api/admin/simulations/trades", get(crate::server::admin::get_admin_sim_trades))
        .route("/api/admin/market-summary", get(crate::server::admin::get_market_summary))
        .route("/api/admin/api-keys", get(crate::server::admin::get_all_api_keys))
        .route("/api/admin/api-keys/:id/status", post(crate::server::admin::update_api_key_status))
        .route("/api/admin/vps-nodes", get(crate::server::admin::get_vps_nodes))
        .route("/api/admin/vps-nodes/:id/:action", post(crate::server::admin::control_vps_node))
        .route("/api/admin/vps-logs", get(crate::server::admin::get_vps_logs))
        .route("/api/admin/users/:id/status", post(crate::server::admin::update_user_status))
        .route("/api/admin/bots/:id/status", post(crate::server::admin::update_bot_status))
        .route("/api/admin/simulations/:id/status", post(crate::server::admin::update_simulation_status))
        .route("/api/admin/bots/:id/config", post(crate::server::admin::update_bot_config))
        .route("/api/admin/notification-settings", get(crate::server::admin::get_notification_settings).post(crate::server::admin::save_notification_settings))
        .route("/api/admin/broadcast", post(crate::server::admin::broadcast_message))
        .route("/api/admin/broadcast-logs", get(crate::server::admin::get_broadcast_logs))
        .route("/api/admin/user-notifications-logs", get(crate::server::admin::get_user_notifications_logs))
        .route("/api/admin/emergency-broadcast", post(crate::server::admin::emergency_broadcast))
        .route("/api/admin/telegram-bot-updates", get(crate::server::admin::get_telegram_bot_updates))
        .route("/api/admin/special-notification", post(crate::server::admin::send_special_notification))
        .with_state(state)
        .layer(layer)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("🚀 Rust Engine API running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_strategies() -> Json<Vec<Strategy>> {
    let strategies = vec![
        Strategy { id: "dca_lite".into(), name: "DCA Engine".into(), mode: "lite".into() },
        Strategy { id: "dca_pro".into(), name: "Advanced DCA".into(), mode: "pro".into() },
        Strategy { id: "grid_lite".into(), name: "Grid Trading".into(), mode: "lite".into() },
        Strategy { id: "combo_lite".into(), name: "Combo Strategy".into(), mode: "lite".into() },
        Strategy { id: "trailing_lite".into(), name: "Trailing Profit".into(), mode: "lite".into() },
        Strategy { id: "bollinger_pro".into(), name: "Bollinger Bands Pro".into(), mode: "pro".into() },
        Strategy { id: "ema_pro".into(), name: "EMA Cross Pro".into(), mode: "pro".into() },
        Strategy { id: "rsi_pro".into(), name: "RSI Momentum Pro".into(), mode: "pro".into() },
    ];
    Json(strategies)
}

async fn get_available_data(State(state): State<AppState>) -> Json<Vec<AvailableData>> {
    let rows = sqlx::query!(
        "SELECT symbol, interval, MIN(open_time) as min_time, MAX(open_time) as max_time FROM market_data_by_backtest GROUP BY symbol, interval"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let data = rows.into_iter().map(|r| AvailableData {
        symbol: r.symbol,
        interval: r.interval,
        min_time: r.min_time.unwrap_or(0),
        max_time: r.max_time.unwrap_or(0),
    }).collect();

    Json(data)
}

async fn sync_data(
    State(state): State<AppState>,
    Json(payload): Json<SyncRequest>
) -> Json<SyncResponse> {
    match get_data::fetch_binance_klines(&payload.symbol, &payload.interval, payload.start_time, payload.end_time).await {
        Ok(klines) => {
            match get_data::save_klines_to_db(&state.pool, &payload.symbol, &payload.interval, klines).await {
                Ok(count) => Json(SyncResponse {
                    status: "success".into(),
                    message: format!("Successfully synced {} klines", count),
                    added_count: count,
                }),
                Err(e) => Json(SyncResponse {
                    status: "error".into(),
                    message: format!("Database error: {}", e),
                    added_count: 0,
                }),
            }
        },
        Err(e) => Json(SyncResponse {
            status: "error".into(),
            message: format!("Binance API error: {}", e),
            added_count: 0,
        }),
    }
}

async fn run_backtest(
    State(state): State<AppState>,
    Json(payload): Json<BacktestRequest>
) -> Json<strategies::BacktestResult> {
    let symbol = payload.pair.replace("/", "");
    
    // Fetch data with optional time range and interval
    let query = if payload.start_time.is_some() && payload.end_time.is_some() {
        sqlx::query_as::<_, get_data::KlineRow>(
            "SELECT open_time, open, high, low, close, volume FROM market_data_by_backtest WHERE symbol = $1 AND interval = $2 AND open_time >= $3 AND open_time <= $4 ORDER BY open_time ASC"
        )
        .bind(&symbol)
        .bind(&payload.interval)
        .bind(payload.start_time.unwrap())
        .bind(payload.end_time.unwrap())
    } else {
        sqlx::query_as::<_, get_data::KlineRow>(
            "SELECT open_time, open, high, low, close, volume FROM market_data_by_backtest WHERE symbol = $1 AND interval = $2 ORDER BY open_time ASC"
        )
        .bind(&symbol)
        .bind(&payload.interval)
    };

    let rows = query.fetch_all(&state.pool).await.unwrap_or_default();
    let mut klines: Vec<get_data::Kline> = rows.into_iter().map(|r| r.into()).collect();

    // Auto data acquisition logic: if database has insufficient rows, pull from Binance API in chunks
    if klines.len() < 100 && payload.start_time.is_some() && payload.end_time.is_some() {
        let start_ts = payload.start_time.unwrap();
        let end_ts = payload.end_time.unwrap();
        let mut current_start = start_ts;
        let mut all_klines = Vec::new();
        let mut api_calls = 0;

        // Fetch in batches of 1000 up to 5 times (max 5000 candles per backtest request)
        while current_start < end_ts && api_calls < 5 {
            api_calls += 1;
            match get_data::fetch_binance_klines(&symbol, &payload.interval, Some(current_start), Some(end_ts)).await {
                Ok(chunk) => {
                    if chunk.is_empty() {
                        break;
                    }
                    let last_time = chunk.last().unwrap().open_time;
                    all_klines.extend(chunk);
                    if last_time <= current_start {
                        break;
                    }
                    current_start = last_time + 1; // Advance start time by 1ms to get next candles
                }
                Err(e) => {
                    eprintln!("Failed to dynamically fetch klines from Binance API: {:?}", e);
                    break;
                }
            }
        }

        if !all_klines.is_empty() {
            // Save to database so next time is cached and extremely fast
            let _ = get_data::save_klines_to_db(&state.pool, &symbol, &payload.interval, all_klines.clone()).await;
            
            // Merge local klines with fetched klines, sort, and deduplicate
            klines.extend(all_klines);
            klines.sort_by_key(|k| k.open_time);
            klines.dedup_by_key(|k| k.open_time);
        }
    }

    // Parse selected indicators from settings
    let selected_indicators: Vec<strategies::indicators::SelectedIndicator> = payload.settings
        .as_ref()
        .and_then(|s| s.get("indicators"))
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    // Build the indicator filter
    let filter = strategies::indicators::IndicatorFilter::build(&klines, &selected_indicators);

    match payload.strategy_id.as_str() {
        "dca_lite" => {
            let result = strategies::dca_lite::run_dca_backtest(&klines, payload.modal, &filter);
            Json(result)
        },
        "dca_pro" => {
            let settings: strategies::dca_pro::DcaProSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_else(|_| strategies::dca_pro::DcaProSettings {
                    base_order_size: dec!(100),
                    safety_order_size: dec!(100),
                    price_deviation: dec!(0.02),
                    step_scale: dec!(1),
                    volume_scale: dec!(1),
                    max_safety_orders: 5,
                    take_profit: dec!(0.015),
                    leverage: 1,
                    trailing_stop: None,
                    daily_drawdown_limit: None,
                })
            } else {
                strategies::dca_pro::DcaProSettings {
                    base_order_size: dec!(100),
                    safety_order_size: dec!(100),
                    price_deviation: dec!(0.02),
                    step_scale: dec!(1),
                    volume_scale: dec!(1),
                    max_safety_orders: 5,
                    take_profit: dec!(0.015),
                    leverage: 1,
                    trailing_stop: None,
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::dca_pro::run_dca_pro_backtest(&klines, settings, payload.modal, &filter);
            Json(result)
        },
        "grid_lite" => {
            let settings: strategies::grid_lite::GridSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_default()
            } else {
                strategies::grid_lite::GridSettings {
                    lower_price: dec!(60000),
                    upper_price: dec!(70000),
                    grid_number: 10,
                    modal: payload.modal,
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::grid_lite::run_grid_backtest(&klines, settings, &filter);
            Json(result)
        },
        "combo_lite" => {
            let settings: strategies::combo_lite::ComboSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_default()
            } else {
                strategies::combo_lite::ComboSettings {
                    buy_amount: payload.modal / dec!(10),
                    tp_percent: dec!(0.015),
                    dca_percent: dec!(0.02),
                    fast_period: 9,
                    slow_period: 21,
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::combo_lite::run_combo_backtest(&klines, settings, &filter);
            Json(result)
        },
        "trailing_lite" => {
            let settings: strategies::trailing_lite::TrailingSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_default()
            } else {
                strategies::trailing_lite::TrailingSettings {
                    buy_amount: payload.modal / dec!(10),
                    trailing_percent: dec!(0.01),
                    rsi_period: 14,
                    rsi_buy_level: dec!(30),
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::trailing_lite::run_trailing_backtest(&klines, settings, &filter);
            Json(result)
        },
        "bollinger_pro" => {
            let settings: strategies::bollinger_pro::BollingerSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_default()
            } else {
                strategies::bollinger_pro::BollingerSettings {
                    length: 20,
                    std_dev: dec!(2),
                    buy_amount: payload.modal / dec!(10),
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::bollinger_pro::run_bollinger_backtest(&klines, settings, &filter);
            Json(result)
        },
        "ema_pro" => {
            let settings: strategies::ema_pro::EmaSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_default()
            } else {
                strategies::ema_pro::EmaSettings {
                    fast_period: 9,
                    slow_period: 21,
                    buy_amount: payload.modal / dec!(10),
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::ema_pro::run_ema_cross_backtest(&klines, settings, &filter);
            Json(result)
        },
        "rsi_pro" => {
            let settings: strategies::rsi_pro::RsiDcaSettings = if let Some(s) = payload.settings {
                serde_json::from_value(s).unwrap_or_default()
            } else {
                strategies::rsi_pro::RsiDcaSettings {
                    rsi_period: 14,
                    rsi_buy_level: dec!(30),
                    dca_drop_percent: dec!(0.02),
                    take_profit_percent: dec!(0.015),
                    buy_amount: payload.modal / dec!(10),
                    daily_drawdown_limit: None,
                }
            };
            let result = strategies::rsi_pro::run_rsi_dca_backtest(&klines, settings, &filter);
            Json(result)
        },
        _ => {
            Json(strategies::BacktestResult {
                total_trades: 0,
                win_rate: dec!(0),
                total_pnl: dec!(0),
                trades: vec![],
                indicator_data: std::collections::HashMap::new(),
            })
        }
    }
}

async fn execute_trade(Json(payload): Json<TradeRequest>) -> Json<String> {
    if payload.provider == "ccxt" {
        // match CcxtProvider::execute_order(
        //     &payload.exchange_id,
        //     &payload.api_key,
        //     &payload.secret,
        //     &payload.symbol,
        //     &payload.side,
        //     payload.amount,
        //     payload.price,
        // ) {
        //     Ok(res) => Json(res),
        //     Err(e) => Json(format!("Execution Error: {}", e)),
        // }
        Json("CCXT Provider currently disabled for maintenance".into())
    } else {
        Json("Provider not supported yet".into())
    }
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/ExchangeInfo.ts")]
struct ExchangeInfo {
    id: String,
    name: String,
    logo: String,
}

async fn get_ccxt_exchanges() -> Json<Vec<ExchangeInfo>> {
    match CcxtProvider::get_exchanges() {
        Ok(list) => {
            let exchanges = list.into_iter().map(|id| ExchangeInfo {
                name: id.clone().to_uppercase(),
                id,
                logo: "".into(), // Logo disabled as requested for full list
            }).collect();
            Json(exchanges)
        },
        Err(e) => {
            println!("CCXT Error: {}", e);
            Json(vec![])
        }
    }
}

async fn get_rust_exchanges() -> Json<Vec<ExchangeInfo>> {
    let exchanges = vec![
        ExchangeInfo { id: "binance".into(), name: "Binance (Rust Native)".into(), logo: "".into() },
        ExchangeInfo { id: "coinbase".into(), name: "Coinbase (Rust Native)".into(), logo: "".into() },
        ExchangeInfo { id: "nash".into(), name: "Nash (Rust Native)".into(), logo: "".into() },
    ];
    Json(exchanges)
}

async fn get_indicators() -> Json<Vec<IndicatorInfo>> {
    let indicators = vec![
        IndicatorInfo { id: "rsi".into(), name: "Relative Strength Index".into(), category: "Momentum".into() },
        IndicatorInfo { id: "macd".into(), name: "MACD".into(), category: "Momentum".into() },
        IndicatorInfo { id: "bbands".into(), name: "Bollinger Bands".into(), category: "Volatility".into() },
        IndicatorInfo { id: "ema".into(), name: "Exponential Moving Average".into(), category: "Overlap".into() },
        IndicatorInfo { id: "sma".into(), name: "Simple Moving Average".into(), category: "Overlap".into() },
        IndicatorInfo { id: "supertrend".into(), name: "Supertrend".into(), category: "Trend".into() },
        IndicatorInfo { id: "atr".into(), name: "Average True Range".into(), category: "Volatility".into() },
        IndicatorInfo { id: "stoch".into(), name: "Stochastic Oscillator".into(), category: "Momentum".into() },
    ];
    Json(indicators)
}

#[derive(Serialize, TS, sqlx::FromRow)]
#[ts(export, export_to = "../../frontend/src/types/UserNotification.ts")]
pub struct UserNotification {
    pub id: i32,
    pub user_id: Option<i32>,
    pub title: String,
    pub message: String,
    pub category: String,
    #[ts(type = "string")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub is_read: bool,
}

async fn get_notifications(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Vec<UserNotification>>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(vec![])),
    };

    let notifications = sqlx::query_as::<_, UserNotification>(
        r#"SELECT 
            n.id, 
            n.user_id, 
            n.title, 
            n.message, 
            n.category, 
            n.created_at,
            COALESCE(
                CASE 
                    WHEN n.user_id IS NULL THEN EXISTS(
                        SELECT 1 FROM user_notification_reads r 
                        WHERE r.notification_id = n.id AND r.user_id = $1
                    )
                    ELSE n.is_read
                END,
                false
            ) as is_read
        FROM notifications n
        WHERE (n.user_id IS NULL OR n.user_id = $1)
          AND NOT EXISTS (
              SELECT 1 FROM user_notification_deletes d 
              WHERE d.notification_id = n.id AND d.user_id = $1
          )
        ORDER BY n.created_at DESC"#
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    (StatusCode::OK, Json(notifications))
}

async fn mark_notification_read(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i32>,
) -> StatusCode {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return StatusCode::UNAUTHORIZED,
    };

    let notif = sqlx::query!("SELECT user_id FROM notifications WHERE id = $1", id)
        .fetch_optional(&state.pool)
        .await;

    if let Ok(Some(row)) = notif {
        if row.user_id.is_none() {
            let _ = sqlx::query!(
                "INSERT INTO user_notification_reads (user_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                user_id,
                id
            )
            .execute(&state.pool)
            .await;
        } else if row.user_id == Some(user_id) {
            let _ = sqlx::query!(
                "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
                id,
                user_id
            )
            .execute(&state.pool)
            .await;
        }
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

async fn delete_notification(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i32>,
) -> StatusCode {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return StatusCode::UNAUTHORIZED,
    };

    let notif = sqlx::query!("SELECT user_id FROM notifications WHERE id = $1", id)
        .fetch_optional(&state.pool)
        .await;

    if let Ok(Some(row)) = notif {
        if row.user_id.is_none() {
            let _ = sqlx::query!(
                "INSERT INTO user_notification_deletes (user_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                user_id,
                id
            )
            .execute(&state.pool)
            .await;
        } else if row.user_id == Some(user_id) {
            let _ = sqlx::query!(
                "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
                id,
                user_id
            )
            .execute(&state.pool)
            .await;
        }
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

async fn get_trades(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> (StatusCode, Json<Vec<UserTrade>>) {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(vec![])),
    };
    
    let trades = sqlx::query_as::<_, UserTrade>(
        "SELECT id, pair, strategy_type, side, price, amount, pnl, created_at, status, requested_price, slippage, market_regime, is_manual_intervention, intervention_pnl_diff, error_code, error_message, market_session, notes, change_history FROM trades_by_jurnalriwayat WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500"
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();
        
    (StatusCode::OK, Json(trades))
}

#[derive(Deserialize)]
struct CreateTradeRequest {
    pair: String,
    strategy_type: String,
    side: String,
    price: Decimal,
    amount: Decimal,
    pnl: Option<Decimal>,
    status: String,
    notes: Option<String>,
    market_session: Option<String>,
    market_regime: Option<String>,
}

async fn add_trade(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<CreateTradeRequest>,
) -> StatusCode {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return StatusCode::UNAUTHORIZED,
    };
    
    let result = sqlx::query!(
        "INSERT INTO trades_by_jurnalriwayat (user_id, pair, strategy_type, side, price, amount, pnl, status, notes, market_session, market_regime) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        user_id,
        payload.pair,
        payload.strategy_type,
        payload.side,
        payload.price,
        payload.amount,
        payload.pnl,
        payload.status,
        payload.notes,
        payload.market_session,
        payload.market_regime
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[derive(Deserialize)]
struct UpdateTradeRequest {
    pair: String,
    strategy_type: String,
    side: String,
    price: Decimal,
    amount: Decimal,
    pnl: Option<Decimal>,
    status: String,
    notes: Option<String>,
    market_session: Option<String>,
    market_regime: Option<String>,
    change_history: Option<String>,
}

async fn update_trade(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i32>,
    Json(payload): Json<UpdateTradeRequest>,
) -> StatusCode {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return StatusCode::UNAUTHORIZED,
    };
    
    let result = sqlx::query!(
        "UPDATE trades_by_jurnalriwayat 
         SET pair = $1, strategy_type = $2, side = $3, price = $4, amount = $5, pnl = $6, status = $7, notes = $8, market_session = $9, market_regime = $10, change_history = $11
         WHERE id = $12 AND user_id = $13",
        payload.pair,
        payload.strategy_type,
        payload.side,
        payload.price,
        payload.amount,
        payload.pnl,
        payload.status,
        payload.notes,
        payload.market_session,
        payload.market_regime,
        payload.change_history,
        id,
        user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("Failed to update trade: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn delete_trade(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i32>,
) -> StatusCode {
    let user_id = match get_user_id_from_headers(&headers).await {
        Some(id) => id,
        None => return StatusCode::UNAUTHORIZED,
    };
    
    let result = sqlx::query!(
        "DELETE FROM trades_by_jurnalriwayat WHERE id = $1 AND user_id = $2",
        id,
        user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("Failed to delete trade: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn get_user_id_from_headers(headers: &axum::http::HeaderMap) -> Option<i32> {
    let auth_header = headers.get("Authorization")?.to_str().ok()?;
    let token = auth_header.replace("Bearer ", "");
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".into());
    
    let token_data = jsonwebtoken::decode::<postgres_auth_hub::Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    ).ok()?;

    Some(token_data.claims.sub)
}

async fn get_chat_history(State(state): State<AppState>, axum::extract::Query(params): axum::extract::Query<serde_json::Value>) -> Json<Vec<ChatMessage>> {
    let session_id = params.get("session_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            let user_id = params.get("user_id")
                .and_then(|v| {
                    v.as_str().and_then(|s| s.parse::<i32>().ok())
                     .or_else(|| v.as_i64().map(|n| n as i32))
                })
                .unwrap_or(0);
            format!("user_{}", user_id)
        });

    let limit = params.get("limit")
        .and_then(|v| {
            v.as_i64()
             .or_else(|| v.as_str().and_then(|s| s.parse::<i64>().ok()))
        })
        .unwrap_or(20);

    let offset = params.get("offset")
        .and_then(|v| {
            v.as_i64()
             .or_else(|| v.as_str().and_then(|s| s.parse::<i64>().ok()))
        })
        .unwrap_or(0);
    
    let messages = sqlx::query_as::<_, ChatMessage>(
        "SELECT * FROM (
            SELECT * FROM chat_messages_by_chat 
            WHERE session_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
         ) sub 
         ORDER BY created_at ASC"
    )
        .bind(&session_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
        
    Json(messages)
}

async fn on_connect(socket: SocketRef) {
    println!("🔌 New Socket.io connection established: {:?}", socket.id);

    socket.on_disconnect(|socket: SocketRef, reason: socketioxide::socket::DisconnectReason| async move {
        println!("🔌 Socket.io connection closed: {:?} (reason: {:?})", socket.id, reason);
    });

    // Live Kernel Logs for Admin
    let socket_clone = socket.clone();
    tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};
        use tokio::fs::File;
        
        let log_path = "/root/.pm2/logs/bottrade-engine-out.log";
        
        loop {
            if socket_clone.emit("system:ping", &serde_json::Value::Null).is_err() {
                println!("🔌 Socket {:?} disconnected. Stopping system logs background task.", socket_clone.id);
                break;
            }

            if let Ok(file) = File::open(log_path).await {
                let mut reader = BufReader::new(file);
                let _ = reader.seek(std::io::SeekFrom::End(0)).await;
                
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    if !line.trim().is_empty() {
                        if socket_clone.emit("system:logs", &line).is_err() {
                            println!("🔌 Socket {:?} disconnected during log emit. Stopping task.", socket_clone.id);
                            return;
                        }
                    }
                }
            }
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        }
    });

    socket.on("chat:join", |socket: SocketRef, Data::<serde_json::Value>(data)| async move {
        let role = data.get("role").and_then(|v| v.as_str()).unwrap_or("");
        if role == "admin" {
            let _ = socket.join("admin");
            println!("🔌 Socket {:?} joined room: admin", socket.id);
        } else if role == "user" {
            // Support both numeric user_id (logged in) and string guest_id (guest)
            let user_id_val = data.get("user_id");
            let room_name = if let Some(val) = user_id_val {
                if let Some(n) = val.as_i64() {
                    format!("user_{}", n)
                } else if let Some(s) = val.as_str() {
                    if s.starts_with("guest_") {
                        s.to_string() // Guest IDs are used as-is for room name
                    } else if let Ok(n) = s.parse::<i32>() {
                        format!("user_{}", n)
                    } else {
                        s.to_string()
                    }
                } else {
                    return;
                }
            } else {
                return;
            };
            let _ = socket.join(room_name.clone());
            println!("🔌 Socket {:?} joined room: {}", socket.id, room_name);
        }
    });

    socket.on("chat:read", |socket: SocketRef, Data::<serde_json::Value>(data)| async move {
        let pool = DB_POOL.read().unwrap().as_ref().cloned().unwrap();
        if let Some(session_id) = data.get("session_id").and_then(|v| v.as_str()) {
            println!("💬 Socket.io chat:read received for session_id: '{}'", session_id);
            let update_res = sqlx::query!(
                "UPDATE chat_messages_by_chat SET is_read = true WHERE session_id = $1 AND sender = 'user'",
                session_id
            )
            .execute(&pool)
            .await;

            if let Ok(rows) = update_res {
                if rows.rows_affected() > 0 {
                    let user_id_res = sqlx::query_scalar::<_, i32>(
                        "SELECT user_id FROM chat_sessions_by_chat WHERE id = $1"
                    )
                    .bind(session_id)
                    .fetch_optional(&pool)
                    .await;

                    if let Ok(Some(uid)) = user_id_res {
                        let room_name = format!("user_{}", uid);
                        println!("💬 Emitting chat:read_ack to room {}", room_name);
                        let _ = socket.to(room_name).emit("chat:read_ack", &serde_json::json!({
                            "user_id": uid,
                            "session_id": session_id
                        })).await;
                    }
                }
            }
        }
    });

    socket.on("chat:send", |socket: SocketRef, Data::<serde_json::Value>(data)| async move {
        let pool = DB_POOL.read().unwrap().as_ref().cloned().unwrap();
        let text = data.get("text").and_then(|v| v.as_str()).unwrap_or("");
        let sender = data.get("sender").and_then(|v| v.as_str()).unwrap_or("user");
        
        // user_id can be a number (logged in) or a string like "guest_abc123"
        let user_id_str = data.get("user_id").map(|v| {
            if let Some(n) = v.as_i64() { n.to_string() }
            else if let Some(s) = v.as_str() { s.to_string() }
            else { "0".to_string() }
        }).unwrap_or_else(|| "0".to_string());
        
        let user_id_numeric = user_id_str.parse::<i32>().ok();
        let is_guest = user_id_str.starts_with("guest_");

        let recipient_id_str = data.get("recipient_id").and_then(|v| {
            v.as_i64().map(|n| n.to_string())
             .or_else(|| v.as_str().map(|s| s.to_string()))
        });
        let recipient_id_numeric = recipient_id_str.as_ref().and_then(|s| s.parse::<i32>().ok());

        // Determine session_id: use from payload if provided, else compute
        let session_id = data.get("session_id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                if is_guest {
                    user_id_str.clone()
                } else if let Some(uid) = user_id_numeric {
                    if uid == 0 {
                        recipient_id_str.clone().unwrap_or_else(|| "unknown".to_string())
                    } else {
                        format!("user_{}", uid)
                    }
                } else {
                    user_id_str.clone()
                }
            });

        // Determine the room to emit to for this user
        let user_room = if is_guest {
            user_id_str.clone()
        } else if let Some(uid) = user_id_numeric {
            format!("user_{}", uid)
        } else {
            user_id_str.clone()
        };

        // Upsert chat session
        let session_name = if is_guest {
            format!("Tamu {}", &user_id_str[6..].chars().take(6).collect::<String>())
        } else if let Some(uid) = user_id_numeric {
            if uid != 0 {
                sqlx::query_scalar::<_, String>(
                    "SELECT username FROM users_by_usermanagement WHERE id = $1"
                )
                .bind(uid)
                .fetch_one(&pool)
                .await
                .unwrap_or_else(|_| format!("User #{}", uid))
            } else {
                "Admin".to_string()
            }
        } else {
            format!("User {}", user_id_str)
        };

        let user_id_for_db = user_id_numeric.unwrap_or(0);
        let _ = sqlx::query(
            "INSERT INTO chat_sessions_by_chat (id, user_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $3"
        )
        .bind(&session_id)
        .bind(user_id_for_db)
        .bind(&session_name)
        .execute(&pool)
        .await;

        println!("💬 chat:send - text: '{}', sender: '{}', uid: '{}', session: '{}'", text, sender, user_id_str, session_id);

        let query_res = sqlx::query_scalar::<_, i32>("INSERT INTO chat_messages_by_chat (user_id, sender, text, recipient_id, session_id) VALUES ($1, $2, $3, $4, $5) RETURNING id")
            .bind(if user_id_for_db == 0 { None } else { Some(user_id_for_db) })
            .bind(sender)
            .bind(text)
            .bind(recipient_id_numeric)
            .bind(&session_id)
            .fetch_one(&pool)
            .await;

        match query_res {
            Ok(inserted_id) => {
                let status_payload = serde_json::json!({
                    "id": data.get("id").unwrap_or(&serde_json::Value::Null),
                    "status": "sent",
                    "db_id": inserted_id
                });
                let _ = socket.emit("chat:status", &status_payload);
            }
            Err(e) => {
                eprintln!("Failed to save chat message to SQL: {:?}", e);
            }
        }

        // Direct room-based emit
        if sender == "admin" {
            let target_room = if let Some(rid) = &recipient_id_str {
                if rid.starts_with("guest_") {
                    rid.clone()
                } else if let Some(n) = recipient_id_numeric {
                    format!("user_{}", n)
                } else {
                    rid.clone()
                }
            } else {
                session_id.clone()
            };
            println!("💬 Admin sent chat: receive to room {}", target_room);
            match socket.to(target_room).emit("chat:receive", &data).await {
                Ok(_) => println!("   ✅ Emitted to user room successfully"),
                Err(e) => println!("   ❌ Failed to emit to user room: {:?}", e),
            }
        } else {
            println!("💬 User sent chat: receive to room {} and admin", user_room);
            match socket.to(user_room).emit("chat:receive", &data).await {
                Ok(_) => println!("   ✅ Emitted to user_room successfully"),
                Err(e) => println!("   ❌ Failed to emit to user_room: {:?}", e),
            }
            match socket.to("admin").emit("chat:receive", &data).await {
                Ok(_) => println!("   ✅ Emitted to admin room successfully"),
                Err(e) => println!("   ❌ Failed to emit to admin room: {:?}", e),
            }
        }
    });
}

#[derive(Serialize, Deserialize, sqlx::FromRow, TS)]
#[ts(export, export_to = "../../frontend/src/types/ChatSessionMetadata.ts")]
pub struct ChatSessionMetadata {
    pub id: String,
    pub user_id: i32,
    pub name: String,
    pub notes: Option<String>,
}

async fn get_chat_sessions(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<serde_json::Value>
) -> Json<Vec<ChatSessionMetadata>> {
    let user_id = params.get("user_id")
        .and_then(|v| {
            v.as_str().and_then(|s| s.parse::<i32>().ok())
             .or_else(|| v.as_i64().map(|n| n as i32))
        })
        .unwrap_or(0);

    let sessions = if user_id == 0 {
        sqlx::query_as::<_, ChatSessionMetadata>(
            "SELECT id, user_id, name, notes FROM chat_sessions_by_chat ORDER BY created_at DESC"
        )
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default()
    } else {
        sqlx::query_as::<_, ChatSessionMetadata>(
            "SELECT id, user_id, name, notes FROM chat_sessions_by_chat WHERE user_id = $1 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default()
    };

    Json(sessions)
}

async fn save_chat_session(
    State(state): State<AppState>,
    Json(payload): Json<ChatSessionMetadata>
) -> StatusCode {
    let query_res = sqlx::query(
        "INSERT INTO chat_sessions_by_chat (id, user_id, name, notes) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, notes = EXCLUDED.notes"
    )
    .bind(&payload.id)
    .bind(payload.user_id)
    .bind(&payload.name)
    .bind(&payload.notes)
    .execute(&state.pool)
    .await;

    match query_res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("Failed to save chat session: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn delete_chat_session(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>
) -> StatusCode {
    let mut tx = match state.pool.begin().await {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Failed to start transaction for delete: {:?}", e);
            return StatusCode::INTERNAL_SERVER_ERROR;
        }
    };

    let msg_del = sqlx::query("DELETE FROM chat_messages_by_chat WHERE session_id = $1")
        .bind(&id)
        .execute(&mut *tx)
        .await;

    let sess_del = sqlx::query("DELETE FROM chat_sessions_by_chat WHERE id = $1")
        .bind(&id)
        .execute(&mut *tx)
        .await;

    if msg_del.is_ok() && sess_del.is_ok() {
        if tx.commit().await.is_ok() {
            return StatusCode::OK;
        }
    }
    StatusCode::INTERNAL_SERVER_ERROR
}

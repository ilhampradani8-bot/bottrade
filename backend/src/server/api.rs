use once_cell::sync::Lazy;
static DB_POOL: Lazy<std::sync::RwLock<Option<sqlx::PgPool>>> = Lazy::new(|| std::sync::RwLock::new(None));

use axum::{
    routing::{get, post},
    Json, Router, extract::State,
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
}

#[derive(Serialize, Deserialize, TS, sqlx::FromRow, Clone)]
#[ts(export, export_to = "../../frontend/src/types/ChatMessage.ts")]
struct ChatMessage {
    id: i32,
    user_id: i32,
    sender: String,
    text: String,
    created_at: chrono::DateTime<chrono::Utc>,
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
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    let state = AppState { pool: pool.clone() };
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
        .route("/api/auth/me", get(postgres_auth_hub::get_me))
        .route("/api/api-keys", get(server_strategies::get_api_keys))
        .route("/api/api-keys", post(server_strategies::save_api_key))
        .route("/api/strategies/save", post(server_strategies::save_strategy))
        .route("/api/overview", get(crate::server::overview::get_overview))
        .route("/api/trade/execute", post(execute_trade))
        .route("/api/exchanges/ccxt", get(get_ccxt_exchanges))
        .route("/api/exchanges/rust", get(get_rust_exchanges))
        .route("/api/indicators", get(get_indicators))
        .route("/api/trades", get(get_trades))
        .route("/api/chat/history", get(get_chat_history))
        // Admin Routes
        .route("/api/admin/login", post(crate::server::admin::admin_login))
        .route("/api/admin/users", get(crate::server::admin::get_all_users))
        .route("/api/admin/bots", get(crate::server::admin::get_all_bots))
        .route("/api/admin/overview", get(crate::server::admin::get_admin_overview))
        .route("/api/admin/reports", get(crate::server::admin::get_admin_reports))
        .route("/api/admin/market-summary", get(crate::server::admin::get_market_summary))
        .route("/api/admin/api-keys", get(crate::server::admin::get_all_api_keys))
        .route("/api/admin/users/:id/status", post(crate::server::admin::update_user_status))
        .route("/api/admin/bots/:id/status", post(crate::server::admin::update_bot_status))
        .route("/api/admin/bots/:id/config", post(crate::server::admin::update_bot_config))
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
        "SELECT symbol, interval, MIN(open_time) as min_time, MAX(open_time) as max_time FROM market_data GROUP BY symbol, interval"
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
            "SELECT open_time, open, high, low, close, volume FROM market_data WHERE symbol = $1 AND interval = $2 AND open_time >= $3 AND open_time <= $4 ORDER BY open_time ASC"
        )
        .bind(&symbol)
        .bind(&payload.interval)
        .bind(payload.start_time.unwrap())
        .bind(payload.end_time.unwrap())
    } else {
        sqlx::query_as::<_, get_data::KlineRow>(
            "SELECT open_time, open, high, low, close, volume FROM market_data WHERE symbol = $1 AND interval = $2 ORDER BY open_time ASC"
        )
        .bind(&symbol)
        .bind(&payload.interval)
    };

    let rows = query.fetch_all(&state.pool).await.unwrap_or_default();
    let klines: Vec<get_data::Kline> = rows.into_iter().map(|r| r.into()).collect();

    match payload.strategy_id.as_str() {
        "dca_lite" => {
            let result = strategies::dca_lite::run_dca_backtest(&klines, payload.modal);
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
            let result = strategies::dca_pro::run_dca_pro_backtest(&klines, settings, payload.modal);
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
            let result = strategies::grid_lite::run_grid_backtest(&klines, settings);
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
            let result = strategies::combo_lite::run_combo_backtest(&klines, settings);
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
            let result = strategies::trailing_lite::run_trailing_backtest(&klines, settings);
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
            let result = strategies::bollinger_pro::run_bollinger_backtest(&klines, settings);
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
            let result = strategies::ema_pro::run_ema_cross_backtest(&klines, settings);
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
            let result = strategies::rsi_pro::run_rsi_dca_backtest(&klines, settings);
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

async fn get_trades(State(state): State<AppState>) -> Json<Vec<UserTrade>> {
    // In real implementation, filter by user_id from JWT
    let trades = sqlx::query_as::<_, UserTrade>("SELECT * FROM trades ORDER BY created_at DESC LIMIT 50")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
        
    Json(trades)
}

async fn get_chat_history(State(state): State<AppState>, axum::extract::Query(params): axum::extract::Query<serde_json::Value>) -> Json<Vec<ChatMessage>> {
    let user_id = params.get("user_id").and_then(|v| v.as_str()).and_then(|v| v.parse::<i32>().ok()).unwrap_or(0);
    
    let messages = sqlx::query_as::<_, ChatMessage>("SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100")
        .bind(user_id)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
        
    Json(messages)
}

async fn on_connect(socket: SocketRef) {
    // Live Kernel Logs for Admin
    let socket_clone = socket.clone();
    tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};
        use tokio::fs::File;
        
        let log_path = "/root/.pm2/logs/bottrade-engine-out.log";
        
        loop {
            if let Ok(file) = File::open(log_path).await {
                let mut reader = BufReader::new(file);
                let _ = reader.seek(std::io::SeekFrom::End(0)).await;
                
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    if !line.trim().is_empty() {
                        let _ = socket_clone.emit("system:logs", &line);
                    }
                }
            }
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        }
    });

    socket.on("chat:send", |socket: SocketRef, Data::<serde_json::Value>(data)| async move {
        let pool = DB_POOL.read().unwrap().as_ref().cloned().unwrap();
        let text = data.get("text").and_then(|v| v.as_str()).unwrap_or("");
        let sender = data.get("sender").and_then(|v| v.as_str()).unwrap_or("user");
        let user_id = data.get("user_id").and_then(|v| v.as_i64()).unwrap_or(0) as i32;

        let _ = sqlx::query("INSERT INTO chat_messages (user_id, sender, text) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(sender)
            .bind(text)
            .execute(&pool)
            .await;

        let _ = socket.broadcast().emit("chat:receive", &data).await;
    });
}

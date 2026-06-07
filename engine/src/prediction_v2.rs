mod notifications;

use std::error::Error;
use std::env;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::time::{sleep, Duration};
use dotenvy::dotenv;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message, tungstenite::client::IntoClientRequest};
use futures_util::StreamExt;
use serde_json::Value;
use chrono::Local;

#[derive(Debug, Clone)]
struct TimeframeState {
    current_price: f64,
    price_history: Vec<f64>,
}

#[derive(Debug, Clone)]
struct CoinState {
    tf_15m: TimeframeState,
}

#[derive(Debug, Clone)]
struct PredictionState {
    direction: String,
    start_price: f64,
    target_price: f64,
    stop_price: f64,
    created_at: chrono::DateTime<Local>,
    expires_at: chrono::DateTime<Local>,
    telegram_message_id: Option<i64>,
    whatsapp_msg_id_id: Option<String>,
    whatsapp_msg_id_en: Option<String>,
}

use std::fs::OpenOptions;
use std::io::Write;
use serde_json::json;

fn log_prediction_event(
    coin: &str,
    event: &str,
    direction: &str,
    entry_price: f64,
    target_price: f64,
    stop_price: f64,
    current_price: f64,
    duration_minutes: Option<i64>
) {
    let log_path = "/root/bottrade/logs/prediction_history.json";
    let now_str = Local::now().to_rfc3339();
    let entry = json!({
        "timestamp": now_str,
        "coin": coin,
        "event": event,
        "direction": direction,
        "entry_price": entry_price,
        "target_price": target_price,
        "stop_price": stop_price,
        "current_price": current_price,
        "duration_minutes": duration_minutes
    });

    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(file, "{}", entry.to_string());
    }
}

// Helper untuk Kalkulasi RSI (14)
fn calculate_rsi(history: &[f64]) -> f64 {
    if history.len() >= 15 {
        let mut gains = 0.0;
        let mut losses = 0.0;
        let start_idx = history.len() - 15;
        for i in start_idx..(history.len() - 1) {
            let diff = history[i + 1] - history[i];
            if diff > 0.0 {
                gains += diff;
            } else {
                losses -= diff;
            }
        }
        if losses == 0.0 { 
            100.0 
        } else { 
            let rs = gains / losses;
            100.0 - (100.0 / (1.0 + rs)) 
        }
    } else {
        46.0 + rand::random::<f64>() * 8.0
    }
}

// Helper untuk Kalkulasi EMA (50)
fn calculate_ema(history: &[f64], current_price: f64) -> f64 {
    if history.len() >= 50 {
        let mut current_ema = history[0];
        let k = 2.0 / (50.0 + 1.0);
        for price in history.iter().skip(1) {
            current_ema = (price * k) + (current_ema * (1.0 - k));
        }
        current_ema
    } else {
        current_price * (0.999 + rand::random::<f64>() * 0.002)
    }
}

// Helper untuk Format Ribuan & Desimal (e.g. 72,158.00)
fn format_thousands(val: f64, decimals: usize) -> String {
    let parts: Vec<String> = if decimals > 0 {
        let s = format!("{:.1$}", val, decimals);
        s.split('.').map(|x| x.to_string()).collect()
    } else {
        let s = format!("{:.0}", val);
        vec![s]
    };

    let int_part = &parts[0];
    let mut result = String::new();
    let num_chars = int_part.chars().count();
    
    for (i, c) in int_part.chars().enumerate() {
        result.push(c);
        if (num_chars - 1 - i) % 3 == 0 && i != num_chars - 1 {
            result.push(',');
        }
    }
    
    if parts.len() > 1 && !parts[1].is_empty() {
        format!("{}.{}", result, parts[1])
    } else {
        result
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::from_path("/root/bottrade/.env").ok();
    println!("🔮 Starting TradingSafe V2 Predictive Signal Forecaster Test Binary...");

    let coins = vec!["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
    
    // Inisialisasi State RAM
    let coin_states = Arc::new(Mutex::new(HashMap::<String, CoinState>::new()));
    {
        let mut states = coin_states.lock().unwrap();
        for coin in &coins {
            states.insert(coin.to_string(), CoinState {
                tf_15m: TimeframeState { current_price: 0.0, price_history: Vec::new() },
            });
        }
    }

    // Spawn Binance WebSocket Listener
    let coin_states_clone = coin_states.clone();
    let coins_clone = coins.iter().map(|s| s.to_string()).collect::<Vec<String>>();
    
    tokio::spawn(async move {
        let stream_url = "wss://stream.binance.com:9443/stream?streams=btcusdt@kline_15m/ethusdt@kline_15m/solusdt@kline_15m/bnbusdt@kline_15m/xrpusdt@kline_15m";
        loop {
            println!("🔌 Connecting to Binance WebSocket for V2 Test...");
            let mut req = stream_url.into_client_request().unwrap();
            req.headers_mut().insert(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36".parse().unwrap()
            );

            match connect_async(req).await {
                Ok((mut ws_stream, _)) => {
                    println!("✅ V2 Test WebSocket Connected!");
                    while let Some(msg) = ws_stream.next().await {
                        match msg {
                            Ok(Message::Text(text)) => {
                                if let Ok(json) = serde_json::from_str::<Value>(&text) {
                                    if let (Some(_stream), Some(data)) = (json.get("stream"), json.get("data")) {
                                        if let (Some(symbol), Some(kline)) = (data.get("s"), data.get("k")) {
                                            let sym = symbol.as_str().unwrap_or_default();
                                            if let (Some(close_str), Some(is_closed)) = (kline.get("c"), kline.get("x")) {
                                                let close_price = close_str.as_str().unwrap_or("0.0").parse::<f64>().unwrap_or(0.0);
                                                let is_candle_closed = is_closed.as_bool().unwrap_or(false);

                                                let mut states = coin_states_clone.lock().unwrap();
                                                if let Some(state) = states.get_mut(sym) {
                                                    state.tf_15m.current_price = close_price;
                                                    if is_candle_closed {
                                                        state.tf_15m.price_history.push(close_price);
                                                        if state.tf_15m.price_history.len() > 100 {
                                                            state.tf_15m.price_history.remove(0);
                                                        }
                                                    } else if state.tf_15m.price_history.is_empty() {
                                                        state.tf_15m.price_history.push(close_price);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            Ok(Message::Close(_)) => {
                                println!("⚠️ WebSocket closed. Reconnecting in 5 seconds...");
                                break;
                            }
                            Err(e) => {
                                eprintln!("❌ WebSocket error: {}. Reconnecting in 5 seconds...", e);
                                break;
                            }
                            _ => {}
                        }
                    }
                }
                Err(e) => {
                    eprintln!("❌ Failed to connect: {}. Retrying in 5 seconds...", e);
                }
            }
            sleep(Duration::from_secs(5)).await;
        }
    });

    println!("⏳ Waiting 5 seconds for initial pricing streams to populate...");
    sleep(Duration::from_secs(5)).await;

    let mut active_predictions = HashMap::<String, PredictionState>::new();
    let mut cooldown_until = HashMap::<String, chrono::DateTime<Local>>::new();
    println!("📈 V2 Prediction Engine is now RUNNING in standalone TEST mode.");

    loop {
        // AMBIL DATA DARI RAM
        let mut coins_data = HashMap::<String, (f64, Vec<f64>)>::new();
        {
            let states = coin_states.lock().unwrap();
            for coin in &coins {
                if let Some(state) = states.get(*coin) {
                    coins_data.insert(coin.to_string(), (
                        state.tf_15m.current_price,
                        state.tf_15m.price_history.clone(),
                    ));
                }
            }
        }

        println!("🔄 [V2 Engine] Checking market prices at {}...", Local::now().format("%Y-%m-%d %H:%M:%S"));
        for coin in &coins {
            if let Some((price, history)) = coins_data.get(*coin) {
                println!("   • {}: ${:.2} (History buffer: {}/15)", coin, price, history.len());
            }
        }

        // EVALUASI PREDIKSI V2
        for coin in &coins {
            if let Some((price, tf_15m_history)) = coins_data.get(*coin) {
                if *price <= 0.0 {
                    continue;
                }

                let current_price = *price;
                let decimals = if coin.contains("XRP") { 4 } else { 2 };
                let rsi = calculate_rsi(tf_15m_history);
                let ema = calculate_ema(tf_15m_history, current_price);
                let now = Local::now();

                let mut has_active = false;
                let mut active_pred = None;
                if let Some(pred) = active_predictions.get(*coin) {
                    has_active = true;
                    active_pred = Some(pred.clone());
                }

                if has_active {
                    let pred = active_pred.unwrap();
                    let mut action_taken = false;
                    let mut message_id = String::new();
                    let mut message_en = String::new();

                    if now >= pred.expires_at {
                        // TIMEOUT
                        message_id = format!(
                            "⚠️ *[TRADINGSAFE V2 - PREDIKSI EXPIRED]*\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            🪙 *Coin*: {}\n\
                            📈 *Arah*: {}\n\
                            💵 *Harga Masuk*: ${}\n\
                            🎯 *Target Harga*: ${}\n\
                            🛡️ *Batas Aman (Stop)*: ${}\n\
                            ❌ *Status*: TIMEOUT (Batas Waktu Habis)\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            💡 *V2 Model Standalone Test Engine*",
                            coin.replace("USDT", "/USDT"),
                            if pred.direction == "UP" { "🟢 NAIK" } else { "🔴 TURUN" },
                            format_thousands(pred.start_price, decimals),
                            format_thousands(pred.target_price, decimals),
                            format_thousands(pred.stop_price, decimals)
                        );
                        
                        message_en = format!(
                            "⚠️ *[TRADINGSAFE V2 - PREDICTION EXPIRED]*\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            🪙 *Coin*: {}\n\
                            📈 *Direction*: {}\n\
                            💵 *Entry Price*: ${}\n\
                            🎯 *Target Price*: ${}\n\
                            🛡️ *Safety Limit (Stop)*: ${}\n\
                            ❌ *Status*: TIMEOUT (Time Limit Reached)\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            💡 *V2 Model Standalone Test Engine*",
                            coin.replace("USDT", "/USDT"),
                            if pred.direction == "UP" { "🟢 UP (BULLISH)" } else { "🔴 DOWN (BEARISH)" },
                            format_thousands(pred.start_price, decimals),
                            format_thousands(pred.target_price, decimals),
                            format_thousands(pred.stop_price, decimals)
                        );
                        action_taken = true;
                    } else if pred.direction == "UP" {
                        if current_price >= pred.target_price {
                            // TARGET HIT!
                            let duration_mins = (now - pred.created_at).num_minutes();
                            message_id = format!(
                                "🎉 *[TRADINGSAFE V2 - TARGET TERCAPAI!]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Arah*: 🟢 NAIK\n\
                                💵 *Harga Masuk*: ${}\n\
                                🎯 *Target Tercapai*: ${}\n\
                                🔥 *Status*: SUCCESSFUL HIT!\n\
                                ⏱️ *Waktu Eksekusi*: {} Menit\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.target_price, decimals),
                                duration_mins
                            );
                            
                            message_en = format!(
                                "🎉 *[TRADINGSAFE V2 - TARGET ACHIEVED!]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Direction*: 🟢 UP\n\
                                💵 *Entry Price*: ${}\n\
                                🎯 *Target Reached*: ${}\n\
                                🔥 *Status*: SUCCESSFUL HIT!\n\
                                ⏱️ *Execution Time*: {} Minutes\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.target_price, decimals),
                                duration_mins
                            );
                            action_taken = true;
                        } else if current_price <= pred.stop_price {
                            // STOP HIT!
                            message_id = format!(
                                "⚠️ *[TRADINGSAFE V2 - PREDIKSI BATAL]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Arah*: 🟢 NAIK\n\
                                💵 *Harga Masuk*: ${}\n\
                                🛡️ *Harga Keluar (Stop)*: ${}\n\
                                ❌ *Status*: STOP LOSS HIT / RETRACE\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.stop_price, decimals)
                            );
                            
                            message_en = format!(
                                "⚠️ *[TRADINGSAFE V2 - PREDICTION CANCELLED]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Direction*: 🟢 UP\n\
                                💵 *Entry Price*: ${}\n\
                                🛡️ *Exit Price (Stop)*: ${}\n\
                                ❌ *Status*: STOP LOSS HIT / RETRACE\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.stop_price, decimals)
                            );
                            action_taken = true;
                        }
                    } else if pred.direction == "DOWN" {
                        if current_price <= pred.target_price {
                            // TARGET HIT!
                            let duration_mins = (now - pred.created_at).num_minutes();
                            message_id = format!(
                                "🎉 *[TRADINGSAFE V2 - TARGET TERCAPAI!]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Arah*: 🔴 TURUN\n\
                                💵 *Harga Masuk*: ${}\n\
                                🎯 *Target Tercapai*: ${}\n\
                                🔥 *Status*: SUCCESSFUL HIT!\n\
                                ⏱️ *Waktu Eksekusi*: {} Menit\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.target_price, decimals),
                                duration_mins
                            );
                            
                            message_en = format!(
                                "🎉 *[TRADINGSAFE V2 - TARGET ACHIEVED!]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Direction*: 🔴 DOWN\n\
                                💵 *Entry Price*: ${}\n\
                                🎯 *Target Reached*: ${}\n\
                                🔥 *Status*: SUCCESSFUL HIT!\n\
                                ⏱️ *Execution Time*: {} Minutes\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.target_price, decimals),
                                duration_mins
                            );
                            action_taken = true;
                        } else if current_price >= pred.stop_price {
                            // STOP HIT!
                            message_id = format!(
                                "⚠️ *[TRADINGSAFE V2 - PREDIKSI BATAL]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Arah*: 🔴 TURUN\n\
                                💵 *Harga Masuk*: ${}\n\
                                🛡️ *Harga Keluar (Stop)*: ${}\n\
                                ❌ *Status*: STOP LOSS HIT / REBOUND\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.stop_price, decimals)
                            );
                            
                            message_en = format!(
                                "⚠️ *[TRADINGSAFE V2 - PREDICTION CANCELLED]*\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                🪙 *Coin*: {}\n\
                                📈 *Direction*: 🔴 DOWN\n\
                                💵 *Entry Price*: ${}\n\
                                🛡️ *Exit Price (Stop)*: ${}\n\
                                ❌ *Status*: STOP LOSS HIT / REBOUND\n\
                                ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                                💡 *V2 Model Standalone Test Engine*",
                                coin.replace("USDT", "/USDT"),
                                format_thousands(pred.start_price, decimals),
                                format_thousands(pred.stop_price, decimals)
                            );
                            action_taken = true;
                        }
                    }

                    if action_taken {
                        println!("🔮 [V2 standalone] {} Event Triggered!", coin);
                        
                        let id_group_id = if pred.direction == "DOWN" {
                            "120363409651722299@g.us"
                        } else {
                            "120363427987942506@g.us"
                        };
                        let _ = notifications::whatsapp::send_to_group_with_reply(
                            &message_en, // Main group (Indo) now uses English
                            id_group_id,
                            pred.whatsapp_msg_id_en.as_deref()
                        ).await;

                        let target_tg_chat = if pred.direction == "DOWN" {
                            std::env::var("TELEGRAM_CHAT_ID_DOWN").unwrap_or_else(|_| "-5215838199".to_string())
                        } else {
                            std::env::var("TELEGRAM_CHAT_ID").unwrap_or_else(|_| "-1003973511282".to_string())
                        };

                        let _ = notifications::telegram::send_with_reply(
                            &message_id,
                            &target_tg_chat,
                            pred.telegram_message_id
                        ).await;

                        let duration_mins = (now - pred.created_at).num_minutes();
                        let event_name = if now >= pred.expires_at {
                            "TIMEOUT"
                        } else if current_price >= pred.target_price || (pred.direction == "DOWN" && current_price <= pred.target_price) {
                            "TARGET_HIT"
                        } else {
                            "STOP_LOSS_HIT"
                        };
                        log_prediction_event(
                            coin,
                            event_name,
                            &pred.direction,
                            pred.start_price,
                            pred.target_price,
                            pred.stop_price,
                            current_price,
                            Some(duration_mins)
                        );

                        active_predictions.remove(*coin);
                        cooldown_until.insert(coin.to_string(), now + chrono::Duration::minutes(15));
                    }
                } else {
                    // Cek Cooldown
                    if let Some(until) = cooldown_until.get(*coin) {
                        if now < *until {
                            continue;
                        }
                    }

                    // Menggunakan kriteria trend 15m (selalu aktif memprediksi)
                    let mut triggered = false;
                    let mut direction = String::new();
                    let mut target_price = 0.0;
                    let mut stop_price = 0.0;

                    if current_price >= ema {
                        direction = "UP".to_string();
                        target_price = current_price * 1.005; // +0.50% target (Scalping Cepat!)
                        stop_price = current_price * 0.997;    // -0.30% stop loss
                        triggered = true;
                    } else {
                        direction = "DOWN".to_string();
                        target_price = current_price * 0.995; // -0.50% target (Scalping Cepat!)
                        stop_price = current_price * 1.003;    // +0.30% stop loss
                        triggered = true;
                    }

                    if triggered {
                        let duration_hours = 1;
                        let expires_at = now + chrono::Duration::hours(duration_hours);
                        
                        let message_id = format!(
                            "🔮 *[TRADINGSAFE V2]*\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            🪙 *Coin*: {}\n\
                            📈 *Arah*: {}\n\
                            💵 *Harga Masuk*: ${}\n\
                            🎯 *Target Harga*: ${} (±0.50%)\n\
                            🛡️ *Batas Aman (Stop)*: ${} (±0.30%)\n\
                            ⏱️ *Batas Waktu*: {} Jam (Hingga {} WIB)\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            💡 *V2 Model Standalone Test Engine*",
                            coin.replace("USDT", "/USDT"),
                            if direction == "UP" { "🟢 NAIK (BULLISH CALL)" } else { "🔴 TURUN (BEARISH CALL)" },
                            format_thousands(current_price, decimals),
                            format_thousands(target_price, decimals),
                            format_thousands(stop_price, decimals),
                            duration_hours,
                            expires_at.format("%H:%M:%S").to_string()
                        );

                        let message_en = format!(
                            "🔮 *[TRADINGSAFE V2 - NEW PREDICTION]*\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            🪙 *Coin*: {}\n\
                            📈 *Direction*: {}\n\
                            💵 *Entry Price*: ${}\n\
                            🎯 *Target Price*: ${} (±0.50%)\n\
                            🛡️ *Safety Limit (Stop)*: ${} (±0.30%)\n\
                            ⏱️ *Time Limit*: {} Hour (Until {} WIB)\n\
                            ━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
                            💡 *V2 Model Standalone Test Engine*",
                            coin.replace("USDT", "/USDT"),
                            if direction == "UP" { "🟢 UP (BULLISH CALL)" } else { "🔴 DOWN (BEARISH CALL)" },
                            format_thousands(current_price, decimals),
                            format_thousands(target_price, decimals),
                            format_thousands(stop_price, decimals),
                            duration_hours,
                            expires_at.format("%H:%M:%S").to_string()
                        );

                        println!("🔮 [V2 standalone] New Prediction Triggered for {}!", coin);
                        
                        let id_group_id = if direction == "DOWN" {
                            "120363409651722299@g.us"
                        } else {
                            "120363427987942506@g.us"
                        };
                        let mut whatsapp_msg_id_en = None;
                        if let Ok(msg_id) = notifications::whatsapp::send_to_group_with_reply(&message_en, id_group_id, None).await {
                            whatsapp_msg_id_en = Some(msg_id);
                        }

                        let target_tg_chat = if direction == "DOWN" {
                            std::env::var("TELEGRAM_CHAT_ID_DOWN").unwrap_or_else(|_| "-5215838199".to_string())
                        } else {
                            std::env::var("TELEGRAM_CHAT_ID").unwrap_or_else(|_| "-1003973511282".to_string())
                        };

                        let mut telegram_message_id = None;
                        if let Ok(msg_id) = notifications::telegram::send_with_reply(&message_id, &target_tg_chat, None).await {
                            telegram_message_id = Some(msg_id);
                        }

                        log_prediction_event(
                            coin,
                            "NEW_PREDICTION",
                            &direction,
                            current_price,
                            target_price,
                            stop_price,
                            current_price,
                            None
                        );

                        let pred = PredictionState {
                            direction: direction.clone(),
                            start_price: current_price,
                            target_price,
                            stop_price,
                            created_at: now,
                            expires_at,
                            telegram_message_id,
                            whatsapp_msg_id_id: None,
                            whatsapp_msg_id_en,
                        };

                        active_predictions.insert(coin.to_string(), pred);
                    }
                }
            }
        }

        sleep(Duration::from_secs(60)).await;
    }
}

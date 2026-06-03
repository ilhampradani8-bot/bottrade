use std::error::Error;
use tokio::time::{sleep, Duration};
use sqlx::PgPool;
use std::collections::VecDeque;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message, tungstenite::client::IntoClientRequest};
use futures_util::{StreamExt, SinkExt};
use serde_json::Value;
use url::Url;
use crate::notifications;
use rand::Rng;

pub async fn run_bot_worker(pool: PgPool, bot_id: i32) -> Result<(), Box<dyn Error>> {
    // 1. Ambil detail bot dari database
    let bot_data = sqlx::query!(
        "SELECT name, pair, bot_type FROM strategies WHERE id = $1",
        bot_id
    )
    .fetch_one(&pool)
    .await?;

    let symbol = bot_data.pair.to_lowercase().replace("/", "");
    println!("🚀 [Bot #{}] Starting REAL-TIME engine for {}", bot_id, symbol);

    // 2. Setup Data Buffer
    let mut candle_buffer: VecDeque<f64> = VecDeque::with_capacity(200);

    // 3. Connect to Binance WebSocket (Aggregated Trade Stream for Real-time Price)
    let ws_url = format!("wss://stream.binance.com:9443/ws/{}@aggTrade", symbol);
    
    let (ws_stream, _) = connect_async(ws_url.into_client_request()?).await?;
    println!("✅ [Bot #{}] Connected to Binance WebSocket", bot_id);
    
    let (_, mut read) = ws_stream.split();

    // 4. Listen to Real Data
    while let Some(message) = read.next().await {
        match message {
            Ok(Message::Text(text)) => {
                let json: Value = serde_json::from_str(&text)?;
                if let Some(price_str) = json.get("p") {
                    let price: f64 = price_str.as_str().unwrap_or("0").parse()?;
                    
                    // Update Buffer
                    if candle_buffer.len() >= 200 {
                        candle_buffer.pop_front();
                    }
                    candle_buffer.push_back(price);

                    // TODO: Execute Strategy Logic here (Polars Analysis)
                    // Simulasi Keputusan (Hanya untuk menunjukkan format output)
                    if rand::random::<f64>() < 0.001 {
                         let alert_msg = notifications::format_alert_message(
                             &bot_data.bot_type,
                             &bot_data.pair,
                             "BUY",
                             price
                         );
                         println!("------------------------------------");
                         println!("{}", alert_msg);
                         println!("------------------------------------");
                         
                         // Kirim Notifikasi
                         let _ = notifications::send_alert(&alert_msg).await;
                    }

                    // Log harga real-time tetap berjalan
                    println!("⚡ [Bot #{}] {} REAL PRICE: {}", bot_id, bot_data.bot_type, price);
                }
            }
            Ok(Message::Close(_)) => {
                println!("⚠️ [Bot #{}] WebSocket closed by server", bot_id);
                break;
            }
            Err(e) => {
                eprintln!("❌ [Bot #{}] WebSocket Error: {}", bot_id, e);
                break;
            }
            _ => {}
        }
    }

    Ok(())
}

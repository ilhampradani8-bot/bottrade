use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::StreamExt;
use serde_json::Value;
use std::sync::{Arc, RwLock};
use std::collections::HashMap;

pub struct PriceListener {
    prices: Arc<RwLock<HashMap<String, f64>>>,
}

impl PriceListener {
    pub fn new(prices: Arc<RwLock<HashMap<String, f64>>>) -> Self {
        Self { prices }
    }

    /// Listen to Binance WebSocket for real-time trade prices with robust automatic reconnect and error safety
    pub async fn listen(&self, pairs: Vec<String>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if pairs.is_empty() {
            println!("⚠️ No pairs configured to stream. PriceListener idle.");
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
            }
        }

        // Clean & format pairs (e.g. "BTC/USDT" -> "btcusdt")
        let streams = pairs
            .iter()
            .map(|p| format!("{}@aggTrade", p.replace("/", "").to_lowercase()))
            .collect::<Vec<_>>()
            .join("/");
        
        let url = format!("wss://stream.binance.com:9443/stream?streams={}", streams);
        let mut retry_delay = tokio::time::Duration::from_secs(5);

        loop {
            println!("📡 [WebSocket] Connecting to: {}", url);
            match connect_async(&url).await {
                Ok((ws_stream, _)) => {
                    println!("⚡ [WebSocket] Connected! Streaming real-time market feeds.");
                    // Reset retry delay on successful connection
                    retry_delay = tokio::time::Duration::from_secs(5);
                    
                    let (_, mut read) = ws_stream.split();
                    
                    while let Some(message) = read.next().await {
                        match message {
                            Ok(Message::Text(text)) => {
                                if let Ok(json) = serde_json::from_str::<Value>(&text) {
                                    if let Some(data) = json.get("data") {
                                        if let (Some(sym), Some(price_str)) = (
                                            data.get("s").and_then(|v| v.as_str()),
                                            data.get("p").and_then(|v| v.as_str())
                                        ) {
                                            if let Ok(price) = price_str.parse::<f64>() {
                                                let mut prices_guard = self.prices.write().unwrap();
                                                prices_guard.insert(sym.to_uppercase(), price);
                                            }
                                        }
                                    }
                                }
                            }
                            Ok(Message::Close(_)) => {
                                println!("⚠️ [WebSocket] Connection closed by exchange server.");
                                break;
                            }
                            Err(e) => {
                                eprintln!("⚠️ [WebSocket] Stream read error: {}", e);
                                break;
                            }
                            _ => {}
                        }
                    }
                }
                Err(e) => {
                    eprintln!("❌ [WebSocket] Connection failed: {}. Retrying in {:?}...", e, retry_delay);
                }
            }

            // Perform sleep delay before next reconnection attempt
            tokio::time::sleep(retry_delay).await;

            // Exponential backoff up to 60 seconds maximum
            if retry_delay < tokio::time::Duration::from_secs(60) {
                retry_delay *= 2;
            }
        }
    }
}

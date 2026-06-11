use std::error::Error;
use tokio::time::{sleep, Duration};
use sqlx::PgPool;
use std::collections::VecDeque;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message, tungstenite::client::IntoClientRequest};
use futures_util::{StreamExt, SinkExt};
use serde_json::Value;

async fn get_usd_rate(target_currency: &str) -> f64 {
    if target_currency == "USD" || target_currency == "USDT" {
        return 1.0;
    }
    let url = "https://open.er-api.com/v6/latest/USD";
    match reqwest::get(url).await {
        Ok(resp) => {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                if let Some(rates) = json.get("rates") {
                    if let Some(rate) = rates.get(target_currency).and_then(|v| v.as_f64()) {
                        println!("💵 Fetched live USD/{} exchange rate: {}", target_currency, rate);
                        return rate;
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("⚠️ Failed to fetch live USD/{} rate: {}, using standard fallback", target_currency, e);
        }
    }
    // Fallbacks
    match target_currency {
        "IDR" => 16300.0,
        "EUR" => 0.92,
        "JPY" => 156.0,
        "GBP" => 0.78,
        "SGD" => 1.34,
        "MYR" => 4.7,
        "AUD" => 1.5,
        "CAD" => 1.37,
        "INR" => 83.5,
        "PHP" => 58.5,
        "THB" => 36.5,
        "VND" => 25400.0,
        _ => 1.0,
    }
}

async fn save_sim_state(
    pool: &PgPool,
    bid: i32,
    settings_val: &mut Value,
    bal: f64,
    pos: f64,
    entry: f64,
    safety_cnt: i64,
) {
    if let Some(obj) = settings_val.as_object_mut() {
        obj.insert("sim_balance".into(), serde_json::json!(bal));
        obj.insert("sim_position".into(), serde_json::json!(pos));
        obj.insert("sim_entry_price".into(), serde_json::json!(entry));
        obj.insert("sim_safety_count".into(), serde_json::json!(safety_cnt));
    }
    let settings_clone = settings_val.clone();
    let _ = sqlx::query!(
        "UPDATE simulations_by_simsettings SET settings = $1 WHERE id = $2",
        settings_clone,
        bid
    )
    .execute(pool)
    .await;
}

pub async fn run_sim_worker(pool: PgPool, bot_id: i32) -> Result<(), Box<dyn Error>> {
    // 1. Ambil detail bot dari database simulations_by_simsettings
    let bot_data = sqlx::query!(
        "SELECT user_id, name, pair, bot_type, settings FROM simulations_by_simsettings WHERE id = $1",
        bot_id
    )
    .fetch_one(&pool)
    .await?;

    let symbol = bot_data.pair.to_lowercase().replace("/", "");
    let bot_type = bot_data.bot_type.clone();
    let user_id = bot_data.user_id;

    println!("🚀 [Sim Bot #{}] Starting Simulation engine for {} ({})", bot_id, symbol, bot_type);

    let mut settings = bot_data.settings.clone();

    let currency = settings.get("currency")
        .and_then(|v| v.as_str())
        .unwrap_or("IDR")
        .to_string();

    let rate = get_usd_rate(&currency).await;

    let currency_label = match currency.as_str() {
        "IDR" => "Rp",
        "USD" => "$",
        "USDT" => "USDT",
        "EUR" => "€",
        "GBP" => "£",
        "JPY" => "¥",
        "SGD" => "S$",
        "MYR" => "RM",
        "AUD" => "A$",
        "CAD" => "C$",
        "INR" => "₹",
        "PHP" => "₱",
        "THB" => "฿",
        "VND" => "₫",
        _ => &currency,
    };

    let nominal = settings.get("nominal")
        .and_then(|v| v.as_str())
        .and_then(|s| s.replace(",", "").parse::<f64>().ok())
        .unwrap_or(1000000.0);

    let safety_nominal = settings.get("safety_nominal")
        .and_then(|v| v.as_str())
        .and_then(|s| s.replace(",", "").parse::<f64>().ok())
        .unwrap_or(500000.0);

    let take_profit_pct = settings.get("take_profit")
        .and_then(|v| v.as_str().or_else(|| v.as_f64().map(|_| "1.5")))
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(1.5) / 100.0;

    let stop_loss_pct = settings.get("stop_loss")
        .and_then(|v| v.as_str().or_else(|| v.as_f64().map(|_| "5.0")))
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(5.0) / 100.0;

    let mut sim_balance = settings.get("sim_balance")
        .and_then(|v| v.as_f64())
        .unwrap_or(if currency == "IDR" { 10000000.0 } else { 1000.0 });

    let mut sim_position = settings.get("sim_position")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let mut sim_entry_price = settings.get("sim_entry_price")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let mut sim_safety_count = settings.get("sim_safety_count")
        .and_then(|v| v.as_i64())
        .unwrap_or(0);

    let mut candle_buffer: VecDeque<f64> = VecDeque::with_capacity(200);

    // Binance WebSocket (USDT pairs)
    let ws_url = format!("wss://stream.binance.com:9443/ws/{}@aggTrade", symbol);
    let (ws_stream, _) = connect_async(ws_url.into_client_request()?).await?;
    println!("✅ [Sim Bot #{}] Connected to Binance WebSocket", bot_id);
    
    let (_, mut read) = ws_stream.split();

    while let Some(message) = read.next().await {
        let current_status = sqlx::query!(
            "SELECT status FROM simulations_by_simsettings WHERE id = $1",
            bot_id
        )
        .fetch_one(&pool)
        .await;

        if let Ok(row) = current_status {
            if row.status.as_deref() != Some("active") {
                println!("🛑 [Sim Bot #{}] Status is no longer active (current: {:?}). Exiting worker.", bot_id, row.status);
                break;
            }
        }

        match message {
            Ok(Message::Text(text)) => {
                let json: Value = serde_json::from_str(&text)?;
                if let Some(price_str) = json.get("p") {
                    let price_raw: f64 = price_str.as_str().unwrap_or("0").parse()?;
                    let price = price_raw * rate;
                    
                    if candle_buffer.len() >= 200 {
                        candle_buffer.pop_front();
                    }
                    candle_buffer.push_back(price);

                    if sim_position == 0.0 {
                        if sim_balance >= nominal {
                            let buy_units = nominal / price;
                            sim_balance -= nominal;
                            sim_position = buy_units;
                            sim_entry_price = price;
                            sim_safety_count = 0;

                            println!("📥 [Sim Bot #{}] Realtime BUY (Base Order) filled: {} units at {} {}", bot_id, buy_units, currency_label, price);

                            save_sim_state(&pool, bot_id, &mut settings, sim_balance, sim_position, sim_entry_price, sim_safety_count).await;

                            let _ = sqlx::query!(
                                "INSERT INTO simulation_trades_by_jurnal (user_id, pair, strategy_type, side, price, amount, currency) 
                                 VALUES ($1, $2, $3, $4, $5, $6, $7)",
                                user_id,
                                bot_data.pair,
                                bot_type,
                                "BUY",
                                price as f64,
                                buy_units as f64,
                                currency
                            )
                            .execute(&pool)
                            .await;
                        }
                    } else {
                        let pnl_pct = (price - sim_entry_price) / sim_entry_price;

                        if pnl_pct >= take_profit_pct {
                            let proceeds = sim_position * price;
                            let pnl_val = proceeds - (sim_position * sim_entry_price);
                            sim_balance += proceeds;
                            
                            println!("🟢 [Sim Bot #{}] TAKE PROFIT hit at price {} {}. Profit: +{}%", bot_id, currency_label, price, (pnl_pct * 100.0).round());

                            let _ = sqlx::query!(
                                "INSERT INTO simulation_trades_by_jurnal (user_id, pair, strategy_type, side, price, amount, pnl, currency) 
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                                user_id,
                                bot_data.pair,
                                bot_type,
                                "SELL",
                                price as f64,
                                sim_position as f64,
                                pnl_val as f64,
                                currency
                            )
                            .execute(&pool)
                            .await;

                            sim_position = 0.0;
                            sim_entry_price = 0.0;
                            sim_safety_count = 0;

                            save_sim_state(&pool, bot_id, &mut settings, sim_balance, sim_position, sim_entry_price, sim_safety_count).await;
                        } 
                        else if pnl_pct <= -stop_loss_pct {
                            let proceeds = sim_position * price;
                            let pnl_val = proceeds - (sim_position * sim_entry_price);
                            sim_balance += proceeds;

                            println!("🔴 [Sim Bot #{}] STOP LOSS hit at price {} {}. Loss: {}%", bot_id, currency_label, price, (pnl_pct * 100.0).round());

                            let _ = sqlx::query!(
                                "INSERT INTO simulation_trades_by_jurnal (user_id, pair, strategy_type, side, price, amount, pnl, currency) 
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                                user_id,
                                bot_data.pair,
                                bot_type,
                                "SELL",
                                price as f64,
                                sim_position as f64,
                                pnl_val as f64,
                                currency
                            )
                            .execute(&pool)
                            .await;

                            sim_position = 0.0;
                            sim_entry_price = 0.0;
                            sim_safety_count = 0;

                            save_sim_state(&pool, bot_id, &mut settings, sim_balance, sim_position, sim_entry_price, sim_safety_count).await;
                        }
                        else if pnl_pct <= -0.02 * (sim_safety_count + 1) as f64 && sim_balance >= safety_nominal && sim_safety_count < 5 {
                            let buy_units = safety_nominal / price;
                            sim_balance -= safety_nominal;
                            
                            let new_total_units = sim_position + buy_units;
                            let new_entry_price = ((sim_entry_price * sim_position) + (price * buy_units)) / new_total_units;
                            
                            sim_position = new_total_units;
                            sim_entry_price = new_entry_price;
                            sim_safety_count += 1;

                            println!("📥 [Sim Bot #{}] SAFETY ORDER #{} filled at price {} {}", bot_id, sim_safety_count, currency_label, price);

                            save_sim_state(&pool, bot_id, &mut settings, sim_balance, sim_position, sim_entry_price, sim_safety_count).await;

                            let _ = sqlx::query!(
                                "INSERT INTO simulation_trades_by_jurnal (user_id, pair, strategy_type, side, price, amount, currency) 
                                 VALUES ($1, $2, $3, $4, $5, $6, $7)",
                                user_id,
                                bot_data.pair,
                                bot_type,
                                "BUY",
                                price as f64,
                                buy_units as f64,
                                currency
                            )
                            .execute(&pool)
                            .await;
                        }
                    }

                    println!("⚡ [Sim Bot #{}] {} PRICE: {} {}, BAL: {} {}, POS: {}", bot_id, bot_type, currency_label, price.round(), currency_label, sim_balance.round(), sim_position);
                }
            }
            Ok(Message::Close(_)) => {
                println!("⚠️ [Sim Bot #{}] WebSocket closed by Binance server", bot_id);
                break;
            }
            Err(e) => {
                eprintln!("❌ [Sim Bot #{}] WebSocket Error: {}", bot_id, e);
                break;
            }
            _ => {}
        }
    }

    Ok(())
}

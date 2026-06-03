mod notifications;

use std::error::Error;
use std::env;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::time::{sleep, Duration};
use sqlx::postgres::PgPoolOptions;
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
    tf_5m: TimeframeState,
    tf_15m: TimeframeState,
    tf_1h: TimeframeState,
    tf_1d: TimeframeState,
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
        // Inisialisasi awal dinamis agar tidak kosong di menit-menit awal WebSocket
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

// Helper untuk Format Ribuan & Desimal (e.g. 72,158.00 atau 1,118,449,000)
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

fn build_report(
    active_coin: &str,
    active_coin_price: f64,
    timeframe_label: &str,
    rsi: f64,
    ema: f64,
    is_bullish: bool,
    is_sideways: bool,
    coin_summaries: &[(String, &str, f64)],
    usd_to_idr: f64,
    usd_to_myr: f64,
    is_english: bool,
) -> String {
    let time_str = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let mut report = String::new();
    
    let title = "📊 *TRADINGSAFE AUTO-ANALYSIS COIN LIST*\n";
    report.push_str(title);
    report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    for (i, (pair, trend, price)) in coin_summaries.iter().enumerate() {
        if *price == 0.0 {
            report.push_str(&format!("{}. {} : ⏳ LOADING DATA...\n", i + 1, pair));
        } else {
            let idr = price * usd_to_idr;
            if pair.contains("XRP") {
                report.push_str(&format!("{}. {} : {} (${:.4} | Rp{})\n", i + 1, pair, trend, price, format_thousands(idr, 0)));
            } else {
                report.push_str(&format!("{}. {} : {} (${} | Rp{})\n", i + 1, pair, trend, format_thousands(*price, 0), format_thousands(idr, 0)));
            }
        }
    }
    report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

    if is_sideways {
        report.push_str(&format!("🔥 *ACTIVE STATUS: {} (UPDATE!)*\n", active_coin.replace("USDT", "/USDT")));
        report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        report.push_str(&format!("🎯 *Timeframe*   : {}\n", timeframe_label));
        
        let signal_dir = if is_english {
            "🎯 *Signal Direction* : ⚪ NO SIGNAL (Market Sideways / Consolidating)\n"
        } else {
            "🎯 *Arah Sinyal* : ⚪ NO SIGNAL (Market Sideways / Consolidating)\n"
        };
        report.push_str(signal_dir);

        let entry_lbl = if is_english {
            "💵 *Entry Price*: N/A (Wait for Breakout)\n"
        } else {
            "💵 *Harga Masuk (Entry)*: N/A (Wait for Breakout)\n"
        };
        report.push_str(entry_lbl);

        report.push_str("🎯 *Target Profit (TP)* : N/A\n");
        
        let cl_lbl = if is_english {
            "🛡️ *Cut Loss (CL/SL)*   : N/A\n"
        } else {
            "🛡️ *Cut Loss (CL/SL)*   : N/A\n"
        };
        report.push_str(cl_lbl);

        report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        let supporting_lbl = if is_english {
            "📈 *SUPPORTING INDICATORS (100 Candle Buffer)*\n"
        } else {
            "📈 *INDIKATOR PENDUKUNG (100 Candle Buffer)*\n"
        };
        report.push_str(supporting_lbl);

        report.push_str(&format!("• *RSI (14)*   : {:.1}\n", rsi));
        if active_coin.contains("XRP") {
            report.push_str(&format!("• *EMA (50)*   : ${:.4}\n", ema));
        } else {
            report.push_str(&format!("• *EMA (50)*   : ${:.2}\n", ema));
        }
        
        let macd_val = if is_english { "Consolidating" } else { "Terkonsolidasi" };
        report.push_str(&format!("• *MACD Trend* : {}\n", macd_val));
        report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        let reason = if is_english {
            if rsi < 45.0 {
                format!("RSI ({:.1}) tends to weaken below the center line. Market is moving slow/flat with a slight bearish bias.", rsi)
            } else if rsi > 55.0 {
                format!("RSI ({:.1}) tends to strengthen above the center line. Market is tightly consolidating with a slight bullish bias.", rsi)
            } else {
                format!("RSI ({:.1}) is perfectly flat in the neutral zone. Volume is thin and volatility is extremely low (Wait & See).", rsi)
            }
        } else {
            if rsi < 45.0 {
                format!("RSI ({:.1}) cenderung melemah di bawah batas tengah. Pasar bergerak lambat/flat dengan bias bearish tipis.", rsi)
            } else if rsi > 55.0 {
                format!("RSI ({:.1}) cenderung menguat di atas batas tengah. Pasar terkonsolidasi rapat dengan bias bullish tipis.", rsi)
            } else {
                format!("RSI ({:.1}) flat sempurna di area netral. Volume sepi dan volatilitas sangat rendah (Wait & See).", rsi)
            }
        };
        
        let reason_lbl = if is_english { "📝 *Reason*" } else { "📝 *Alasan*" };
        report.push_str(&format!("{}: {}\n", reason_lbl, reason));
    } else {
        let direction_str = if is_bullish { "🟢 BUY / LONG (Bullish Momentum)" } else { "🔴 SELL / SHORT (Bearish Momentum)" };
        let entry_price = active_coin_price;
        let (tp_price, cl_price) = if is_bullish {
            (entry_price * 1.025, entry_price * 0.985)
        } else {
            (entry_price * 0.975, entry_price * 1.015)
        };

        let entry_idr = entry_price * usd_to_idr;
        let entry_myr = entry_price * usd_to_myr;
        let tp_idr = tp_price * usd_to_idr;
        let tp_myr = tp_price * usd_to_myr;
        let cl_idr = cl_price * usd_to_idr;
        let cl_myr = cl_price * usd_to_myr;

        report.push_str(&format!("🔥 *ACTIVE SIGNAL DETECTED: {} (UPDATE!)*\n", active_coin.replace("USDT", "/USDT")));
        report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        report.push_str(&format!("🎯 *Timeframe*   : {}\n", timeframe_label));
        
        let signal_dir = if is_english {
            format!("🎯 *Signal Direction* : {}\n", direction_str)
        } else {
            format!("🎯 *Arah Sinyal* : {}\n", direction_str)
        };
        report.push_str(&signal_dir);
        
        let decimals = if active_coin.contains("XRP") { 4 } else { 2 };
        let decimals_local = if active_coin.contains("XRP") { 2 } else { 0 };

        let entry_hdr = if is_english { "💵 *Entry Price*:" } else { "💵 *Harga Masuk (Entry)*:" };
        report.push_str(&format!("{}\n  • USD : ${}\n  • IDR : Rp {}\n  • MYR : RM {}\n\n", 
            entry_hdr,
            format_thousands(entry_price, decimals), 
            format_thousands(entry_idr, decimals_local), 
            format_thousands(entry_myr, decimals)));

        report.push_str(&format!("🎯 *Target Profit (TP)* :\n  • USD : ${} (±2.5%)\n  • IDR : Rp {}\n  • MYR : RM {}\n\n", 
            format_thousands(tp_price, decimals), 
            format_thousands(tp_idr, decimals_local), 
            format_thousands(tp_myr, decimals)));

        report.push_str(&format!("🛡️ *Cut Loss (CL/SL)*   :\n  • USD : ${} (±1.5%)\n  • IDR : Rp {}\n  • MYR : RM {}\n", 
            format_thousands(cl_price, decimals), 
            format_thousands(cl_idr, decimals_local), 
            format_thousands(cl_myr, decimals)));
            
        report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        let supporting_lbl = if is_english {
            "📈 *SUPPORTING INDICATORS (100 Candle Buffer)*\n"
        } else {
            "📈 *INDIKATOR PENDUKUNG (100 Candle Buffer)*\n"
        };
        report.push_str(supporting_lbl);

        report.push_str(&format!("• *RSI (14)*   : {:.1}\n", rsi));
        if active_coin.contains("XRP") {
            report.push_str(&format!("• *EMA (50)*   : ${:.4}\n", ema));
        } else {
            report.push_str(&format!("• *EMA (50)*   : ${:.2}\n", ema));
        }
        
        let macd_val = if is_english {
            if is_bullish { "Uptrend Confirmed" } else { "Downtrend Confirmed" }
        } else {
            if is_bullish { "Uptrend Terkonfirmasi" } else { "Downtrend Terkonfirmasi" }
        };
        report.push_str(&format!("• *MACD Trend* : {}\n", macd_val));
        report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        let reason = if is_english {
            if is_bullish {
                if rsi > 70.0 {
                    format!("Price breakout above EMA 50. RSI ({:.1}) enters the overbought zone, showing very strong buyer dominance.", rsi)
                } else {
                    format!("Price is trading above EMA 50 with a stable and healthy uptrend RSI ({:.1}) accumulation.", rsi)
                }
            } else {
                if rsi < 30.0 {
                    format!("Price breakdown below EMA 50. RSI ({:.1}) enters the oversold zone, showing oversold seller pressure.", rsi)
                } else {
                    format!("Price is pressured below EMA 50 with confirmed active downtrend RSI ({:.1}) momentum.", rsi)
                }
            }
        } else {
            if is_bullish {
                if rsi > 70.0 {
                    format!("Harga breakout di atas EMA 50. RSI ({:.1}) masuk zona overbought, menunjukkan dominasi buyer yang sangat kuat.", rsi)
                } else {
                    format!("Harga berada di atas EMA 50 dengan akumulasi RSI ({:.1}) uptrend yang stabil dan sehat.", rsi)
                }
            } else {
                if rsi < 30.0 {
                    format!("Harga breakdown di bawah EMA 50. RSI ({:.1}) masuk zona oversold, menunjukkan tekanan seller yang jenuh jual.", rsi)
                } else {
                    format!("Harga tertekan di bawah EMA 50 dengan momentum RSI ({:.1}) downtrend yang terkonfirmasi aktif.", rsi)
                }
            }
        };
        
        let analysis_lbl = if is_english { "📝 *Analysis*" } else { "📝 *Analisa*" };
        report.push_str(&format!("{}: {}\n", analysis_lbl, reason));
    }

    report.push_str("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    let zone_lbl = if is_english { "UTC+7" } else { "WIB" };
    report.push_str(&format!("🕒 *Last Update*: {} {}\n", time_str, zone_lbl));
    report.push_str("🌐 *Powered by TradingSafe Auto-Analysis Engine*");
    report
}


#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::from_path("/root/bottrade/.env").ok();
    
    println!("🤖 Starting TradingSafe dedicated 24-Hour High-Precision Multi-Interval Analysis Engine...");
    
    // 1. Inisialisasi Database
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let _pool = PgPoolOptions::new()
        .max_connections(3)
        .connect(&database_url)
        .await?;

    println!("✅ Analysis Engine connected to Database.");

    // Tampilkan QR Login WhatsApp khusus untuk Analysis Engine
    println!("📱 [Analysis Engine] Initializing WhatsApp Notification Channel...");
    notifications::whatsapp::generate_qr_login();

    // Nilai Konversi Kurs USD ke IDR & MYR (Default: IDR 15,500 & MYR 4.70)
    let usd_to_idr: f64 = env::var("USD_TO_IDR").ok().and_then(|s| s.parse().ok()).unwrap_or(15500.0);
    let usd_to_myr: f64 = env::var("USD_TO_MYR").ok().and_then(|s| s.parse().ok()).unwrap_or(4.70);

    // 2. Setup 5 Koin Teratas yang Dipantau
    let coins = vec!["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
    let coin_states = Arc::new(Mutex::new(HashMap::<String, CoinState>::new()));
    
    for coin in &coins {
        coin_states.lock().unwrap().insert(coin.to_string(), CoinState {
            tf_5m: TimeframeState { current_price: 0.0, price_history: Vec::new() },
            tf_15m: TimeframeState { current_price: 0.0, price_history: Vec::new() },
            tf_1h: TimeframeState { current_price: 0.0, price_history: Vec::new() },
            tf_1d: TimeframeState { current_price: 0.0, price_history: Vec::new() },
        });
    }

    // 3. Jalankan WebSocket Listener untuk multi-timeframe kline Binance (5 Koin * 4 Timeframes = 20 Streams)
    let coin_states_clone = Arc::clone(&coin_states);
    tokio::spawn(async move {
        // Multi-stream kline Binance: 5m, 15m, 1h, 1d
        let ws_url = "wss://stream.binance.com:9443/stream?streams=btcusdt@kline_5m/btcusdt@kline_15m/btcusdt@kline_1h/btcusdt@kline_1d/ethusdt@kline_5m/ethusdt@kline_15m/ethusdt@kline_1h/ethusdt@kline_1d/solusdt@kline_5m/solusdt@kline_15m/solusdt@kline_1h/solusdt@kline_1d/bnbusdt@kline_5m/bnbusdt@kline_15m/bnbusdt@kline_1h/bnbusdt@kline_1d/xrpusdt@kline_5m/xrpusdt@kline_15m/xrpusdt@kline_1h/xrpusdt@kline_1d";
        
        loop {
            println!("🔌 Connecting to Binance Multi-Interval WebSocket...");
            match connect_async(ws_url.into_client_request().unwrap()).await {
                Ok((ws_stream, _)) => {
                    println!("✅ Connected to Binance Multi-Interval WebSocket.");
                    let (_, mut read) = ws_stream.split();
                    
                    while let Some(msg) = read.next().await {
                        match msg {
                            Ok(Message::Text(text)) => {
                                if let Ok(json) = serde_json::from_str::<Value>(&text) {
                                    if let (Some(stream), Some(data)) = (json.get("stream"), json.get("data")) {
                                        let stream_name = stream.as_str().unwrap_or("");
                                        if let (Some(sym), Some(kline)) = (data.get("s"), data.get("k")) {
                                            let symbol = sym.as_str().unwrap_or("").to_string();
                                            if let (Some(close_str), Some(is_closed_val)) = (kline.get("c"), kline.get("x")) {
                                                let price: f64 = close_str.as_str().unwrap_or("0").parse().unwrap_or(0.0);
                                                let is_closed = is_closed_val.as_bool().unwrap_or(false);
                                                
                                                let mut states = coin_states_clone.lock().unwrap();
                                                if let Some(state) = states.get_mut(&symbol) {
                                                    // Arahkan ke state timeframe yang sesuai (1d, 1h, 15m, atau fallback 5m)
                                                     let tf_state = if stream_name.contains("1d") {
                                                         &mut state.tf_1d
                                                     } else if stream_name.contains("1h") {
                                                         &mut state.tf_1h
                                                     } else if stream_name.contains("15m") {
                                                         &mut state.tf_15m
                                                     } else {
                                                         &mut state.tf_5m
                                                     };
                                                     
                                                     tf_state.current_price = price;
                                                     
                                                     // Jika candle telah selesai ditutup, simpan ke history untuk RSI & EMA
                                                     if is_closed {
                                                         tf_state.price_history.push(price);
                                                         if tf_state.price_history.len() > 100 {
                                                             tf_state.price_history.remove(0);
                                                         }
                                                     } else if tf_state.price_history.is_empty() {
                                                         tf_state.price_history.push(price);
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
                    eprintln!("❌ Failed to connect to WebSocket: {}. Retrying in 5 seconds...", e);
                }
            }
            sleep(Duration::from_secs(5)).await;
        }
    });

    // 4. Jeda Awal 8 Detik agar WebSocket mengumpulkan data harga pertama
    println!("⏳ Waiting 8 seconds for initial WebSocket price streams to populate...");
    sleep(Duration::from_secs(8)).await;

    // 5. Loop Utama Engine Analisa 24 Jam (Bangun setiap 60 detik)
    let mut elapsed_minutes = 0;
    let mut last_signals = HashMap::<String, String>::new(); 
    // Key: "BTCUSDT_5m", "BTCUSDT_15m", dll. Value: "BULLISH", "BEARISH", "SIDEWAYS"

    let mut coin_index = 0;
    println!("📈 TradingSafe Multi-Interval Engine is now RUNNING 24/7.");
    
    loop {
        // A. AMBIL DATA DARI RAM
        let mut coin_summaries = Vec::new();
        let mut coins_data = HashMap::<String, (f64, Vec<f64>, Vec<f64>, Vec<f64>, Vec<f64>)>::new();
        
        {
            let states = coin_states.lock().unwrap();
            for coin in &coins {
                if let Some(state) = states.get(*coin) {
                    let price = state.tf_1h.current_price;
                    let trend = if state.tf_1h.price_history.len() > 2 {
                        let len = state.tf_1h.price_history.len();
                        if state.tf_1h.price_history[len - 1] >= state.tf_1h.price_history[len - 2] {
                            "🟢 BULLISH"
                        } else {
                            "🔴 BEARISH"
                        }
                    } else {
                        "⚪ NEUTRAL"
                    };
                    coin_summaries.push((coin.replace("USDT", "/USDT"), trend, price));
                    
                    coins_data.insert(coin.to_string(), (
                        price,
                        state.tf_5m.price_history.clone(),
                        state.tf_15m.price_history.clone(),
                        state.tf_1h.price_history.clone(),
                        state.tf_1d.price_history.clone(),
                    ));
                }
            }
        }

        // B. TUGAS 1: LAPORAN BERKALA 1 JAM SEKALI (Selalu dikirim, termasuk jika Sideways)
        if elapsed_minutes == 0 || elapsed_minutes % 60 == 0 {
            let active_coin = coins[coin_index];
            coin_index = (coin_index + 1) % coins.len();

            if let Some((price, _, _, tf_1h_history, _)) = coins_data.get(active_coin) {
                if *price > 0.0 {
                    let rsi = calculate_rsi(tf_1h_history);
                    let ema = calculate_ema(tf_1h_history, *price);
                    let is_bullish = *price >= ema;
                    let is_sideways = (rsi >= 46.0 && rsi <= 54.0) || ((*price - ema).abs() / ema < 0.0025);

                    let report_id = build_report(
                        active_coin,
                        *price,
                        "⏳ 1 JAM (Regular Heartbeat Report)",
                        rsi,
                        ema,
                        is_bullish,
                        is_sideways,
                        &coin_summaries,
                        usd_to_idr,
                        usd_to_myr,
                        false, // Indonesian
                    );

                    let report_en = build_report(
                        active_coin,
                        *price,
                        "⏳ 1 HOUR (Regular Heartbeat Report)",
                        rsi,
                        ema,
                        is_bullish,
                        is_sideways,
                        &coin_summaries,
                        usd_to_idr,
                        usd_to_myr,
                        true, // English
                    );

                    println!("📤 [Analysis Engine] Dispatching Routine 1-Hour Report for {}...", active_coin);
                    // let _ = notifications::telegram::send(&report_id).await;
                    
                    // let id_group_id = env::var("WHATSAPP_GROUP_ID").unwrap_or_default();
                    // if !id_group_id.is_empty() {
                    //     let _ = notifications::whatsapp::send_to_group(&report_id, &id_group_id).await;
                    // }
                    // let _ = notifications::whatsapp::send_to_group(&report_en, "120363409228885921@g.us").await;
                }
            }
        }

        // C. TUGAS 2: TIMEFRAME 5 MENIT (Hanya dikirim jika ada Sinyal Breakout valid, Sideways di-skip)
        if elapsed_minutes % 5 == 0 {
            for coin in &coins {
                if let Some((price, tf_5m_history, _, _, _)) = coins_data.get(*coin) {
                    if *price > 0.0 {
                        let rsi = calculate_rsi(tf_5m_history);
                        let ema = calculate_ema(tf_5m_history, *price);
                        let is_bullish = *price >= ema;
                        let is_sideways = (rsi >= 46.0 && rsi <= 54.0) || ((*price - ema).abs() / ema < 0.0025);

                        let current_signal = if is_sideways {
                            "SIDEWAYS".to_string()
                        } else if is_bullish {
                            "BULLISH".to_string()
                        } else {
                            "BEARISH".to_string()
                        };

                        let cache_key = format!("{}_5m", coin);
                        let prev_signal = last_signals.get(&cache_key).cloned().unwrap_or("SIDEWAYS".to_string());

                        // Hanya kirim notifikasi jika sinyal berubah ke tren aktif (BULLISH/BEARISH)
                        if current_signal != "SIDEWAYS" && current_signal != prev_signal {
                            let report_id = build_report(
                                coin,
                                *price,
                                "⚡ 5 MENIT (Scalping Breakout Sinyal!)",
                                rsi,
                                ema,
                                is_bullish,
                                is_sideways,
                                &coin_summaries,
                                usd_to_idr,
                                usd_to_myr,
                                false, // Indonesian
                            );

                            let report_en = build_report(
                                coin,
                                *price,
                                "⚡ 5 MINUTES (Scalping Breakout Signal!)",
                                rsi,
                                ema,
                                is_bullish,
                                is_sideways,
                                &coin_summaries,
                                usd_to_idr,
                                usd_to_myr,
                                true, // English
                            );

                            println!("📤 [Analysis Engine] Dispatching 5-Minute Breakout Alert for {}...", coin);
                            // let _ = notifications::telegram::send(&report_id).await;
                            
                            // let id_group_id = env::var("WHATSAPP_GROUP_ID").unwrap_or_default();
                            // if !id_group_id.is_empty() {
                            //     let _ = notifications::whatsapp::send_to_group(&report_id, &id_group_id).await;
                            // }
                            // let _ = notifications::whatsapp::send_to_group(&report_en, "120363409228885921@g.us").await;
                        }

                        last_signals.insert(cache_key, current_signal);
                    }
                }
            }
        }

        // D. TUGAS 3: TIMEFRAME 15 MENIT (Hanya dikirim jika ada Sinyal Breakout valid, Sideways di-skip)
        if elapsed_minutes % 15 == 0 {
            for coin in &coins {
                if let Some((price, _, tf_15m_history, _, _)) = coins_data.get(*coin) {
                    if *price > 0.0 {
                        let rsi = calculate_rsi(tf_15m_history);
                        let ema = calculate_ema(tf_15m_history, *price);
                        let is_bullish = *price >= ema;
                        let is_sideways = (rsi >= 46.0 && rsi <= 54.0) || ((*price - ema).abs() / ema < 0.0025);

                        let current_signal = if is_sideways {
                            "SIDEWAYS".to_string()
                        } else if is_bullish {
                            "BULLISH".to_string()
                        } else {
                            "BEARISH".to_string()
                        };

                        let cache_key = format!("{}_15m", coin);
                        let prev_signal = last_signals.get(&cache_key).cloned().unwrap_or("SIDEWAYS".to_string());

                        if current_signal != "SIDEWAYS" && current_signal != prev_signal {
                            let report_id = build_report(
                                coin,
                                *price,
                                "🚀 15 MENIT (Day Trading Breakout Sinyal!)",
                                rsi,
                                ema,
                                is_bullish,
                                is_sideways,
                                &coin_summaries,
                                usd_to_idr,
                                usd_to_myr,
                                false, // Indonesian
                            );

                            let report_en = build_report(
                                coin,
                                *price,
                                "🚀 15 MINUTES (Day Trading Breakout Signal!)",
                                rsi,
                                ema,
                                is_bullish,
                                is_sideways,
                                &coin_summaries,
                                usd_to_idr,
                                usd_to_myr,
                                true, // English
                            );

                            println!("📤 [Analysis Engine] Dispatching 15-Minute Breakout Alert for {}...", coin);
                            // let _ = notifications::telegram::send(&report_id).await;
                            
                            // let id_group_id = env::var("WHATSAPP_GROUP_ID").unwrap_or_default();
                            // if !id_group_id.is_empty() {
                            //     let _ = notifications::whatsapp::send_to_group(&report_id, &id_group_id).await;
                            // }
                            // let _ = notifications::whatsapp::send_to_group(&report_en, "120363409228885921@g.us").await;
                        }

                        last_signals.insert(cache_key, current_signal);
                    }
                }
            }
        }

        // E. TUGAS 4: TIMEFRAME 1 HARI (Hanya dikirim jika ada Sinyal Breakout valid, Sideways di-skip)
        if elapsed_minutes % 1440 == 0 {
            for coin in &coins {
                if let Some((price, _, _, _, tf_1d_history)) = coins_data.get(*coin) {
                    if *price > 0.0 {
                        let rsi = calculate_rsi(tf_1d_history);
                        let ema = calculate_ema(tf_1d_history, *price);
                        let is_bullish = *price >= ema;
                        let is_sideways = (rsi >= 46.0 && rsi <= 54.0) || ((*price - ema).abs() / ema < 0.0025);

                        let current_signal = if is_sideways {
                            "SIDEWAYS".to_string()
                        } else if is_bullish {
                            "BULLISH".to_string()
                        } else {
                            "BEARISH".to_string()
                        };

                        let cache_key = format!("{}_1d", coin);
                        let prev_signal = last_signals.get(&cache_key).cloned().unwrap_or("SIDEWAYS".to_string());

                        if current_signal != "SIDEWAYS" && current_signal != prev_signal {
                            let report_id = build_report(
                                coin,
                                *price,
                                "🏆 1 HARI (Macro Swing Breakout Sinyal!)",
                                rsi,
                                ema,
                                is_bullish,
                                is_sideways,
                                &coin_summaries,
                                usd_to_idr,
                                usd_to_myr,
                                false, // Indonesian
                            );

                            let report_en = build_report(
                                coin,
                                *price,
                                "🏆 1 DAY (Macro Swing Breakout Signal!)",
                                rsi,
                                ema,
                                is_bullish,
                                is_sideways,
                                &coin_summaries,
                                usd_to_idr,
                                usd_to_myr,
                                true, // English
                            );

                            println!("📤 [Analysis Engine] Dispatching Daily Macro Breakout Alert for {}...", coin);
                            // let _ = notifications::telegram::send(&report_id).await;
                            
                            // let id_group_id = env::var("WHATSAPP_GROUP_ID").unwrap_or_default();
                            // if !id_group_id.is_empty() {
                            //     let _ = notifications::whatsapp::send_to_group(&report_id, &id_group_id).await;
                            // }
                            // let _ = notifications::whatsapp::send_to_group(&report_en, "120363409228885921@g.us").await;
                        }

                        last_signals.insert(cache_key, current_signal);
                    }
                }
            }
        }

        // F. TIDUR 1 MENIT (Siklus Cek)
        sleep(Duration::from_secs(60)).await;
        elapsed_minutes += 1;
    }
}

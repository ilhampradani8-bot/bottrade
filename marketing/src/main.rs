mod notifications;
mod marketing;

use std::error::Error;
use std::env;
use std::fs::File;
use std::io::{BufRead, BufReader};
use chrono::Local;

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
struct PredictionEvent {
    timestamp: String,
    coin: String,
    event: String,
    direction: String,
    entry_price: f64,
    target_price: f64,
    stop_price: f64,
    current_price: f64,
    duration_minutes: Option<i64>,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
struct MarketingState {
    last_processed_timestamp: String,
    last_daily_broadcast_date: String,
    next_scheduled_broadcast_time: String,
    #[serde(default)]
    recent_topics: Vec<String>,
}

fn load_state() -> MarketingState {
    let path = "/root/bottrade/logs/marketing_state.json";
    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => {
            return MarketingState {
                last_processed_timestamp: String::new(),
                last_daily_broadcast_date: String::new(),
                next_scheduled_broadcast_time: String::new(),
                recent_topics: Vec::new(),
            };
        }
    };
    let reader = BufReader::new(file);
    serde_json::from_reader(reader).unwrap_or(MarketingState {
        last_processed_timestamp: String::new(),
        last_daily_broadcast_date: String::new(),
        next_scheduled_broadcast_time: String::new(),
        recent_topics: Vec::new(),
    })
}

fn save_state(state: &MarketingState) {
    let path = "/root/bottrade/logs/marketing_state.json";
    let file = match File::create(path) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("⚠️ [Marketing Engine] Failed to create state file: {}", e);
            return;
        }
    };
    if let Err(e) = serde_json::to_writer_pretty(file, state) {
        eprintln!("⚠️ [Marketing Engine] Failed to write state file: {}", e);
    }
}

fn read_prediction_history() -> Vec<PredictionEvent> {
    let path = "/root/bottrade/logs/prediction_history.json";
    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return Vec::new(),
    };

    let reader = BufReader::new(file);
    let mut events = Vec::new();
    for line in reader.lines() {
        if let Ok(line_content) = line {
            if let Ok(event) = serde_json::from_str::<PredictionEvent>(&line_content) {
                events.push(event);
            }
        }
    }
    events
}

fn parse_timestamp(ts: &str) -> Option<chrono::DateTime<chrono::FixedOffset>> {
    chrono::DateTime::parse_from_rfc3339(ts).ok()
}

async fn fetch_binance_ticker(symbol: &str) -> Result<(f64, f64), Box<dyn Error>> {
    let url = format!("https://api.binance.com/api/v3/ticker/24hr?symbol={}", symbol);
    let client = reqwest::Client::new();
    let res = client.get(&url).send().await?.json::<serde_json::Value>().await?;
    let last_price: f64 = res["lastPrice"].as_str().unwrap_or("0").parse()?;
    let price_change_percent: f64 = res["priceChangePercent"].as_str().unwrap_or("0").parse()?;
    Ok((last_price, price_change_percent))
}

async fn get_market_summary() -> String {
    let mut summary = Vec::new();
    for coin in &["BTCUSDT", "ETHUSDT", "SOLUSDT"] {
        match fetch_binance_ticker(coin).await {
            Ok((price, change)) => {
                let sign = if change >= 0.0 { "+" } else { "" };
                summary.push(format!("{} is at ${:.2} ({}{:.2}% in 24h)", coin.replace("USDT", ""), price, sign, change));
            }
            Err(e) => {
                eprintln!("⚠️ [Marketing Engine] Failed to fetch Binance ticker for {}: {}", coin, e);
            }
        }
    }
    if summary.is_empty() {
        "Crypto market is moving with stable volatility.".to_string()
    } else {
        summary.join(", ")
    }
}

async fn process_new_events(groq_key: &str, model: &str, state: &mut MarketingState) {
    let events = read_prediction_history();
    
    if state.last_processed_timestamp.is_empty() {
        if let Some(last_event) = events.last() {
            println!("⚙️ [Marketing Engine] First run initialization. Setting last processed timestamp to: {}", last_event.timestamp);
            state.last_processed_timestamp = last_event.timestamp.clone();
            save_state(state);
            return;
        }
    }

    let last_ts = parse_timestamp(&state.last_processed_timestamp);

    let mut new_hits = Vec::new();
    for event in &events {
        if event.event == "TARGET_HIT" {
            let event_ts = parse_timestamp(&event.timestamp);
            match (event_ts, last_ts) {
                (Some(et), Some(lt)) if et > lt => {
                    new_hits.push(event.clone());
                }
                (Some(_et), None) => {
                    new_hits.push(event.clone());
                }
                _ => {}
            }
        }
    }

    new_hits.sort_by(|a, b| {
        let ta = parse_timestamp(&a.timestamp).unwrap_or_default();
        let tb = parse_timestamp(&b.timestamp).unwrap_or_default();
        ta.cmp(&tb)
    });

    for hit in new_hits {
        println!("🔥 [Marketing Engine] Found new TARGET_HIT event for {} at {}", hit.coin, hit.timestamp);
        
        let caption = if !groq_key.is_empty() && groq_key != "YOUR_GROQ_API_KEY" {
            match marketing::generate_target_hit_ad(groq_key, model, &hit.coin, &hit.direction, hit.entry_price, hit.target_price, hit.duration_minutes, "en").await {
                Ok(content) => content,
                Err(e) => {
                    eprintln!("⚠️ [Marketing Engine] Groq target hit generation (EN) failed: {}. Using fallback.", e);
                    marketing::get_fallback_target_hit_ad(&hit.coin, &hit.direction, hit.entry_price, hit.target_price, hit.duration_minutes, "en")
                }
            }
        } else {
            marketing::get_fallback_target_hit_ad(&hit.coin, &hit.direction, hit.entry_price, hit.target_price, hit.duration_minutes, "en")
        };

        let _ = notifications::whatsapp::send(&caption).await;
        let _ = notifications::telegram::send(&caption).await;
        let _ = notifications::buffer::send(&caption).await;

        state.last_processed_timestamp = hit.timestamp.clone();
        save_state(state);
    }
}

async fn process_scheduled_broadcast(groq_key: &str, model: &str, state: &mut MarketingState) {
    let now = Local::now();

    if state.next_scheduled_broadcast_time.is_empty() {
        println!("⚙️ [Marketing Engine] Initializing next scheduled broadcast time to now.");
        state.next_scheduled_broadcast_time = now.to_rfc3339();
        save_state(state);
    }

    let mut next_time = match chrono::DateTime::parse_from_rfc3339(&state.next_scheduled_broadcast_time) {
        Ok(dt) => dt.with_timezone(&Local),
        Err(e) => {
            eprintln!("⚠️ [Marketing Engine] Failed to parse next scheduled time '{}': {}. Resetting.", state.next_scheduled_broadcast_time, e);
            state.next_scheduled_broadcast_time = now.to_rfc3339();
            save_state(state);
            now
        }
    };

    // Jika jadwal berikutnya lebih dari 1 jam dari sekarang, sesuaikan menjadi maksimal 1 jam dari sekarang (agar postingan lebih cepat/banyak)
    if next_time > now + chrono::Duration::hours(1) {
        println!("⚙️ [Marketing Engine] Next scheduled post was set to {}. Adjusting to 1 hour from now per user request.", next_time);
        next_time = now + chrono::Duration::hours(1);
        state.next_scheduled_broadcast_time = next_time.to_rfc3339();
        save_state(state);
    }

    if now >= next_time {
        println!("🌅 [Marketing Engine] Scheduled time arrived: {}. Generating dynamic AI marketing post...", next_time);
        
        let market_data = get_market_summary().await;

        let (caption, topic, _hours_until_next) = if !groq_key.is_empty() && groq_key != "YOUR_GROQ_API_KEY" {
            match marketing::generate_dynamic_marketing_post(groq_key, model, &market_data, &state.recent_topics, "en").await {
                Ok(result) => result,
                Err(e) => {
                    eprintln!("⚠️ [Marketing Engine] AI dynamic marketing (EN) generation failed: {}. Using fallback.", e);
                    let (cap, hr) = marketing::get_fallback_marketing_post("en");
                    (cap, "Fallback".to_string(), hr)
                }
            }
        } else {
            let (cap, hr) = marketing::get_fallback_marketing_post("en");
            (cap, "Fallback".to_string(), hr)
        };

        let _ = notifications::whatsapp::send(&caption).await;
        let _ = notifications::telegram::send(&caption).await;
        let _ = notifications::buffer::send(&caption).await;

        // Log topic to avoid repetition
        state.recent_topics.push(topic);
        if state.recent_topics.len() > 5 {
            state.recent_topics.remove(0);
        }

        // Posting berikutnya tepat 1 jam dari sekarang sesuai instruksi user
        let next_scheduled = now + chrono::Duration::hours(1);
        state.next_scheduled_broadcast_time = next_scheduled.to_rfc3339();
        state.last_daily_broadcast_date = now.format("%Y-%m-%d").to_string();
        save_state(state);

        println!("📅 [Marketing Engine] Next dynamic post scheduled at: {} (Setiap 1 jam)", state.next_scheduled_broadcast_time);
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::from_path("/root/bottrade/.env").ok();
    println!("📢 [Marketing Engine] Starting TradingSafe Automated Marketing & Copywriting Engine...");

    let groq_key = env::var("GROQ_API_KEY").unwrap_or_default();
    let groq_model = env::var("GROQ_MODEL").unwrap_or_else(|_| "llama-3.3-70b-versatile".to_string());

    if groq_key.is_empty() || groq_key == "YOUR_GROQ_API_KEY" {
        println!("💡 [Marketing Engine] WARNING: GROQ_API_KEY is not configured in .env. Will use premium fallback templates.");
    } else {
        println!("✅ [Marketing Engine] GROQ_API_KEY loaded successfully. Model set to: {}", groq_model);
    }

    let mut state = load_state();
    println!("⚙️ [Marketing Engine] Initial State Loaded:");
    println!("   • Last Processed Prediction Hit: {}", state.last_processed_timestamp);
    println!("   • Last Daily Broadcast Date: {}", state.last_daily_broadcast_date);
    println!("   • Next Scheduled Broadcast Time: {}", state.next_scheduled_broadcast_time);
    println!("   • Recent Topics Logged: {:?}", state.recent_topics);

    loop {
        process_new_events(&groq_key, &groq_model, &mut state).await;
        process_scheduled_broadcast(&groq_key, &groq_model, &mut state).await;

        tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
    }
}

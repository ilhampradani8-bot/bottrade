use std::env;
use serde_json::json;

#[path = "../marketing.rs"]
mod marketing;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::from_path("/root/bottrade/.env").ok();
    println!("🧪 Running standalone Marketing Notification test send...");

    let groq_key = env::var("GROQ_API_KEY").unwrap_or_default();
    let groq_model = env::var("GROQ_MODEL").unwrap_or_else(|_| "llama-3.3-70b-versatile".to_string());
    
    let market_summary = "BTC: $67,120 (📈 NAIK 1.2%), ETH: $3,450 (📉 TURUN 0.5%), SOL: $145 (📈 NAIK 4.3%)";
    
    println!("🤖 Generating dynamic marketing content using Groq model: {}...", groq_model);
    let (message, topic, delay_hours) = if !groq_key.is_empty() && groq_key != "YOUR_GROQ_API_KEY" {
        marketing::generate_dynamic_marketing_post(&groq_key, &groq_model, market_summary, &[], "id").await?
    } else {
        println!("⚠️ GROQ_API_KEY not found. Using fallback.");
        let (msg, delay) = marketing::get_fallback_marketing_post("id");
        (msg, "Fallback".to_string(), delay)
    };

    println!("\nGenerated message (Topic: {}, AI delay suggestion: {} hours):\n---\n{}\n---\n", topic, delay_hours, message);

    let client = reqwest::Client::new();

    // 1. WhatsApp
    let group_id = env::var("MARKETING_WHATSAPP_GROUP_ID")
        .unwrap_or_else(|_| "120363426456935344@g.us".to_string());
    let port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5002".to_string());
    let wa_url = format!("http://127.0.0.1:{}/send", port);

    println!("Sending to WhatsApp group: {} via port {}...", group_id, port);
    let payload_wa = json!({
        "message": message,
        "group_id": group_id
    });

    match client.post(&wa_url).json(&payload_wa).send().await {
        Ok(res) => {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            if status.is_success() {
                println!("✅ WhatsApp send succeeded! Response: {}", text);
            } else {
                eprintln!("❌ WhatsApp send failed with status: {}. Response: {}", status, text);
            }
        }
        Err(e) => eprintln!("❌ WhatsApp request failed: {}", e),
    }

    // 2. Telegram
    let token = env::var("MARKETING_TELEGRAM_BOT_TOKEN")
        .or_else(|_| env::var("TELEGRAM_BOT_TOKEN"))?;
    let chat_id = env::var("MARKETING_TELEGRAM_CHAT_ID")?;
    let tg_url = format!("https://api.telegram.org/bot{}/sendMessage", token);

    println!("Sending to Telegram chat: {}...", chat_id);
    let payload_tg = json!({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    });

    match client.post(&tg_url).json(&payload_tg).send().await {
        Ok(res) => {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            if status.is_success() {
                println!("✅ Telegram send succeeded! Response: {}", text);
            } else {
                eprintln!("❌ Telegram send failed with status: {}. Response: {}", status, text);
            }
        }
        Err(e) => eprintln!("❌ Telegram request failed: {}", e),
    }

    Ok(())
}

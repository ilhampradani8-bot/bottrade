use std::error::Error;
use std::env;
use serde_json::json;

pub async fn send(message: &str) -> Result<(), Box<dyn Error>> {
    // 1. Ambil kredensial dari .env
    let token = env::var("TELEGRAM_BOT_TOKEN")?;
    let chat_id = env::var("TELEGRAM_CHAT_ID")?;

    // 2. Buat URL API Telegram
    let url = format!("https://api.telegram.org/bot{}/sendMessage", token);

    // 3. Setup client dan body request
    let client = reqwest::Client::new();
    let payload = json!({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    });

    // 4. Kirim request POST ke Telegram API
    let response = client.post(&url)
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        println!("🚀 [Telegram] Message successfully sent!");
    } else {
        let err_text = response.text().await?;
        eprintln!("❌ [Telegram] Failed to send message. Response: {}", err_text);
        return Err(format!("Telegram API error: {}", err_text).into());
    }

    Ok(())
}

/// Fungsi khusus apabila ingin mengirim analisis ke group spesifik yang berbeda dari default chat_id
pub async fn send_to_group(message: &str, target_group_id: &str) -> Result<(), Box<dyn Error>> {
    let token = env::var("TELEGRAM_BOT_TOKEN")?;
    let url = format!("https://api.telegram.org/bot{}/sendMessage", token);

    let client = reqwest::Client::new();
    let payload = json!({
        "chat_id": target_group_id,
        "text": message,
        "parse_mode": "Markdown"
    });

    let response = client.post(&url)
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        println!("🚀 [Telegram Group] Analysis successfully shared to {}!", target_group_id);
    } else {
        let err_text = response.text().await?;
        eprintln!("❌ [Telegram Group] Failed to send message to {}. Response: {}", target_group_id, err_text);
        return Err(format!("Telegram API error: {}", err_text).into());
    }

    Ok(())
}

pub async fn send_with_reply(message: &str, reply_to_message_id: Option<i64>) -> Result<i64, Box<dyn Error>> {
    let token = env::var("TELEGRAM_BOT_TOKEN")?;
    let chat_id = env::var("TELEGRAM_CHAT_ID")?;
    let url = format!("https://api.telegram.org/bot{}/sendMessage", token);

    let client = reqwest::Client::new();
    let mut payload = json!({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    });

    if let Some(reply_id) = reply_to_message_id {
        payload["reply_to_message_id"] = json!(reply_id);
    }

    let response = client.post(&url)
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        let res_json: serde_json::Value = response.json().await?;
        if let Some(msg_id) = res_json.get("result").and_then(|r| r.get("message_id")).and_then(|m| m.as_i64()) {
            println!("🚀 [Telegram] Message sent successfully with ID: {}", msg_id);
            return Ok(msg_id);
        }
        Err("Missing message_id in response".into())
    } else {
        let err_text = response.text().await?;
        eprintln!("❌ [Telegram] Failed to send message. Response: {}", err_text);
        Err(format!("Telegram API error: {}", err_text).into())
    }
}

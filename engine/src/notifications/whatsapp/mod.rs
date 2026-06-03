use std::error::Error;
use std::env;
use serde_json::json;

pub async fn send(message: &str) -> Result<(), Box<dyn Error>> {
    // 1. Ambil Group ID dari .env. Jika belum disetel, skip secara aman agar engine tidak crash
    let group_id = match env::var("WHATSAPP_GROUP_ID") {
        Ok(id) if !id.trim().is_empty() => id,
        _ => {
            println!("💡 [WhatsApp] Skipping broadcast: WHATSAPP_GROUP_ID is not configured yet in .env.");
            return Ok(());
        }
    };

    let port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string());
    let url = format!("http://127.0.0.1:{}/send", port);

    // 2. Setup client dan body request
    let client = reqwest::Client::new();
    let payload = json!({
        "message": message
    });

    // 3. Kirim request POST ke Node.js WhatsApp Bridge
    let response = client.post(&url)
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        println!("🚀 [WhatsApp] Message successfully sent via Node.js Bridge!");
    } else {
        let err_text = response.text().await?;
        eprintln!("❌ [WhatsApp] Failed to send message via Bridge. Response: {}", err_text);
        return Err(format!("WhatsApp Bridge error: {}", err_text).into());
    }

    Ok(())
}

pub fn generate_qr_login() {
    // Dengan arsitektur baru, login QR di-handle langsung oleh Node.js bridge
    println!("💡 [WhatsApp Bridge] Silakan jalankan service Node.js WhatsApp di `/root/bottrade/whatsapp-service` untuk scan QR code dan memproses selamat datang + pengiriman analisa.");
}

pub async fn send_to_group(message: &str, group_id: &str) -> Result<(), Box<dyn Error>> {
    let port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string());
    let url = format!("http://127.0.0.1:{}/send", port);

    let client = reqwest::Client::new();
    let payload = json!({
        "message": message,
        "group_id": group_id
    });

    let response = client.post(&url)
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        println!("🚀 [WhatsApp] Message successfully sent to group {}!", group_id);
    } else {
        let err_text = response.text().await?;
        eprintln!("❌ [WhatsApp] Failed to send to group {}. Response: {}", group_id, err_text);
        return Err(format!("WhatsApp Bridge error: {}", err_text).into());
    }

    Ok(())
}

pub async fn send_to_group_with_reply(message: &str, group_id: &str, quoted_msg_id: Option<&str>) -> Result<String, Box<dyn Error>> {
    let port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5001".to_string());
    let url = format!("http://127.0.0.1:{}/send", port);

    let client = reqwest::Client::new();
    let mut payload = json!({
        "message": message,
        "group_id": group_id
    });

    if let Some(quoted) = quoted_msg_id {
        payload["quoted_msg_id"] = json!(quoted);
    }

    let response = client.post(&url)
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        let res_json: serde_json::Value = response.json().await?;
        if let Some(msg_id) = res_json.get("message_id").and_then(|m| m.as_str()) {
            println!("🚀 [WhatsApp] Message successfully sent to group {} with ID: {}", group_id, msg_id);
            return Ok(msg_id.to_string());
        }
        Err("Missing message_id in response".into())
    } else {
        let err_text = response.text().await?;
        eprintln!("❌ [WhatsApp] Failed to send to group {}. Response: {}", group_id, err_text);
        Err(format!("WhatsApp Bridge error: {}", err_text).into())
    }
}

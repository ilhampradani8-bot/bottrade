pub mod whatsapp {
    use std::error::Error;
    use std::env;
    use serde_json::json;

    pub async fn send(message: &str) -> Result<(), Box<dyn Error>> {
        let group_id = match env::var("MARKETING_WHATSAPP_GROUP_ID")
            .or_else(|_| env::var("WHATSAPP_GROUP_ID")) {
            Ok(id) if !id.trim().is_empty() => id,
            _ => {
                println!("💡 [WhatsApp] Skipping broadcast: MARKETING_WHATSAPP_GROUP_ID / WHATSAPP_GROUP_ID is not configured yet in .env.");
                return Ok(());
            }
        };

        let port = env::var("WHATSAPP_PORT").unwrap_or_else(|_| "5002".to_string());
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
            println!("🚀 [WhatsApp] Marketing message successfully sent via Node.js Bridge!");
        } else {
            let err_text = response.text().await?;
            eprintln!("❌ [WhatsApp] Failed to send marketing message. Response: {}", err_text);
            return Err(format!("WhatsApp Bridge error: {}", err_text).into());
        }

        Ok(())
    }
}

pub mod telegram {
    use std::error::Error;
    use std::env;
    use serde_json::json;

    pub async fn send(message: &str) -> Result<(), Box<dyn Error>> {
        let token = match env::var("MARKETING_TELEGRAM_BOT_TOKEN")
            .or_else(|_| env::var("TELEGRAM_BOT_TOKEN")) {
            Ok(t) if !t.trim().is_empty() => t,
            _ => {
                println!("💡 [Telegram] Skipping broadcast: MARKETING_TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_TOKEN is not configured.");
                return Ok(());
            }
        };

        let chat_id = match env::var("MARKETING_TELEGRAM_CHAT_ID")
            .or_else(|_| env::var("TELEGRAM_CHAT_ID")) {
            Ok(id) if !id.trim().is_empty() => id,
            _ => {
                println!("💡 [Telegram] Skipping broadcast: MARKETING_TELEGRAM_CHAT_ID / TELEGRAM_CHAT_ID is not configured.");
                return Ok(());
            }
        };

        let url = format!("https://api.telegram.org/bot{}/sendMessage", token);
        let payload = json!({
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        });

        let client = reqwest::Client::new();
        let response = client.post(&url)
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            println!("🚀 [Telegram] Marketing message successfully sent!");
        } else {
            let err_text = response.text().await?;
            eprintln!("❌ [Telegram] Failed to send with Markdown: {}. Retrying as plain text...", err_text);

            let retry_payload = json!({
                "chat_id": chat_id,
                "text": message
            });
            let retry_response = client.post(&url)
                .json(&retry_payload)
                .send()
                .await?;

            if retry_response.status().is_success() {
                println!("🚀 [Telegram] Marketing message successfully sent as plain text fallback!");
            } else {
                let retry_err_text = retry_response.text().await?;
                eprintln!("❌ [Telegram] Failed to send as plain text too: {}", retry_err_text);
                return Err(format!("Telegram API error: {}", retry_err_text).into());
            }
        }

        Ok(())
    }
}

pub mod buffer {
    use std::error::Error;
    use std::env;
    use serde_json::json;

    pub async fn send(message: &str) -> Result<(), Box<dyn Error>> {
        let api_key = match env::var("BUFFER_API_KEY") {
            Ok(k) if !k.trim().is_empty() => k,
            _ => {
                println!("💡 [Buffer] Skipping broadcast: BUFFER_API_KEY is not configured.");
                return Ok(());
            }
        };

        // Get channel IDs
        let mut channel_ids = Vec::new();
        if let Ok(id) = env::var("BUFFER_X_CHANNEL_ID") {
            if !id.trim().is_empty() {
                channel_ids.push(id);
            }
        }
        /*
        if let Ok(id) = env::var("BUFFER_THREADS_CHANNEL_ID") {
            if !id.trim().is_empty() {
                channel_ids.push(id);
            }
        }
        */

        if channel_ids.is_empty() {
            println!("💡 [Buffer] Skipping broadcast: No Buffer channels (BUFFER_X_CHANNEL_ID / BUFFER_THREADS_CHANNEL_ID) configured.");
            return Ok(());
        }

        let x_channel_id = env::var("BUFFER_X_CHANNEL_ID").unwrap_or_default();
        let client = reqwest::Client::new();
        let url = "https://api.buffer.com";

        for channel_id in channel_ids {
            println!("🚀 [Buffer] Sending post to channel {}...", channel_id);

            let post_text = if channel_id == x_channel_id && message.chars().count() > 280 {
                let truncated: String = message.chars().take(277).collect();
                format!("{}...", truncated)
            } else {
                message.to_string()
            };

            let payload = json!({
                "query": "mutation ($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id } } ... on MutationError { message } } }",
                "variables": {
                    "input": {
                        "text": post_text,
                        "channelId": channel_id,
                        "schedulingType": "automatic",
                        "mode": "shareNow"
                    }
                }
            });

            let response = client.post(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .header("Content-Type", "application/json")
                .json(&payload)
                .send()
                .await?;

            if response.status().is_success() {
                let res_json: serde_json::Value = response.json().await?;
                if let Some(errors) = res_json.get("errors") {
                    eprintln!("❌ [Buffer] GraphQL error for channel {}: {:?}", channel_id, errors);
                } else if let Some(message_error) = res_json.get("data")
                    .and_then(|d| d.get("createPost"))
                    .and_then(|cp| cp.get("message")) {
                    eprintln!("❌ [Buffer] Mutation error for channel {}: {}", channel_id, message_error);
                } else if let Some(post_id) = res_json.get("data")
                    .and_then(|d| d.get("createPost"))
                    .and_then(|cp| cp.get("post"))
                    .and_then(|p| p.get("id")) {
                    println!("🚀 [Buffer] Post successfully queued for channel {} with ID: {}", channel_id, post_id);
                } else {
                    println!("🚀 [Buffer] Post sent to channel {}, response: {:?}", channel_id, res_json);
                }
            } else {
                let status = response.status();
                let err_text = response.text().await?;
                eprintln!("❌ [Buffer] Failed to queue post for channel {}. Status: {}, Response: {}", channel_id, status, err_text);
            }
        }

        Ok(())
    }
}

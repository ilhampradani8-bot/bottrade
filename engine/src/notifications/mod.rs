pub mod whatsapp;
pub mod telegram;

use std::error::Error;

pub enum NotificationProvider {
    WhatsApp,
    Telegram,
}

pub async fn send_alert(message: &str) -> Result<(), Box<dyn Error>> {
    println!("🔔 [NOTIFY] Processing alert: {}", message);
    
    // Kirim ke Telegram (Real)
    if let Err(e) = telegram::send(message).await {
        eprintln!("⚠️ [NOTIFY] Failed to send Telegram alert: {}", e);
    }
    
    // Kirim ke WhatsApp (Simulasi / Log)
    if let Err(e) = whatsapp::send(message).await {
        eprintln!("⚠️ [NOTIFY] Failed to send WhatsApp alert: {}", e);
    }
    
    Ok(())
}

pub fn format_alert_message(strategy: &str, pair: &str, action: &str, price: f64) -> String {
    format!(
        "🤖 *BOTTRADE ALERT*\n━━━━━━━━━━━━━━\n📈 *Strategy*: {}\n🪙 *Pair*: {}\n🎯 *Action*: {}\n💰 *Price*: {:.2}\n━━━━━━━━━━━━━━",
        strategy, pair, action, price
    )
}

mod Engine24am;
mod bot24jam;
mod notifications;

use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::from_path("/root/bottrade/.env").ok();
    
    // 1. Inisialisasi Database
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("✅ Database connected to Engine Controller");

    // Tampilkan QR Login WhatsApp di awal
    notifications::whatsapp::generate_qr_login();

    // 2. Buat dan Jalankan Engine Orchestrator
    let mut engine = Engine24am::Engine::new(pool);
    
    // Jalankan mesin utama
    engine.run().await?;

    Ok(())
}

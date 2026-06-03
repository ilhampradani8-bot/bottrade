use std::error::Error;
use tokio::time::{sleep, Duration};
use sqlx::PgPool;
use std::collections::HashMap;
use tokio::task::JoinHandle;

use crate::bot24jam;

// Struktur untuk memantau worker yang sedang berjalan
pub struct Engine {
    pool: PgPool,
    active_workers: HashMap<i32, JoinHandle<()>>, // Map ID Bot ke Task yang sedang jalan
}

impl Engine {
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool,
            active_workers: HashMap::new(),
        }
    }

    pub async fn run(&mut self) -> Result<(), Box<dyn Error>> {
        println!("🚀 Engine24am Orchestrator Started.");
        
        loop {
            // 1. Baca tabel strategi yang statusnya 'active'
            let active_bots = sqlx::query!(
                "SELECT id, name, pair, bot_type FROM strategies WHERE status = 'active'"
            )
            .fetch_all(&self.pool)
            .await?;

            // 2. Cek bot mana yang harus dijalankan
            for bot in active_bots {
                if !self.active_workers.contains_key(&bot.id) {
                    println!("✨ Spawning new worker for Bot: {} ({})", bot.name, bot.pair);
                    
                    let pool_clone = self.pool.clone();
                    let bot_id = bot.id;
                    
                    // Spawn worker task (bot24jam logic)
                    let handle = tokio::spawn(async move {
                        if let Err(e) = bot24jam::run_bot_worker(pool_clone, bot_id).await {
                            eprintln!("❌ Worker Error [Bot ID {}]: {}", bot_id, e);
                        }
                    });

                    self.active_workers.insert(bot.id, handle);
                }
            }

            // 3. (Opsional) Cek bot mana yang harus dihentikan jika statusnya berubah jadi 'stopped'
            // logic here...

            sleep(Duration::from_secs(10)).await; // Re-sync setiap 10 detik
        }
    }
}

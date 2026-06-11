use std::error::Error;
use tokio::time::{sleep, Duration};
use sqlx::PgPool;
use std::collections::HashMap;
use tokio::task::JoinHandle;

use crate::realtime_sim::bot_worker;

pub struct SimEngine {
    pool: PgPool,
    active_workers: HashMap<i32, JoinHandle<()>>,
}

impl SimEngine {
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool,
            active_workers: HashMap::new(),
        }
    }

    pub async fn run(&mut self) -> Result<(), Box<dyn Error>> {
        println!("🚀 SimEngine (Simulation Orchestrator) Started.");
        
        loop {
            // 1. Baca tabel simulations yang statusnya 'active'
            let active_bots = sqlx::query!(
                "SELECT id, name, pair, bot_type FROM simulations_by_simsettings WHERE status = 'active'"
            )
            .fetch_all(&self.pool)
            .await;

            let active_bots = match active_bots {
                Ok(b) => b,
                Err(e) => {
                    eprintln!("❌ Database Error in SimEngine: {}", e);
                    sleep(Duration::from_secs(10)).await;
                    continue;
                }
            };

            // 2. Cek bot mana yang harus dijalankan
            for bot in &active_bots {
                if !self.active_workers.contains_key(&bot.id) {
                    println!("✨ Spawning new worker for Simulation Bot: {} ({})", bot.name, bot.pair);
                    
                    let pool_clone = self.pool.clone();
                    let bot_id = bot.id;
                    
                    let handle = tokio::spawn(async move {
                        if let Err(e) = bot_worker::run_sim_worker(pool_clone, bot_id).await {
                            eprintln!("❌ Sim Worker Error [Bot ID {}]: {}", bot_id, e);
                        }
                    });

                    self.active_workers.insert(bot.id, handle);
                }
            }

            // 3. Cek bot mana yang harus dihentikan jika statusnya berubah dari 'active'
            let mut bots_to_stop = Vec::new();
            for id in self.active_workers.keys() {
                if !active_bots.iter().any(|b| b.id == *id) {
                    bots_to_stop.push(*id);
                }
            }

            for id in bots_to_stop {
                if let Some(handle) = self.active_workers.remove(&id) {
                    println!("🛑 Stopping worker for Simulation Bot ID: {}", id);
                    handle.abort();
                }
            }

            sleep(Duration::from_secs(10)).await;
        }
    }
}

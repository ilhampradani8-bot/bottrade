mod hear;
mod bot;

use sqlx::postgres::PgPoolOptions;
use std::env;
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment from main project folder
    dotenvy::from_path("/root/bottrade/.env").ok();
    
    // 1. Initialize DB pool
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("✅ [Engine-User] Connected to Postgres database.");

    // 2. Shared Pricing State
    let prices = Arc::new(RwLock::new(HashMap::<String, f64>::new()));
    
    // Track currently running bots in memory: Map of bot_id -> StrategyBot
    let mut running_live_bots: HashMap<i32, bot::StrategyBot> = HashMap::new();
    let mut running_sim_bots: HashMap<i32, bot::StrategyBot> = HashMap::new();
    
    // Track subscribed pairs to detect changes
    let mut subscribed_pairs: Vec<String> = Vec::new();
    let mut ws_handle: Option<tokio::task::JoinHandle<()>> = None;

    println!("⚡ Starting Engine-User Orchestrator Core loop...");

    let mut tick_counter = 0;

    loop {
        // Query active bots every 5 seconds (every 5 tick loops) to sync with admin actions
        if tick_counter % 5 == 0 {
            let active_db_bots = sqlx::query!(
                "SELECT id, user_id, name, bot_type, pair, settings, status 
                 FROM strategies_by_strategysettings 
                 WHERE status = 'Running'"
            )
            .fetch_all(&pool)
            .await;

            let active_db_sims = sqlx::query!(
                "SELECT id, user_id, name, bot_type, pair, settings, status 
                 FROM simulations_by_simsettings 
                 WHERE status = 'active'"
            )
            .fetch_all(&pool)
            .await;

            match (active_db_bots, active_db_sims) {
                (Ok(live_bots), Ok(sim_bots)) => {
                    let mut active_live_ids = Vec::new();
                    let mut active_sim_ids = Vec::new();
                    let mut current_pairs = Vec::new();

                    for db_bot in live_bots {
                        active_live_ids.push(db_bot.id);
                        if !current_pairs.contains(&db_bot.pair) {
                            current_pairs.push(db_bot.pair.clone());
                        }

                        // If bot is not in memory, initialize and run it
                        if !running_live_bots.contains_key(&db_bot.id) {
                            let user_id = db_bot.user_id.unwrap_or(0);
                            let bot_instance = bot::StrategyBot::new(
                                db_bot.id,
                                user_id,
                                db_bot.name.clone(),
                                db_bot.bot_type.clone(),
                                db_bot.pair.clone(),
                                db_bot.settings,
                                pool.clone(),
                                prices.clone(),
                                false, // is_simulation = false
                            );
                            running_live_bots.insert(db_bot.id, bot_instance);
                            println!("🚀 [Engine-User] Spawned new active LIVE bot instance #{} ({})", db_bot.id, db_bot.name);
                        }
                    }

                    for db_sim in sim_bots {
                        active_sim_ids.push(db_sim.id);
                        if !current_pairs.contains(&db_sim.pair) {
                            current_pairs.push(db_sim.pair.clone());
                        }

                        // If simulation bot is not in memory, initialize and run it
                        if !running_sim_bots.contains_key(&db_sim.id) {
                            let user_id = db_sim.user_id.unwrap_or(0);
                            let bot_instance = bot::StrategyBot::new(
                                db_sim.id,
                                user_id,
                                db_sim.name.clone(),
                                db_sim.bot_type.clone(),
                                db_sim.pair.clone(),
                                db_sim.settings,
                                pool.clone(),
                                prices.clone(),
                                true, // is_simulation = true
                            );
                            running_sim_bots.insert(db_sim.id, bot_instance);
                            println!("🚀 [Engine-User] Spawned new active SIMULATION bot instance #{} ({})", db_sim.id, db_sim.name);
                        }
                    }

                    // Remove live bots that are no longer active/stopped
                    let live_keys_to_remove: Vec<i32> = running_live_bots
                        .keys()
                        .filter(|id| !active_live_ids.contains(id))
                        .copied()
                        .collect();

                    for id in live_keys_to_remove {
                        running_live_bots.remove(&id);
                        println!("🛑 [Engine-User] Stopped and unloaded LIVE bot instance #{}", id);
                    }

                    // Remove simulation bots that are no longer active/stopped
                    let sim_keys_to_remove: Vec<i32> = running_sim_bots
                        .keys()
                        .filter(|id| !active_sim_ids.contains(id))
                        .copied()
                        .collect();

                    for id in sim_keys_to_remove {
                        running_sim_bots.remove(&id);
                        println!("🛑 [Engine-User] Stopped and unloaded SIMULATION bot instance #{}", id);
                    }

                    // Update WebSocket subscriber stream if the list of pairs changed
                    current_pairs.sort();
                    if current_pairs != subscribed_pairs {
                        println!("🔄 [Engine-User] Pairs list updated from {:?} to {:?}", subscribed_pairs, current_pairs);
                        subscribed_pairs = current_pairs.clone();
                        
                        // Abort existing WebSocket stream task if running
                        if let Some(handle) = ws_handle.take() {
                            handle.abort();
                        }

                        // Spawn new WebSocket listener task
                        let listener = hear::PriceListener::new(prices.clone());
                        let pairs_to_subscribe = subscribed_pairs.clone();
                        ws_handle = Some(tokio::spawn(async move {
                            if let Err(e) = listener.listen(pairs_to_subscribe).await {
                                eprintln!("❌ [WebSocket] Stream error: {}", e);
                            }
                        }));
                    }
                }
                (Err(e), _) => {
                    eprintln!("❌ [Engine-User] Database fetch error (live): {:?}", e);
                }
                (_, Err(e)) => {
                    eprintln!("❌ [Engine-User] Database fetch error (sim): {:?}", e);
                }
            }
        }

        // Tick all active live bots in memory
        for (bot_id, bot_instance) in &mut running_live_bots {
            if let Err(e) = bot_instance.tick().await {
                eprintln!("❌ [Engine-User] Error ticking LIVE bot #{}: {}", bot_id, e);
            }
        }

        // Tick all active simulation bots in memory
        for (sim_id, bot_instance) in &mut running_sim_bots {
            if let Err(e) = bot_instance.tick().await {
                eprintln!("❌ [Engine-User] Error ticking SIMULATION bot #{}: {}", sim_id, e);
            }
        }

        sleep(Duration::from_secs(1)).await;
        tick_counter += 1;
    }
}

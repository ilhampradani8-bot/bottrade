use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use sqlx::PgPool;
use serde_json::Value;
use chrono::Utc;
use rust_decimal::Decimal;
use rust_decimal::prelude::FromPrimitive;

#[allow(dead_code)]
pub struct StrategyBot {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub bot_type: String,
    pub pair: String,
    pub settings: Value,
    pool: PgPool,
    prices: Arc<RwLock<HashMap<String, f64>>>,
    pub is_simulation: bool,
    // Local state for tracking bot execution state
    last_action_price: Option<f64>,
    position_size: f64,
    buy_amount: f64,
}

impl StrategyBot {
    pub fn new(
        id: i32,
        user_id: i32,
        name: String,
        bot_type: String,
        pair: String,
        settings: Value,
        pool: PgPool,
        prices: Arc<RwLock<HashMap<String, f64>>>,
        is_simulation: bool,
    ) -> Self {
        // Parse buy_amount or nominal (handles string numbers with commas e.g. "1,000,000")
        let buy_amount = settings.get("nominal")
            .and_then(|v| {
                v.as_str()
                    .map(|s| s.replace(",", "").parse::<f64>().unwrap_or(100.0))
                    .or_else(|| v.as_f64())
            })
            .or_else(|| {
                settings.get("buy_amount").and_then(|v| {
                    v.as_str()
                        .map(|s| s.replace(",", "").parse::<f64>().unwrap_or(100.0))
                        .or_else(|| v.as_f64())
                })
            })
            .unwrap_or(100.0);

        Self {
            id,
            user_id,
            name,
            bot_type,
            pair,
            settings,
            pool,
            prices,
            is_simulation,
            last_action_price: None,
            position_size: 0.0,
            buy_amount,
        }
    }

    /// Primary execution cycle of the bot worker
    pub async fn tick(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Formatted pair for lookup (e.g. "BTC/USDT" -> "BTCUSDT")
        let formatted_pair = self.pair.replace("/", "").to_uppercase();
        
        let current_price = {
            let prices_guard = self.prices.read().unwrap();
            prices_guard.get(&formatted_pair).copied()
        };

        let price = match current_price {
            Some(p) => p,
            None => return Ok(()), // Wait until price stream is available
        };

        // If this is the first tick, store initial entry price
        if self.last_action_price.is_none() {
            self.last_action_price = Some(price);
            println!("🤖 [Bot-{}] Initialized. Tracking pair {} at starting price ${:.2}", self.id, self.pair, price);
        }

        let bot_type_lower = self.bot_type.to_lowercase();
        if bot_type_lower.contains("dca") {
            self.execute_dca_logic(price).await?;
        } else if bot_type_lower.contains("grid") {
            self.execute_grid_logic(price).await?;
        } else {
            self.execute_indicator_logic(price).await?;
        }

        Ok(())
    }

    /// DCA logic simulation: Buy more if price drops, Sell all if take profit or stop loss hit
    async fn execute_dca_logic(&mut self, price: f64) -> Result<(), Box<dyn std::error::Error>> {
        let entry_price = self.last_action_price.unwrap();
        
        let parse_f64_val = |val: &Value| -> Option<f64> {
            val.as_f64()
                .or_else(|| {
                    val.as_str().and_then(|s| s.replace(",", "").parse::<f64>().ok())
                })
        };

        // Safety deviation or safety order nominal trigger
        // check "price_deviation" or "safety_deviation" (e.g. "2.0" -> 0.02)
        let deviation_pct = self.settings.get("price_deviation")
            .or_else(|| self.settings.get("safety_deviation"))
            .and_then(parse_f64_val)
            .map(|d| if d >= 1.0 { d / 100.0 } else { d })
            .unwrap_or(0.025);

        // Take profit percentage (e.g. 1.5% is 0.015)
        let take_profit_pct = self.settings.get("take_profit_percentage")
            .or_else(|| self.settings.get("take_profit"))
            .and_then(parse_f64_val)
            .map(|tp| if tp >= 1.0 { tp / 100.0 } else { tp })
            .unwrap_or(0.015);

        // Stop loss percentage
        let stop_loss_pct = self.settings.get("stop_loss_percentage")
            .or_else(|| self.settings.get("stop_loss"))
            .and_then(parse_f64_val)
            .map(|sl| if sl >= 1.0 { sl / 100.0 } else { sl })
            .unwrap_or(0.0);

        // 1. STOP LOSS TRIGGER
        if stop_loss_pct > 0.0 && self.position_size > 0.0 && (price <= entry_price * (1.0 - stop_loss_pct)) {
            let total_value = self.position_size * price;
            let loss = total_value - (self.position_size * entry_price);
            
            println!("🛑 [Bot-{}] STOP LOSS triggered for {} at ${:.2}. Loss: ${:.2}", self.id, self.pair, price, loss);
            self.record_trade("SELL (SL)", price, self.position_size, Some(loss)).await?;
            
            // Reset state
            self.position_size = 0.0;
            self.last_action_price = Some(price);
            return Ok(());
        }

        // 2. BUY TRIGGER (Price drops below deviation limit from last action price)
        if self.position_size == 0.0 || (price <= entry_price * (1.0 - deviation_pct)) {
            let qty = self.buy_amount / price;
            self.position_size += qty;
            self.last_action_price = Some(price);
            
            println!("🛒 [Bot-{}] DCA BUY executed for {} at ${:.2}", self.id, self.pair, price);
            self.record_trade("BUY", price, qty, None).await?;
        }
        // 3. SELL TRIGGER (Take profit reached)
        else if self.position_size > 0.0 && (price >= entry_price * (1.0 + take_profit_pct)) {
            let total_value = self.position_size * price;
            let profit = total_value - (self.position_size * entry_price);
            
            println!("💰 [Bot-{}] DCA TAKE PROFIT triggered for {} at ${:.2}. Profit: ${:.2}", self.id, self.pair, price, profit);
            self.record_trade("SELL (TP)", price, self.position_size, Some(profit)).await?;
            
            // Reset position
            self.position_size = 0.0;
            self.last_action_price = Some(price);
        }

        Ok(())
    }

    /// GRID trading logic simulation
    async fn execute_grid_logic(&mut self, price: f64) -> Result<(), Box<dyn std::error::Error>> {
        let entry_price = self.last_action_price.unwrap();
        
        let parse_f64_val = |val: &Value| -> Option<f64> {
            val.as_f64()
                .or_else(|| {
                    val.as_str().and_then(|s| s.replace(",", "").parse::<f64>().ok())
                })
        };

        let grid_range = self.settings.get("grid_spacing")
            .or_else(|| self.settings.get("grid_percentage"))
            .or_else(|| self.settings.get("price_deviation"))
            .and_then(parse_f64_val)
            .map(|g| if g >= 1.0 { g / 100.0 } else { g })
            .unwrap_or(0.01); // 1% spacing default

        if price <= entry_price * (1.0 - grid_range) {
            // Buy grid level
            let buy_qty = self.buy_amount / price;
            self.position_size += buy_qty;
            self.last_action_price = Some(price);
            
            println!("🧱 [Bot-{}] Grid Level BUY at ${:.2}", self.id, price);
            self.record_trade("BUY (GRID)", price, buy_qty, None).await?;
        } else if self.position_size > 0.0 && price >= entry_price * (1.0 + grid_range) {
            // Sell grid level
            let profit = (price - entry_price) * self.position_size;
            
            println!("🧱 [Bot-{}] Grid Level SELL at ${:.2}. PnL: ${:.2}", self.id, price, profit);
            self.record_trade("SELL (GRID)", price, self.position_size, Some(profit)).await?;
            
            self.position_size = 0.0;
            self.last_action_price = Some(price);
        }

        Ok(())
    }

    /// Technical Indicator strategy simulation
    async fn execute_indicator_logic(&mut self, _price: f64) -> Result<(), Box<dyn std::error::Error>> {
        Ok(())
    }

    /// Record the transaction trade into PostgreSQL trades table
    async fn record_trade(&self, side: &str, price: f64, amount: f64, pnl: Option<f64>) -> Result<(), Box<dyn std::error::Error>> {
        let dec_price = Decimal::from_f64(price).unwrap_or(Decimal::ZERO);
        let dec_amount = Decimal::from_f64(amount).unwrap_or(Decimal::ZERO);
        let dec_pnl = pnl.map(|p| Decimal::from_f64(p).unwrap_or(Decimal::ZERO));

        if self.is_simulation {
            let currency = self.settings.get("currency")
                .and_then(|v| v.as_str())
                .unwrap_or("IDR")
                .to_string();

            sqlx::query!(
                "INSERT INTO simulation_trades_by_jurnal 
                 (user_id, pair, strategy_type, side, price, amount, pnl, currency, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                self.user_id,
                self.pair,
                self.bot_type,
                if side.starts_with("BUY") { "BUY" } else { "SELL" },
                dec_price,
                dec_amount,
                dec_pnl,
                currency,
                Utc::now().naive_utc()
            )
            .execute(&self.pool)
            .await?;
        } else {
            sqlx::query!(
                "INSERT INTO trades_by_jurnalriwayat 
                 (user_id, pair, strategy_type, side, price, amount, pnl, created_at, status, requested_price, slippage, market_regime, is_manual_intervention, error_code, error_message) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
                self.user_id,
                self.pair,
                self.bot_type,
                side,
                dec_price,
                dec_amount,
                dec_pnl,
                Utc::now(),
                "COMPLETED",
                dec_price,
                Decimal::ZERO,
                "NORMAL",
                false,
                Option::<String>::None,
                Option::<String>::None
            )
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }
}

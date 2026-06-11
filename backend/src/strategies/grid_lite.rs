use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use crate::strategies::indicators::IndicatorFilter;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct GridSettings {
    pub lower_price: Decimal,
    pub upper_price: Decimal,
    pub grid_number: u32,
    pub modal: Decimal,
    pub daily_drawdown_limit: Option<Decimal>,
}

pub fn run_grid_backtest(klines: &[Kline], settings: GridSettings, filter: &IndicatorFilter) -> BacktestResult {
    let mut balance = settings.modal;
    let mut trades = Vec::new();
    let mut total_pnl = dec!(0);
    
    if settings.grid_number == 0 || settings.upper_price <= settings.lower_price {
        return BacktestResult::default();
    }

    let grid_size = (settings.upper_price - settings.lower_price) / Decimal::from(settings.grid_number);
    let amount_per_grid = settings.modal / Decimal::from(settings.grid_number);
    
    // Track active buy orders at each grid level
    let mut active_buys: Vec<Option<Decimal>> = vec![None; settings.grid_number as usize];

    let mut day_start_equity = balance;
    let mut last_day = -1;
    let mut day_locked = false;

    for (idx, k) in klines.iter().enumerate() {
        // Daily Drawdown Logic
        let current_day = k.open_time / 86400000;
        if current_day != last_day {
            let mut current_equity = balance;
            for maybe_buy in &active_buys {
                if let Some(_buy_price) = maybe_buy {
                    current_equity += amount_per_grid; // Simplified
                }
            }
            day_start_equity = current_equity;
            last_day = current_day;
            day_locked = false;
        }

        if day_locked { continue; }

        if let Some(limit) = settings.daily_drawdown_limit {
             let mut current_equity = balance;
             for maybe_buy in &active_buys {
                if let Some(buy_price) = maybe_buy {
                    current_equity += amount_per_grid * (k.close / buy_price);
                }
            }
            if (current_equity - day_start_equity) / day_start_equity < -limit {
                // Force close all grids
                for i in 0..settings.grid_number as usize {
                    if let Some(buy_price) = active_buys[i] {
                         let pnl = amount_per_grid * (k.close / buy_price - dec!(1));
                         balance += amount_per_grid + pnl;
                         total_pnl += pnl;
                         trades.push(Trade {
                            side: "SELL (Drawdown Limit)".into(),
                            price: k.close,
                            time: k.open_time,
                            pnl: Some(pnl),
                        });
                        active_buys[i] = None;
                    }
                }
                day_locked = true;
                continue;
            }
        }

        for i in 0..settings.grid_number as usize {
            let level_price = settings.lower_price + (grid_size * Decimal::from(i));
            
            // Buy if price drops to level and we don't have a buy there
            if active_buys[i].is_none() && k.low <= level_price && balance >= amount_per_grid && filter.allows_buy(idx) {
                active_buys[i] = Some(level_price);
                balance -= amount_per_grid;
                
                trades.push(Trade {
                    side: "BUY".into(),
                    price: level_price,
                    time: k.open_time,
                    pnl: None,
                });
            }
            
            // Sell if price rises to next level and we have a buy at this level
            if let Some(buy_price) = active_buys[i] {
                let sell_target = level_price + grid_size;
                if k.high >= sell_target {
                    let pnl = amount_per_grid * (sell_target / buy_price - dec!(1));
                    balance += amount_per_grid + pnl;
                    total_pnl += pnl;
                    active_buys[i] = None;
                    
                    trades.push(Trade {
                        side: "SELL".into(),
                        price: sell_target,
                        time: k.open_time,
                        pnl: Some(pnl),
                    });
                }
            }
        }
    }

    let win_trades = trades.iter().filter(|t| t.pnl.unwrap_or(dec!(0)) > dec!(0)).count();
    let total_sell_trades = trades.iter().filter(|t| t.side.contains("SELL")).count();
    
    let win_rate = if total_sell_trades > 0 {
        Decimal::from(win_trades) / Decimal::from(total_sell_trades) * dec!(100)
    } else {
        dec!(0)
    };

    let mut indicator_data = std::collections::HashMap::new();
    indicator_data.insert("lower_bound".to_string(), vec![Some(settings.lower_price); klines.len()]);
    indicator_data.insert("upper_bound".to_string(), vec![Some(settings.upper_price); klines.len()]);
    for (key, val) in &filter.computed_data {
        indicator_data.insert(key.clone(), val.clone());
    }

    BacktestResult {
        total_trades: trades.len(),
        win_rate,
        total_pnl,
        trades,
        indicator_data,
    }
}

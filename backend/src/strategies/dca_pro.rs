use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};

use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Clone, TS, Default)]
#[ts(export, export_to = "../../frontend/src/types/DcaProSettings.ts")]
pub struct DcaProSettings {
    #[ts(type = "string")]
    pub base_order_size: Decimal,
    #[ts(type = "string")]
    pub safety_order_size: Decimal,
    #[ts(type = "string")]
    pub price_deviation: Decimal, // e.g., 0.02 for 2%
    #[ts(type = "string")]
    pub step_scale: Decimal,      // Multiplier for price deviation
    #[ts(type = "string")]
    pub volume_scale: Decimal,    // Multiplier for safety order size
    pub max_safety_orders: u32,
    #[ts(type = "string")]
    pub take_profit: Decimal,     // e.g., 0.015 for 1.5%
    pub leverage: u32,
    #[ts(type = "string")]
    pub trailing_stop: Option<Decimal>, // e.g., Some(0.005) for 0.5%
    #[ts(type = "string")]
    pub daily_drawdown_limit: Option<Decimal>,
}

pub fn run_dca_pro_backtest(klines: &[Kline], settings: DcaProSettings, initial_capital: Decimal) -> BacktestResult {
    let mut balance = initial_capital;
    let mut position_size = dec!(0);
    let mut average_price = dec!(0);
    let mut trades = Vec::new();
    let mut total_pnl = dec!(0);
    
    let mut current_safety_orders = 0;
    let mut next_so_price = dec!(0);
    let mut current_so_size = settings.safety_order_size;
    let mut current_deviation = settings.price_deviation;

    let mut is_trailing = false;
    let mut highest_price = dec!(0);

    let mut day_start_equity = balance;
    let mut last_day = -1;
    let mut day_locked = false;

    let mut avg_price_history = vec![None; klines.len()];

    for (i, k) in klines.iter().enumerate() {
        // Daily Drawdown Logic
        let current_day = k.open_time / 86400000;
        if current_day != last_day {
            day_start_equity = balance + (position_size * k.close);
            last_day = current_day;
            day_locked = false;
        }

        if day_locked { continue; }

        if let Some(limit) = settings.daily_drawdown_limit {
            let current_equity = balance + (position_size * k.close);
            if (current_equity - day_start_equity) / day_start_equity < -limit {
                if position_size > dec!(0) {
                    let pnl = (k.close - average_price) * position_size;
                    balance += (position_size * average_price / Decimal::from(settings.leverage)) + pnl;
                    total_pnl += pnl;
                    trades.push(Trade {
                        side: "SELL (Drawdown Limit)".into(),
                        price: k.close,
                        time: k.open_time,
                        pnl: Some(pnl),
                    });
                    position_size = dec!(0);
                    average_price = dec!(0);
                }
                day_locked = true;
                continue;
            }
        }

        // 1. ENTRY LOGIC (Base Order)
        if position_size == dec!(0) {
            if balance >= settings.base_order_size {
                let buy_price = k.close;
                let units = (settings.base_order_size * Decimal::from(settings.leverage)) / buy_price;
                
                position_size = units;
                average_price = buy_price;
                balance -= settings.base_order_size;
                
                // Set initial SO target
                next_so_price = average_price * (dec!(1) - current_deviation);
                current_safety_orders = 0;
                current_so_size = settings.safety_order_size;
                current_deviation = settings.price_deviation;
                is_trailing = false;

                trades.push(Trade {
                    side: "BUY (Base)".into(),
                    price: buy_price,
                    time: k.open_time,
                    pnl: None,
                });
            }
        }
        // 2. SAFETY ORDER LOGIC
        else if !is_trailing && current_safety_orders < settings.max_safety_orders && k.low <= next_so_price {
            if balance >= current_so_size {
                let buy_price = next_so_price;
                let units = (current_so_size * Decimal::from(settings.leverage)) / buy_price;
                
                let total_cost = (average_price * position_size) + (buy_price * units);
                position_size += units;
                average_price = total_cost / position_size;
                balance -= current_so_size;
                
                current_safety_orders += 1;
                
                // Calculate next SO target
                current_deviation *= settings.step_scale;
                current_so_size *= settings.volume_scale;
                next_so_price = average_price * (dec!(1) - current_deviation);

                trades.push(Trade {
                    side: format!("BUY (SO #{})", current_safety_orders),
                    price: buy_price,
                    time: k.open_time,
                    pnl: None,
                });
            }
        }
        
        // 3. EXIT LOGIC (Take Profit & Trailing)
        if position_size > dec!(0) {
            let tp_price = average_price * (dec!(1) + settings.take_profit);
            
            if !is_trailing && k.high >= tp_price {
                if let Some(_trailing) = settings.trailing_stop {
                    is_trailing = true;
                    highest_price = k.high;
                } else {
                    // Normal TP
                    let sell_price = tp_price;
                    let pnl = (sell_price - average_price) * position_size;
                    balance += (position_size * average_price / Decimal::from(settings.leverage)) + pnl;
                    total_pnl += pnl;
                    
                    trades.push(Trade {
                        side: "SELL (TP)".into(),
                        price: sell_price,
                        time: k.open_time,
                        pnl: Some(pnl),
                    });
                    
                    position_size = dec!(0);
                    average_price = dec!(0);
                    current_safety_orders = 0;
                }
            } else if is_trailing {
                if k.high > highest_price {
                    highest_price = k.high;
                }
                
                let trailing_percent = settings.trailing_stop.unwrap_or(dec!(0.01));
                let stop_price = highest_price * (dec!(1) - trailing_percent);
                
                if k.low <= stop_price {
                    let sell_price = stop_price;
                    let pnl = (sell_price - average_price) * position_size;
                    balance += (position_size * average_price / Decimal::from(settings.leverage)) + pnl;
                    total_pnl += pnl;
                    
                    trades.push(Trade {
                        side: "SELL (Trailing TP)".into(),
                        price: sell_price,
                        time: k.open_time,
                        pnl: Some(pnl),
                    });
                    
                    position_size = dec!(0);
                    average_price = dec!(0);
                    current_safety_orders = 0;
                    is_trailing = false;
                }
            }
        }
        
        if position_size > dec!(0) {
            avg_price_history[i] = Some(average_price);
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
    indicator_data.insert("avg_price".to_string(), avg_price_history);

    BacktestResult {
        total_trades: trades.len(),
        win_rate,
        total_pnl,
        trades,
        indicator_data,
    }
}

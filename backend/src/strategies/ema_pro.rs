use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct EmaSettings {
    pub fast_period: usize,
    pub slow_period: usize,
    pub buy_amount: Decimal,
    pub daily_drawdown_limit: Option<Decimal>,
}

fn calculate_ema(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    if data.is_empty() { return vec![]; }
    let mut ema = vec![None; data.len()];
    let k = dec!(2) / (Decimal::from(period) + dec!(1));
    
    let mut current_ema = data[0];
    ema[0] = Some(current_ema);
    for i in 1..data.len() {
        current_ema = data[i] * k + current_ema * (dec!(1) - k);
        ema[i] = Some(current_ema);
    }
    ema
}

pub fn run_ema_cross_backtest(klines: &[Kline], settings: EmaSettings) -> BacktestResult {
    let closes: Vec<Decimal> = klines.iter().map(|k| k.close).collect();
    let fast_ema = calculate_ema(&closes, settings.fast_period);
    let slow_ema = calculate_ema(&closes, settings.slow_period);
    
    let mut balance = dec!(10000000); // Default 10jt
    let mut position_size = dec!(0);
    let mut entry_price = dec!(0);
    let mut trades = Vec::new();
    let mut total_pnl = dec!(0);

    let mut day_start_equity = balance;
    let mut last_day = -1;
    let mut day_locked = false;

    for i in 1..klines.len() {
        let k = &klines[i];
        
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
                    let pnl = (k.close - entry_price) * position_size;
                    balance += position_size * k.close;
                    total_pnl += pnl;
                    trades.push(Trade {
                        side: "SELL (Drawdown Limit)".into(),
                        price: k.close,
                        time: k.open_time,
                        pnl: Some(pnl),
                    });
                    position_size = dec!(0);
                }
                day_locked = true;
                continue;
            }
        }

        let f_ema = fast_ema[i].unwrap_or(dec!(0));
        let s_ema = slow_ema[i].unwrap_or(dec!(0));
        let prev_f_ema = fast_ema[i-1].unwrap_or(dec!(0));
        let prev_s_ema = slow_ema[i-1].unwrap_or(dec!(0));

        // Golden Cross (Fast crosses above Slow) -> BUY
        if position_size == dec!(0) && prev_f_ema <= prev_s_ema && f_ema > s_ema {
            if balance >= settings.buy_amount {
                entry_price = k.close;
                position_size = settings.buy_amount / entry_price;
                balance -= settings.buy_amount;
                
                trades.push(Trade {
                    side: "BUY".into(),
                    price: entry_price,
                    time: k.open_time,
                    pnl: None,
                });
            }
        }
        
        // Death Cross (Fast crosses below Slow) -> SELL
        if position_size > dec!(0) && prev_f_ema >= prev_s_ema && f_ema < s_ema {
            let sell_price = k.close;
            let revenue = position_size * sell_price;
            let pnl = revenue - settings.buy_amount;
            
            balance += revenue;
            total_pnl += pnl;
            
            trades.push(Trade {
                side: "SELL".into(),
                price: sell_price,
                time: k.open_time,
                pnl: Some(pnl),
            });
            
            position_size = dec!(0);
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
    indicator_data.insert("fast_ema".to_string(), fast_ema);
    indicator_data.insert("slow_ema".to_string(), slow_ema);

    BacktestResult {
        total_trades: trades.len(),
        win_rate,
        total_pnl,
        trades,
        indicator_data,
    }
}

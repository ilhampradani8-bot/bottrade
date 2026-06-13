use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use crate::strategies::indicators::IndicatorFilter;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Clone, TS, Default)]
#[ts(export, export_to = "../../frontend/src/types/TrailingSettings.ts")]
pub struct TrailingSettings {
    #[ts(type = "string")]
    pub buy_amount: Decimal,
    #[ts(type = "string")]
    pub trailing_percent: Decimal, // e.g., 0.01 for 1%
    pub rsi_period: usize,
    #[ts(type = "string")]
    pub rsi_buy_level: Decimal,
    #[ts(type = "string")]
    pub daily_drawdown_limit: Option<Decimal>,
}

fn calculate_rsi(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    if data.len() <= period { return vec![None; data.len()]; }
    let mut rsi = vec![None; data.len()];
    let mut gains = vec![dec!(0); data.len()];
    let mut losses = vec![dec!(0); data.len()];
    for i in 1..data.len() {
        let diff = data[i] - data[i-1];
        if diff > dec!(0) { gains[i] = diff; } else { losses[i] = diff.abs(); }
    }
    let mut avg_gain = gains[1..=period].iter().sum::<Decimal>() / Decimal::from(period);
    let mut avg_loss = losses[1..=period].iter().sum::<Decimal>() / Decimal::from(period);
    for i in period+1..data.len() {
        avg_gain = (avg_gain * Decimal::from(period - 1) + gains[i]) / Decimal::from(period);
        avg_loss = (avg_loss * Decimal::from(period - 1) + losses[i]) / Decimal::from(period);
        if avg_loss == dec!(0) { rsi[i] = Some(dec!(100)); }
        else { let rs = avg_gain / avg_loss; rsi[i] = Some(dec!(100) - (dec!(100) / (dec!(1) + rs))); }
    }
    rsi
}

pub fn run_trailing_backtest(klines: &[Kline], settings: TrailingSettings, filter: &IndicatorFilter) -> BacktestResult {
    let closes: Vec<Decimal> = klines.iter().map(|k| k.close).collect();
    let rsi_values = calculate_rsi(&closes, settings.rsi_period);

    let mut balance = dec!(10000000); // 10jt default
    let mut position_size = dec!(0);
    let mut highest_price = dec!(0);
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
                    let pnl = (k.close - (settings.buy_amount / position_size)) * position_size; // Rough estimate for PnL log
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

        let rsi = rsi_values[i].unwrap_or(dec!(50));

        // Entry: RSI Oversold
        if position_size == dec!(0) && rsi < settings.rsi_buy_level {
            if balance >= settings.buy_amount && filter.allows_buy(i) {
                let buy_price = k.close;
                position_size = settings.buy_amount / buy_price;
                balance -= settings.buy_amount;
                highest_price = buy_price;

                trades.push(Trade {
                    side: "BUY (Trailing Start)".into(),
                    price: buy_price,
                    time: k.open_time,
                    pnl: None,
                });
            }
        } 
        
        // Trailing Logic
        if position_size > dec!(0) {
            if k.high > highest_price {
                highest_price = k.high;
            }

            let stop_loss_price = highest_price * (dec!(1) - settings.trailing_percent);

            if k.low <= stop_loss_price {
                let sell_price = stop_loss_price;
                let revenue = position_size * sell_price;
                let pnl = revenue - settings.buy_amount;

                balance += revenue;
                total_pnl += pnl;

                trades.push(Trade {
                    side: "SELL (Trailing)".into(),
                    price: sell_price,
                    time: k.open_time,
                    pnl: Some(pnl),
                });

                position_size = dec!(0);
                highest_price = dec!(0);
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
    indicator_data.insert("rsi".to_string(), rsi_values);
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

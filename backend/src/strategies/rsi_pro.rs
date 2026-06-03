use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct RsiDcaSettings {
    pub rsi_period: usize,
    pub rsi_buy_level: Decimal,
    pub dca_drop_percent: Decimal,
    pub take_profit_percent: Decimal,
    pub buy_amount: Decimal,
    pub daily_drawdown_limit: Option<Decimal>,
}

fn calculate_rsi(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    if data.len() <= period { return vec![None; data.len()]; }
    let mut rsi = vec![None; data.len()];
    
    let mut gains = vec![dec!(0); data.len()];
    let mut losses = vec![dec!(0); data.len()];
    
    for i in 1..data.len() {
        let diff = data[i] - data[i-1];
        if diff > dec!(0) {
            gains[i] = diff;
        } else {
            losses[i] = diff.abs();
        }
    }
    
    let mut avg_gain = gains[1..=period].iter().sum::<Decimal>() / Decimal::from(period);
    let mut avg_loss = losses[1..=period].iter().sum::<Decimal>() / Decimal::from(period);
    
    for i in period+1..data.len() {
        avg_gain = (avg_gain * Decimal::from(period - 1) + gains[i]) / Decimal::from(period);
        avg_loss = (avg_loss * Decimal::from(period - 1) + losses[i]) / Decimal::from(period);
        
        if avg_loss == dec!(0) {
            rsi[i] = Some(dec!(100));
        } else {
            let rs = avg_gain / avg_loss;
            rsi[i] = Some(dec!(100) - (dec!(100) / (dec!(1) + rs)));
        }
    }
    rsi
}

pub fn run_rsi_dca_backtest(klines: &[Kline], settings: RsiDcaSettings) -> BacktestResult {
    let closes: Vec<Decimal> = klines.iter().map(|k| k.close).collect();
    let rsi_values = calculate_rsi(&closes, settings.rsi_period);
    
    let mut balance = dec!(10000000);
    let mut position_size = dec!(0);
    let mut average_price = dec!(0);
    let mut trades = Vec::new();
    let mut total_pnl = dec!(0);

    let mut day_start_equity = balance;
    let mut last_day = -1;
    let mut day_locked = false;

    for i in 1..klines.len() {
        let k = &klines[i];
        let rsi = rsi_values[i].unwrap_or(dec!(50));
        
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
                // Force Close
                if position_size > dec!(0) {
                    let pnl = (k.close - average_price) * position_size;
                    balance += position_size * k.close;
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

        // Entry Signal: RSI < Buy Level
        if position_size == dec!(0) && rsi < settings.rsi_buy_level {
            if balance >= settings.buy_amount {
                position_size = settings.buy_amount / k.close;
                average_price = k.close;
                balance -= settings.buy_amount;
                
                trades.push(Trade {
                    side: "BUY (Entry)".into(),
                    price: k.close,
                    time: k.open_time,
                    pnl: None,
                });
            }
        }
        
        // DCA Signal: Price drops by x%
        if position_size > dec!(0) && k.close < average_price * (dec!(1) - settings.dca_drop_percent) {
            if balance >= settings.buy_amount {
                let new_units = settings.buy_amount / k.close;
                let total_cost = (average_price * position_size) + settings.buy_amount;
                position_size += new_units;
                average_price = total_cost / position_size;
                balance -= settings.buy_amount;
                
                trades.push(Trade {
                    side: "BUY (DCA)".into(),
                    price: k.close,
                    time: k.open_time,
                    pnl: None,
                });
            }
        }
        
        // Take Profit
        if position_size > dec!(0) && k.close > average_price * (dec!(1) + settings.take_profit_percent) {
            let revenue = position_size * k.close;
            let pnl = revenue - (average_price * position_size);
            
            balance += revenue;
            total_pnl += pnl;
            
            trades.push(Trade {
                side: "SELL".into(),
                price: k.close,
                time: k.open_time,
                pnl: Some(pnl),
            });
            
            position_size = dec!(0);
            average_price = dec!(0);
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

    BacktestResult {
        total_trades: trades.len(),
        win_rate,
        total_pnl,
        trades,
        indicator_data,
    }
}

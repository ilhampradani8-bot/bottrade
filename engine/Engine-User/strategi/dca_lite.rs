use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use crate::strategies::indicators::IndicatorFilter;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub fn run_dca_backtest(klines: &[Kline], initial_capital: Decimal, filter: &IndicatorFilter) -> BacktestResult {
    let mut balance = initial_capital;
    let mut position_size = dec!(0);
    let mut average_price = dec!(0);
    let mut trades = Vec::new();
    let mut total_pnl = dec!(0);
    
    let buy_trigger_drop = dec!(0.98); // 2% drop
    let take_profit_target = dec!(1.015); // 1.5% profit
    let buy_amount = dec!(1000000); // 1jt per buy

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

        // Buy Logic — with indicator confirmation
        if position_size == dec!(0) || k.low < average_price * buy_trigger_drop {
            if balance >= buy_amount && filter.allows_buy(i) {
                let buy_price = k.low;
                let units = buy_amount / buy_price;
                
                let total_cost = (average_price * position_size) + buy_amount;
                position_size += units;
                average_price = total_cost / position_size;
                balance -= buy_amount;
                
                trades.push(Trade {
                    side: "BUY".into(),
                    price: buy_price,
                    time: k.open_time,
                    pnl: None,
                });
            }
        }
        
        // Sell Logic (Take Profit) — also sell if indicator says sell
        let should_tp = position_size > dec!(0) && k.high > average_price * take_profit_target;
        let indicator_sell = position_size > dec!(0) && filter.suggests_sell(i);
        
        if should_tp || indicator_sell {
            let sell_price = if should_tp { k.high } else { k.close };
            let revenue = position_size * sell_price;
            let pnl = revenue - (average_price * position_size);
            
            balance += revenue;
            total_pnl += pnl;
            
            trades.push(Trade {
                side: if indicator_sell && !should_tp { "SELL (Indicator)".into() } else { "SELL".into() },
                price: sell_price,
                time: k.open_time,
                pnl: Some(pnl),
            });
            
            position_size = dec!(0);
            average_price = dec!(0);
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
    // Merge indicator computed data
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

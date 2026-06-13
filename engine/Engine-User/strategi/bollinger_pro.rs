use crate::get_data::Kline;
use crate::strategies::{Trade, BacktestResult};
use crate::strategies::indicators::IndicatorFilter;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Clone, TS, Default)]
#[ts(export, export_to = "../../frontend/src/types/BollingerSettings.ts")]
pub struct BollingerSettings {
    pub length: usize,
    #[ts(type = "string")]
    pub std_dev: Decimal,
    #[ts(type = "string")]
    pub buy_amount: Decimal,
    #[ts(type = "string")]
    pub daily_drawdown_limit: Option<Decimal>,
}

pub fn run_bollinger_backtest(klines: &[Kline], settings: BollingerSettings, filter: &IndicatorFilter) -> BacktestResult {
    let mut balance = dec!(10000000);
    let mut position_size = dec!(0);
    let mut trades = Vec::new();
    let mut total_pnl = dec!(0);

    let mut upper_band_history = vec![None; klines.len()];
    let mut lower_band_history = vec![None; klines.len()];

    if klines.len() < settings.length {
        return BacktestResult { 
            total_trades: 0, 
            win_rate: dec!(0), 
            total_pnl: dec!(0), 
            trades: vec![],
            indicator_data: std::collections::HashMap::new(),
        };
    }

    let mut day_start_equity = balance;
    let mut last_day = -1;
    let mut day_locked = false;

    for i in settings.length..klines.len() {
        let k = &klines[i];
        
        // Daily Drawdown Logic
        let current_day = k.open_time / 86400000;
        if current_day != last_day {
            day_start_equity = balance + (position_size * k.close);
            last_day = current_day;
            day_locked = false;
        }

        if day_locked { continue; }

        let slice = &klines[i - settings.length..i];
        let closes: Vec<f64> = slice.iter().map(|k| k.close.to_f64().unwrap()).collect();
        
        let ma: f64 = closes.iter().sum::<f64>() / settings.length as f64;
        let variance: f64 = closes.iter().map(|c| (c - ma).powi(2)).sum::<f64>() / settings.length as f64;
        let std_dev = variance.sqrt();
        
        let upper_band = ma + (settings.std_dev.to_f64().unwrap() * std_dev);
        let lower_band = ma - (settings.std_dev.to_f64().unwrap() * std_dev);

        upper_band_history[i] = Some(Decimal::from_f64_retain(upper_band).unwrap_or(dec!(0)));
        lower_band_history[i] = Some(Decimal::from_f64_retain(lower_band).unwrap_or(dec!(0)));

        if let Some(limit) = settings.daily_drawdown_limit {
            let current_equity = balance + (position_size * k.close);
            if (current_equity - day_start_equity) / day_start_equity < -limit {
                if position_size > dec!(0) {
                    let pnl = (k.close - (settings.buy_amount / position_size)) * position_size;
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

        let current_price = klines[i].close.to_f64().unwrap();

        // Buy when price hits lower band
        if position_size == dec!(0) && current_price <= lower_band && filter.allows_buy(i) {
            let buy_price = klines[i].close;
            position_size = settings.buy_amount / buy_price;
            balance -= settings.buy_amount;

            trades.push(Trade {
                side: "BUY (BB Lower)".into(),
                price: buy_price,
                time: klines[i].open_time,
                pnl: None,
            });
        }
        // Sell when price hits upper band
        else if position_size > dec!(0) && current_price >= upper_band {
            let sell_price = klines[i].close;
            let revenue = position_size * sell_price;
            let pnl = revenue - settings.buy_amount;

            balance += revenue;
            total_pnl += pnl;

            trades.push(Trade {
                side: "SELL (BB Upper)".into(),
                price: sell_price,
                time: klines[i].open_time,
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
    indicator_data.insert("upper_band".into(), upper_band_history);
    indicator_data.insert("lower_band".into(), lower_band_history);
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

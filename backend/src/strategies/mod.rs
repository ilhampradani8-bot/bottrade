pub mod dca_lite;
pub mod dca_pro;
pub mod grid_lite;
pub mod combo_lite;
pub mod trailing_lite;
pub mod bollinger_pro;
pub mod ema_pro;
pub mod rsi_pro;

use crate::get_data::Kline;
use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Clone, TS, Default)]
#[ts(export, export_to = "../../frontend/src/types/Trade.ts")]
pub struct Trade {
    pub side: String, // "BUY" or "SELL"
    #[ts(type = "string")]
    pub price: Decimal,
    pub time: i64,
    #[ts(type = "string")]
    pub pnl: Option<Decimal>,
}

#[derive(Debug, Serialize, TS, Default)]
#[ts(export, export_to = "../../frontend/src/types/BacktestResult.ts")]
pub struct BacktestResult {
    pub total_trades: usize,
    #[ts(type = "string")]
    pub win_rate: Decimal,
    #[ts(type = "string")]
    pub total_pnl: Decimal,
    pub trades: Vec<Trade>,
    #[ts(type = "Record<string, (string | null)[]>")]
    pub indicator_data: std::collections::HashMap<String, Vec<Option<Decimal>>>,
}

use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use reqwest;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Kline {
    pub open_time: i64,
    pub open: Decimal,
    pub high: Decimal,
    pub low: Decimal,
    pub close: Decimal,
    pub volume: Decimal,
}

#[derive(sqlx::FromRow)]
pub struct KlineRow {
    pub open_time: i64,
    pub open: Decimal,
    pub high: Decimal,
    pub low: Decimal,
    pub close: Decimal,
    pub volume: Decimal,
}

impl From<KlineRow> for Kline {
    fn from(row: KlineRow) -> Self {
        Self {
            open_time: row.open_time,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
        }
    }
}

pub async fn fetch_binance_klines(
    symbol: &str, 
    interval: &str, 
    start_time: Option<i64>, 
    end_time: Option<i64>
) -> Result<Vec<Kline>, reqwest::Error> {
    let mut url = format!(
        "https://api.binance.com/api/v3/klines?symbol={}&interval={}&limit=1000",
        symbol.replace("/", ""), interval
    );
    
    if let Some(start) = start_time {
        url.push_str(&format!("&startTime={}", start));
    }
    if let Some(end) = end_time {
        url.push_str(&format!("&endTime={}", end));
    }
    
    let res = reqwest::get(url).await?.json::<Vec<Vec<serde_json::Value>>>().await?;
    
    let klines = res.into_iter().map(|item| {
        Kline {
            open_time: item[0].as_i64().unwrap_or(0),
            open: item[1].as_str().unwrap_or("0").parse().unwrap_or(Decimal::ZERO),
            high: item[2].as_str().unwrap_or("0").parse().unwrap_or(Decimal::ZERO),
            low: item[3].as_str().unwrap_or("0").parse().unwrap_or(Decimal::ZERO),
            close: item[4].as_str().unwrap_or("0").parse().unwrap_or(Decimal::ZERO),
            volume: item[5].as_str().unwrap_or("0").parse().unwrap_or(Decimal::ZERO),
        }
    }).collect();
    
    Ok(klines)
}

pub async fn save_klines_to_db(pool: &PgPool, symbol: &str, interval: &str, klines: Vec<Kline>) -> Result<u32, sqlx::Error> {
    let mut count = 0;
    for k in klines {
        let result = sqlx::query(
            "INSERT INTO market_data (symbol, interval, open_time, open, high, low, close, volume) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) \
             ON CONFLICT (symbol, interval, open_time) DO NOTHING"
        )
        .bind(symbol)
        .bind(interval)
        .bind(k.open_time)
        .bind(k.open)
        .bind(k.high)
        .bind(k.low)
        .bind(k.close)
        .bind(k.volume)
        .execute(pool)
        .await?;
        
        if result.rows_affected() > 0 {
            count += 1;
        }
    }
    Ok(count)
}

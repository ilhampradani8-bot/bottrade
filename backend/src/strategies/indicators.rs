use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal_macros::dec;
use serde::Deserialize;
use crate::get_data::Kline;

/// Represents a single indicator selected by the user from the frontend.
#[derive(Debug, Clone, Deserialize)]
pub struct SelectedIndicator {
    pub id: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

/// The combined signal from all selected indicators.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum IndicatorSignal {
    Buy,
    Sell,
    Neutral,
}

/// Pre-computed indicator signals for every candle in the dataset.
pub struct IndicatorFilter {
    pub signals: Vec<IndicatorSignal>,
    pub computed_data: std::collections::HashMap<String, Vec<Option<Decimal>>>,
}

impl IndicatorFilter {
    /// Build a no-op filter (always neutral) when no indicators are selected.
    pub fn neutral(len: usize) -> Self {
        Self {
            signals: vec![IndicatorSignal::Neutral; len],
            computed_data: std::collections::HashMap::new(),
        }
    }

    /// Build the filter from selected indicators + kline data.
    pub fn build(klines: &[Kline], indicators: &[SelectedIndicator]) -> Self {
        if indicators.is_empty() || klines.is_empty() {
            return Self::neutral(klines.len());
        }

        let closes: Vec<Decimal> = klines.iter().map(|k| k.close).collect();
        let highs: Vec<Decimal> = klines.iter().map(|k| k.high).collect();
        let lows: Vec<Decimal> = klines.iter().map(|k| k.low).collect();
        let volumes: Vec<Decimal> = klines.iter().map(|k| k.volume).collect();
        let len = klines.len();

        let mut all_buy_votes: Vec<i32> = vec![0; len];
        let mut all_sell_votes: Vec<i32> = vec![0; len];
        let mut computed_data = std::collections::HashMap::new();

        for ind in indicators {
            match ind.id.as_str() {
                "rsi" => {
                    let period = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(14) as usize;
                    let rsi = calculate_rsi(&closes, period);
                    for i in 0..len {
                        if let Some(val) = rsi[i] {
                            if val < dec!(30) { all_buy_votes[i] += 1; }
                            else if val > dec!(70) { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("rsi".to_string(), rsi);
                },
                "macd" => {
                    let fast = ind.params.get("fast").and_then(|v| v.as_u64()).unwrap_or(12) as usize;
                    let slow = ind.params.get("slow").and_then(|v| v.as_u64()).unwrap_or(26) as usize;
                    let signal_p = ind.params.get("signal").and_then(|v| v.as_u64()).unwrap_or(9) as usize;
                    let (macd_line, signal_line) = calculate_macd(&closes, fast, slow, signal_p);
                    for i in 1..len {
                        if let (Some(m), Some(s), Some(pm), Some(ps)) = (macd_line[i], signal_line[i], macd_line[i-1], signal_line[i-1]) {
                            if pm <= ps && m > s { all_buy_votes[i] += 1; }
                            else if pm >= ps && m < s { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("macd".to_string(), macd_line);
                    computed_data.insert("macd_signal".to_string(), signal_line);
                },
                "bbands" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(20) as usize;
                    let std_mult = ind.params.get("std").and_then(|v| v.as_f64()).unwrap_or(2.0);
                    let (upper, lower) = calculate_bollinger(&closes, length, std_mult);
                    for i in 0..len {
                        if let (Some(lb), Some(ub)) = (lower[i], upper[i]) {
                            if closes[i] <= lb { all_buy_votes[i] += 1; }
                            else if closes[i] >= ub { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("bb_upper".to_string(), upper);
                    computed_data.insert("bb_lower".to_string(), lower);
                },
                "ema" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(20) as usize;
                    let ema = calculate_ema(&closes, length);
                    for i in 1..len {
                        if let (Some(e), Some(pe)) = (ema[i], ema[i-1]) {
                            // Price crosses above EMA = buy, below = sell
                            if closes[i-1] <= pe && closes[i] > e { all_buy_votes[i] += 1; }
                            else if closes[i-1] >= pe && closes[i] < e { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("ema".to_string(), ema);
                },
                "sma" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(20) as usize;
                    let sma = calculate_sma(&closes, length);
                    for i in 1..len {
                        if let (Some(s), Some(ps)) = (sma[i], sma[i-1]) {
                            if closes[i-1] <= ps && closes[i] > s { all_buy_votes[i] += 1; }
                            else if closes[i-1] >= ps && closes[i] < s { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("sma".to_string(), sma);
                },
                "stoch" => {
                    let k_period = ind.params.get("k").and_then(|v| v.as_u64()).unwrap_or(14) as usize;
                    let stoch_k = calculate_stochastic(&closes, &highs, &lows, k_period);
                    for i in 0..len {
                        if let Some(val) = stoch_k[i] {
                            if val < dec!(20) { all_buy_votes[i] += 1; }
                            else if val > dec!(80) { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("stoch_k".to_string(), stoch_k);
                },
                "adx" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(14) as usize;
                    let adx = calculate_adx(&highs, &lows, &closes, length);
                    // ADX > 25 means strong trend; we use it as a filter amplifier
                    // If trend is strong, existing votes count more (we add a neutral amplifier)
                    for i in 0..len {
                        if let Some(val) = adx[i] {
                            if val > dec!(25) {
                                // Strong trend confirmed — amplify existing signals
                                if all_buy_votes[i] > 0 { all_buy_votes[i] += 1; }
                                if all_sell_votes[i] > 0 { all_sell_votes[i] += 1; }
                            }
                        }
                    }
                    computed_data.insert("adx".to_string(), adx);
                },
                "cci" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(20) as usize;
                    let cci = calculate_cci(&highs, &lows, &closes, length);
                    for i in 0..len {
                        if let Some(val) = cci[i] {
                            if val < dec!(-100) { all_buy_votes[i] += 1; }
                            else if val > dec!(100) { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("cci".to_string(), cci);
                },
                "mfi" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(14) as usize;
                    let mfi = calculate_mfi(&highs, &lows, &closes, &volumes, length);
                    for i in 0..len {
                        if let Some(val) = mfi[i] {
                            if val < dec!(20) { all_buy_votes[i] += 1; }
                            else if val > dec!(80) { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("mfi".to_string(), mfi);
                },
                "atr" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(14) as usize;
                    let atr = calculate_atr(&highs, &lows, &closes, length);
                    // ATR is volatility — doesn't produce buy/sell directly, but we store it
                    computed_data.insert("atr".to_string(), atr);
                },
                "supertrend" => {
                    let period = ind.params.get("period").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
                    let multiplier = ind.params.get("multiplier").and_then(|v| v.as_f64()).unwrap_or(3.0);
                    let st_signals = calculate_supertrend(&highs, &lows, &closes, period, multiplier);
                    for i in 1..len {
                        if st_signals[i-1] != IndicatorSignal::Buy && st_signals[i] == IndicatorSignal::Buy {
                            all_buy_votes[i] += 1;
                        } else if st_signals[i-1] != IndicatorSignal::Sell && st_signals[i] == IndicatorSignal::Sell {
                            all_sell_votes[i] += 1;
                        }
                    }
                },
                "willr" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(14) as usize;
                    let willr = calculate_williams_r(&highs, &lows, &closes, length);
                    for i in 0..len {
                        if let Some(val) = willr[i] {
                            if val < dec!(-80) { all_buy_votes[i] += 1; }
                            else if val > dec!(-20) { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert("willr".to_string(), willr);
                },
                "mom" | "roc" => {
                    let length = ind.params.get("length").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
                    let mom = calculate_momentum(&closes, length);
                    for i in 1..len {
                        if let (Some(prev), Some(cur)) = (mom[i-1], mom[i]) {
                            if prev <= dec!(0) && cur > dec!(0) { all_buy_votes[i] += 1; }
                            else if prev >= dec!(0) && cur < dec!(0) { all_sell_votes[i] += 1; }
                        }
                    }
                    computed_data.insert(ind.id.clone(), mom);
                },
                // For indicators that are primarily overlays or don't produce direct signals,
                // we store them but don't generate votes (obv, vwap, wma, dema, tema, t3, kama, etc.)
                _ => {
                    // Unsupported indicator — skip silently
                }
            }
        }

        // Combine votes into final signals
        let signals: Vec<IndicatorSignal> = (0..len).map(|i| {
            if all_buy_votes[i] > 0 && all_buy_votes[i] > all_sell_votes[i] {
                IndicatorSignal::Buy
            } else if all_sell_votes[i] > 0 && all_sell_votes[i] > all_buy_votes[i] {
                IndicatorSignal::Sell
            } else {
                IndicatorSignal::Neutral
            }
        }).collect();

        Self { signals, computed_data }
    }

    /// Check if the filter allows a BUY at index i.
    /// Returns true if signal is Buy or Neutral (so strategies still work without indicators).
    pub fn allows_buy(&self, i: usize) -> bool {
        matches!(self.signals.get(i), Some(IndicatorSignal::Buy) | Some(IndicatorSignal::Neutral))
    }

    /// Check if the filter suggests a SELL at index i.
    pub fn suggests_sell(&self, i: usize) -> bool {
        matches!(self.signals.get(i), Some(IndicatorSignal::Sell))
    }

    /// Returns true only when signal is explicitly Buy.
    pub fn is_buy_signal(&self, i: usize) -> bool {
        matches!(self.signals.get(i), Some(IndicatorSignal::Buy))
    }
}

// ============================================================================
// INDICATOR CALCULATION FUNCTIONS
// ============================================================================

pub fn calculate_rsi(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
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

pub fn calculate_ema(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    if data.is_empty() || period == 0 { return vec![]; }
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

pub fn calculate_sma(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    if data.is_empty() || period == 0 { return vec![]; }
    let mut sma = vec![None; data.len()];
    for i in (period-1)..data.len() {
        let sum: Decimal = data[i+1-period..=i].iter().sum();
        sma[i] = Some(sum / Decimal::from(period));
    }
    sma
}

fn calculate_macd(data: &[Decimal], fast: usize, slow: usize, signal: usize) -> (Vec<Option<Decimal>>, Vec<Option<Decimal>>) {
    let fast_ema = calculate_ema(data, fast);
    let slow_ema = calculate_ema(data, slow);
    let len = data.len();
    let mut macd_line = vec![None; len];
    let mut macd_values = Vec::new();
    for i in 0..len {
        if let (Some(f), Some(s)) = (fast_ema[i], slow_ema[i]) {
            let val = f - s;
            macd_line[i] = Some(val);
            macd_values.push(val);
        } else {
            macd_values.push(dec!(0));
        }
    }
    let signal_ema = calculate_ema(&macd_values, signal);
    (macd_line, signal_ema)
}

fn calculate_bollinger(data: &[Decimal], period: usize, std_mult: f64) -> (Vec<Option<Decimal>>, Vec<Option<Decimal>>) {
    let len = data.len();
    let mut upper = vec![None; len];
    let mut lower = vec![None; len];
    if len < period { return (upper, lower); }
    for i in (period-1)..len {
        let slice = &data[i+1-period..=i];
        let closes_f64: Vec<f64> = slice.iter().map(|c| c.to_f64().unwrap_or(0.0)).collect();
        let ma: f64 = closes_f64.iter().sum::<f64>() / period as f64;
        let variance: f64 = closes_f64.iter().map(|c| (c - ma).powi(2)).sum::<f64>() / period as f64;
        let std_dev = variance.sqrt();
        upper[i] = Decimal::from_f64_retain(ma + std_mult * std_dev);
        lower[i] = Decimal::from_f64_retain(ma - std_mult * std_dev);
    }
    (upper, lower)
}

fn calculate_stochastic(closes: &[Decimal], highs: &[Decimal], lows: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = closes.len();
    let mut stoch = vec![None; len];
    if len < period { return stoch; }
    for i in (period-1)..len {
        let highest = highs[i+1-period..=i].iter().max().copied().unwrap_or(dec!(0));
        let lowest = lows[i+1-period..=i].iter().min().copied().unwrap_or(dec!(0));
        if highest != lowest {
            stoch[i] = Some((closes[i] - lowest) / (highest - lowest) * dec!(100));
        }
    }
    stoch
}

fn calculate_adx(highs: &[Decimal], lows: &[Decimal], closes: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = closes.len();
    let mut adx = vec![None; len];
    if len < period + 1 { return adx; }

    let mut plus_dm = vec![dec!(0); len];
    let mut minus_dm = vec![dec!(0); len];
    let mut tr = vec![dec!(0); len];

    for i in 1..len {
        let up_move = highs[i] - highs[i-1];
        let down_move = lows[i-1] - lows[i];
        if up_move > down_move && up_move > dec!(0) { plus_dm[i] = up_move; }
        if down_move > up_move && down_move > dec!(0) { minus_dm[i] = down_move; }
        let hl = highs[i] - lows[i];
        let hc = (highs[i] - closes[i-1]).abs();
        let lc = (lows[i] - closes[i-1]).abs();
        tr[i] = hl.max(hc).max(lc);
    }

    // Smoothed averages using Wilder's smoothing
    let p = Decimal::from(period);
    let mut atr_smooth = tr[1..=period].iter().sum::<Decimal>();
    let mut plus_dm_smooth = plus_dm[1..=period].iter().sum::<Decimal>();
    let mut minus_dm_smooth = minus_dm[1..=period].iter().sum::<Decimal>();

    let mut dx_values = Vec::new();
    for i in period..len {
        if i > period {
            atr_smooth = atr_smooth - atr_smooth / p + tr[i];
            plus_dm_smooth = plus_dm_smooth - plus_dm_smooth / p + plus_dm[i];
            minus_dm_smooth = minus_dm_smooth - minus_dm_smooth / p + minus_dm[i];
        }
        if atr_smooth == dec!(0) { dx_values.push(dec!(0)); continue; }
        let plus_di = plus_dm_smooth / atr_smooth * dec!(100);
        let minus_di = minus_dm_smooth / atr_smooth * dec!(100);
        let di_sum = plus_di + minus_di;
        let dx = if di_sum > dec!(0) { (plus_di - minus_di).abs() / di_sum * dec!(100) } else { dec!(0) };
        dx_values.push(dx);
    }

    // ADX = smoothed DX
    if dx_values.len() >= period {
        let mut adx_val = dx_values[..period].iter().sum::<Decimal>() / p;
        adx[period * 2 - 1] = Some(adx_val);
        for j in period..dx_values.len() {
            adx_val = (adx_val * (p - dec!(1)) + dx_values[j]) / p;
            let idx = period + j;
            if idx < len { adx[idx] = Some(adx_val); }
        }
    }
    adx
}

fn calculate_cci(highs: &[Decimal], lows: &[Decimal], closes: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = closes.len();
    let mut cci = vec![None; len];
    if len < period { return cci; }
    let tp: Vec<Decimal> = (0..len).map(|i| (highs[i] + lows[i] + closes[i]) / dec!(3)).collect();
    for i in (period-1)..len {
        let slice = &tp[i+1-period..=i];
        let mean: Decimal = slice.iter().sum::<Decimal>() / Decimal::from(period);
        let mean_dev: Decimal = slice.iter().map(|v| (*v - mean).abs()).sum::<Decimal>() / Decimal::from(period);
        if mean_dev != dec!(0) {
            cci[i] = Some((tp[i] - mean) / (dec!(0.015) * mean_dev));
        }
    }
    cci
}

fn calculate_mfi(highs: &[Decimal], lows: &[Decimal], closes: &[Decimal], volumes: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = closes.len();
    let mut mfi = vec![None; len];
    if len < period + 1 { return mfi; }
    let tp: Vec<Decimal> = (0..len).map(|i| (highs[i] + lows[i] + closes[i]) / dec!(3)).collect();
    let raw_mf: Vec<Decimal> = (0..len).map(|i| tp[i] * volumes[i]).collect();
    for i in period..len {
        let mut pos_flow = dec!(0);
        let mut neg_flow = dec!(0);
        for j in (i+1-period)..=i {
            if j > 0 {
                if tp[j] > tp[j-1] { pos_flow += raw_mf[j]; }
                else { neg_flow += raw_mf[j]; }
            }
        }
        if neg_flow != dec!(0) {
            let ratio = pos_flow / neg_flow;
            mfi[i] = Some(dec!(100) - (dec!(100) / (dec!(1) + ratio)));
        } else {
            mfi[i] = Some(dec!(100));
        }
    }
    mfi
}

fn calculate_atr(highs: &[Decimal], lows: &[Decimal], closes: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = closes.len();
    let mut atr = vec![None; len];
    if len < period + 1 { return atr; }
    let mut tr = vec![dec!(0); len];
    for i in 1..len {
        let hl = highs[i] - lows[i];
        let hc = (highs[i] - closes[i-1]).abs();
        let lc = (lows[i] - closes[i-1]).abs();
        tr[i] = hl.max(hc).max(lc);
    }
    let mut atr_val = tr[1..=period].iter().sum::<Decimal>() / Decimal::from(period);
    atr[period] = Some(atr_val);
    let p = Decimal::from(period);
    for i in (period+1)..len {
        atr_val = (atr_val * (p - dec!(1)) + tr[i]) / p;
        atr[i] = Some(atr_val);
    }
    atr
}

fn calculate_supertrend(highs: &[Decimal], lows: &[Decimal], closes: &[Decimal], period: usize, multiplier: f64) -> Vec<IndicatorSignal> {
    let len = closes.len();
    let mut signals = vec![IndicatorSignal::Neutral; len];
    let atr = calculate_atr(highs, lows, closes, period);
    let mult = Decimal::from_f64_retain(multiplier).unwrap_or(dec!(3));

    let mut upper_band = vec![dec!(0); len];
    let mut lower_band = vec![dec!(0); len];
    let mut in_uptrend = true;

    for i in period..len {
        let atr_val = atr[i].unwrap_or(dec!(0));
        let mid = (highs[i] + lows[i]) / dec!(2);
        let basic_upper = mid + mult * atr_val;
        let basic_lower = mid - mult * atr_val;

        upper_band[i] = if i > period && basic_upper < upper_band[i-1] || closes[i-1] > upper_band[i-1] {
            basic_upper
        } else {
            upper_band[i-1]
        };
        lower_band[i] = if i > period && basic_lower > lower_band[i-1] || closes[i-1] < lower_band[i-1] {
            basic_lower
        } else {
            lower_band[i-1]
        };

        if closes[i] > upper_band[i] { in_uptrend = true; }
        else if closes[i] < lower_band[i] { in_uptrend = false; }

        signals[i] = if in_uptrend { IndicatorSignal::Buy } else { IndicatorSignal::Sell };
    }
    signals
}

fn calculate_williams_r(highs: &[Decimal], lows: &[Decimal], closes: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = closes.len();
    let mut willr = vec![None; len];
    if len < period { return willr; }
    for i in (period-1)..len {
        let highest = highs[i+1-period..=i].iter().max().copied().unwrap_or(dec!(0));
        let lowest = lows[i+1-period..=i].iter().min().copied().unwrap_or(dec!(0));
        if highest != lowest {
            willr[i] = Some((highest - closes[i]) / (highest - lowest) * dec!(-100));
        }
    }
    willr
}

fn calculate_momentum(data: &[Decimal], period: usize) -> Vec<Option<Decimal>> {
    let len = data.len();
    let mut mom = vec![None; len];
    for i in period..len {
        mom[i] = Some(data[i] - data[i - period]);
    }
    mom
}

# 📈 Daftar Indikator Teknikal (TA-Lib & Pandas-TA)

Dokumen ini berisi daftar indikator yang tersedia di sistem Backend untuk digunakan oleh Frontend.

---

## 🛠️ Cara Pemanggilan dari Frontend
Frontend tidak memanggil library ini secara langsung. Alurnya adalah:
1.  Frontend mengirimkan ID Indikator (misal: `rsi`) dan parameternya (misal: `length: 14`) dalam request backtest.
2.  Backend (Rust) memanggil Python Engine untuk menghitung nilai indikator tersebut.
3.  Backend menggunakan hasil perhitungan untuk eksekusi strategi.

---

## 🏆 Indikator Populer (Rekomendasi untuk UI)

| Nama Indikator | ID (Pandas-TA) | Kategori | Parameter Umum |
| :--- | :--- | :--- | :--- |
| **Relative Strength Index** | `rsi` | Momentum | `length` (14) |
| **MACD** | `macd` | Momentum | `fast` (12), `slow` (26), `signal` (9) |
| **Bollinger Bands** | `bbands` | Volatility | `length` (20), `std` (2) |
| **Exponential Moving Average**| `ema` | Overlap | `length` (10, 20, 50, 200) |
| **Simple Moving Average** | `sma` | Overlap | `length` (10, 20, 50, 200) |
| **Stochastic Oscillator** | `stoch` | Momentum | `k` (14), `d` (3) |
| **Supertrend** | `supertrend` | Trend | `period` (10), `multiplier` (3) |
| **ATR (Average True Range)** | `atr` | Volatility | `length` (14) |

---

## 📚 Daftar Lengkap (Pandas-TA)
Berikut adalah daftar singkat dari 130+ indikator yang didukung:

`accbands`, `ad`, `adosc`, `adx`, `alma`, `amat`, `ao`, `aobv`, `apo`, `aroon`, `atr`, `bbands`, `bop`, `cci`, `cfo`, `cg`, `choppiness`, `cksp`, `cmf`, `cmo`, `coppock`, `cti`, `decay`, `dema`, `dm`, `donchian`, `dpo`, `ebsw`, `efi`, `ema`, `entropy`, `eom`, `er`, `eri`, `fisher`, `fwma`, `ha`, `hilo`, `hl2`, `hlc3`, `hma`, `hwma`, `ichimoku`, `inertia`, `kama`, `kc`, `kvo`, `linreg`, `log_return`, `long_run`, `macd`, `mad`, `massi`, `mcgd`, `medprice`, `mfi`, `midpoint`, `midprice`, `mom`, `natr`, `nvi`, `obv`, `ohlc4`, `pdist`, `percent_return`, `pgo`, `ppo`, `psar`, `pvi`, `pvo`, `pvol`, `pvr`, `pvt`, `pwma`, `qqe`, `qstick`, `quantile`, `rma`, `roc`, `rsi`, `rsx`, `rvgi`, `rvi`, `short_run`, `sinwma`, `sma`, `smma`, `stdev`, `stoch`, `stochrsi`, `supertrend`, `swma`, `t3`, `td_seq`, `tema`, `thermo`, `tos_stdevall`, `trima`, `trix`, `true_range`, `tsi`, `tsignals`, `ttm_trend`, `ui`, `uo`, `variance`, `vhf`, `vidya`, `vortex`, `vp`, `vwap`, `vwma`, `wcp`, `willr`, `wma`, `zlma`, `zscore`.

---

## 🏛️ Daftar Lengkap (TA-Lib)
TA-Lib menyediakan fungsi performa tinggi untuk:
- **Pattern Recognition**: `CDL2CROWS`, `CDL3BLACKCROWS`, `CDLHAMMER`, dll (60+ pola candlestick).
- **Math Transform**: `ACOS`, `ASIN`, `ATAN`, `CEIL`, `COS`, dll.
- **Statistic Functions**: `BETA`, `CORREL`, `LINEARREG`, `STDDEV`, `TSF`, dll.

---

### 💡 Tips untuk Frontend
Gunakan daftar di atas untuk membuat **Searchable Dropdown** di bagian "Indicator Settings" pada UI Strategy Creator.

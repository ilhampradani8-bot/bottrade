# 🦀 Rust Backend Architecture - Strategy Engine

Dokumen ini menjelaskan arsitektur strategi pada project BotTrade. Semua strategi telah dipindahkan ke struktur folder datar (flat) untuk menyederhanakan pemanggilan modul.

---

## 🏗️ Struktur Folder Strategi
Lokasi: `backend/src/strategies/`

| File | Nama Strategi | Level | Fitur Utama |
| :--- | :--- | :--- | :--- |
| `dca_lite.rs` | DCA Standard | Lite | Martingale sederhana |
| `dca_pro.rs` | DCA Professional | Pro | Safety Orders, Leverage, Trailing TP |
| `grid_lite.rs` | Spot Grid | Lite | Buy low sell high otomatis |
| `combo_lite.rs` | Combo DCA/Grid | Lite | Gabungan DCA dan TP Dinamis |
| `trailing_lite.rs` | Trailing Stop | Lite | Pengejaran harga tertinggi |
| `bollinger_pro.rs` | BB Momentum | Pro | Entry via Bollinger Bands |
| `ema_pro.rs` | EMA Cross | Pro | Golden Cross / Death Cross |
| `rsi_pro.rs` | RSI Momentum | Pro | Oversold Buy / Overbought Sell |

---

## ⚡ Fitur Utama Engine (High Performance)

### 1. Data Precission (Decimal)
Kita menggunakan crate `rust_decimal` untuk semua kalkulasi finansial.
- **Mengapa?**: Menghindari error pembulatan yang biasa terjadi pada tipe data `f64`.
- **Presisi**: Mendukung hingga 28 angka di belakang koma.

### 2. Type Safety (TS-RS)
Setiap struct `Settings` di Rust menggunakan dekorator `#[derive(TS)]`.
- **Hasil**: File TypeScript di `frontend/src/types/` akan otomatis terupdate setiap kali backend di-compile.
- **Manfaat**: Frontend dan Backend selalu sinkron soal nama field dan tipe data.

### 3. Logic: DCA Pro + Trailing Stop
Strategi `dca_pro.rs` sekarang mendukung fitur **Trailing Take Profit**.
- **Alur**: Jika harga menyentuh target Profit, bot tidak langsung jual, tapi mengaktifkan mode *Trailing*. Jual hanya akan dilakukan jika harga turun sebanyak x% dari titik tertinggi setelah target TP tercapai.

---

## 🔄 Alur Eksekusi Backtest
1. **Request**: Frontend mengirim `BacktestRequest` berisi `strategy_id`, `pair`, `interval`, dan `settings`.
2. **Query**: Rust mengambil data `market_data` yang difilter berdasarkan `symbol` DAN `interval`.
3. **Loop**: Engine melakukan iterasi per kline untuk mensimulasikan transaksi riil.
4. **Response**: Mengembalikan `BacktestResult` (Total PnL, Win Rate, List Transaksi).

---
*Last Updated: 2026-05-10 | Managed by Antigravity AI*

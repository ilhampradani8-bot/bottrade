# 📘 Dokumentasi Backend API - BotTrade Engine

Dokumentasi ini ditujukan untuk tim Frontend agar dapat berinteraksi dengan Rust Backend Engine (port 8080).

---

## 🚀 Informasi Dasar
- **Base URL**: `http://139.59.122.230:8080/api`
- **Format Data**: JSON
- **Engine**: Rust (Axum Framework)
- **Database**: PostgreSQL (SQLx)

---

## 🔐 1. Authentication (Auth Hub)
Menggunakan JWT untuk sesi pengguna. Header `Authorization: Bearer <token>` diperlukan untuk endpoint yang diproteksi.

### Register
`POST /auth/register`
- **Payload**: `{ "username": "...", "email": "...", "password": "..." }`
- **Response**: User object & success message.

### Login
`POST /auth/login`
- **Payload**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "token": "JWT_TOKEN_HERE" }`
+
+### User Profile
+`GET /auth/profile`
+- **Header**: `Authorization: Bearer <token>`
+- **Response**: `{ "id": 1, "email": "...", "username": "..." }`

---

## 📊 2. Market Data & Sync
Mengelola data kline/candlestick untuk simulasi dan trading.

### Cek Data Tersedia
`GET /available-data`
- **Deskripsi**: Mengambil daftar koin dan rentang waktu yang sudah ada di database.
- **Response**: `[ { "symbol": "BTCUSDT", "interval": "1m", "min_time": 1700000000, "max_time": 1700000000 } ]`

### Sinkronisasi Data dari Binance
`POST /sync-data`
- **Payload**: 
  ```json
  {
    "symbol": "BTCUSDT",
    "interval": "1m",
    "start_time": 1700000000, 
    "end_time": null
  }
  ```
- **Response**: Jumlah data yang berhasil di-sync.
+
+---
+
+## 📊 2b. Dashboard (NEW)
+Endpoint agregator untuk halaman Overview.
+
+### Get Overview Data
+`GET /api/overview`
+- **Header**: `Authorization: Bearer <token>`
+- **Response**:
+  ```json
+  {
+    "total_capital": 25000000.0,
+    "active_bots": 5,
+    "inactive_bots": 2,
+    "connected_accounts": [
+      { "platform": "Indodax", "label": "Akun Utama", "nominal": 10000000.0 }
+    ],
+    "performance_history": [
+      { "date": "2026-05-01", "equity": 24000000.0 }
+    ]
+  }
+  ```

---

## 🤖 3. Strategies & Backtesting
Pusat riset strategi trading.

### List Strategi
`GET /strategies`
- **Response**: Daftar ID strategi yang tersedia (`dca_lite`, `dca_pro`, `grid_lite`, `trailing_lite`, dll).

### Jalankan Backtest
`POST /backtest`
- **Payload**:
  ```json
  {
    "strategy_id": "dca_lite",
    "pair": "BTC/USDT",
    "interval": "1h",
    "modal": 10000000,
    "start_time": 1700000000,
    "end_time": 1700100000
  }
  ```
- **Response**: Detail transaksi, Win Rate, dan Total PnL.
+
+### Save User Strategy
+`POST /strategies/save`
+- **Header**: `Authorization: Bearer <token>`
+- **Payload**:
+  ```json
+  {
+    "name": "DCA BTC 2026",
+    "bot_type": "dca",
+    "pair": "BTCUSDT",
+    "settings": { ...config }
+  }
+  ```

---

## 💳 4. API Keys (Vault)
Penyimpanan kunci bursa (Exchange) secara aman.

### Simpan API Key
`POST /api-keys`
- **Payload**: `{ "exchange": "binance", "api_key": "...", "secret": "..." }`

---

## ⚡ 5. Real Trading Execution (NEW)
Endpoint untuk eksekusi langsung ke bursa menggunakan CCXT atau OpenLimit.

### Eksekusi Trade (Buy/Sell)
`POST /trade/execute`
- **Payload**:
  ```json
  {
    "provider": "ccxt",
    "exchange_id": "binance",
    "api_key": "...",
    "secret": "...",
    "symbol": "BTC/USDT",
    "side": "buy",
    "amount": 0.01,
    "price": null 
  }
  ```
- **Catatan**: Set `price` ke `null` untuk **Market Order**.

---

### Get Available Indicators
`GET /api/indicators`
- **Deskripsi**: Mengambil daftar indikator teknikal yang didukung oleh engine (TA-Lib & Pandas-TA).
- **Response**:
  ```json
  [
    { "id": "rsi", "name": "Relative Strength Index", "category": "Momentum" },
    { "id": "bbands", "name": "Bollinger Bands", "category": "Volatility" }
  ]
  ```

---

## 🛠️ Tips Pengembangan (Frontend)
1. **CORS**: Sudah diaktifkan untuk semua origin (`AllowAny`).
2. **Error Handling**: Perhatikan status code (401 untuk Auth Error, 500 untuk Backend Error).
3. **Decimal**: Backend menggunakan tipe data `Decimal` untuk presisi uang. Pastikan Frontend mengirimkan angka dalam format yang benar.

---
---
+*Terakhir Diperbarui: 10 Mei 2026 | Managed by Antigravity AI*

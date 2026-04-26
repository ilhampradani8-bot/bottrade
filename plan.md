# 🤖 BotTrade - Professional Crypto Backtesting & Trading Engine

BotTrade adalah platform robot trading kripto yang menggabungkan simulasi strategi (backtesting) dengan eksekusi otomatis. Proyek ini dirancang untuk memberikan wawasan mendalam bagi trader melalui analisis data historis yang akurat dan visualisasi sinyal trading yang intuitif.

---

## 🏗️ Arsitektur Proyek

Proyek ini terbagi menjadi tiga komponen utama yang bekerja secara sinergis:

### 1. **Backend & User Management (Node.js)**
*   **Lokasi**: `/backend/server.js`
*   **Port**: `5000`
*   **Fungsi**: Menangani pendaftaran pengguna, sistem OTP, dan manajemen database administratif. Juga melayani antarmuka web statis.

### 2. **Backtest Engine & Market API (Python)**
*   **Entry Point**: `run.py` (melalui `/kontrol/running.py`)
*   **Port**: `8080`
*   **Fungsi**: Mesin inti untuk mensimulasikan strategi trading. Mengambil data real-time dari **Binance API** dan menyimpan data historis ke MySQL.
*   **Fitur**: Kalkulasi indikator otomatis (SMA, RSI, Bollinger Bands).

### 3. **Modular Strategies**
*   **Lokasi**: `/strategi/`
*   **Konsep**: Setiap strategi dipisahkan dalam file sendiri untuk kemudahan pengembangan (Scalable).
    *   `dca.py`: DCA standar dengan filter tren.
    *   `rsi_dca.py`: Dynamic DCA berbasis kondisi jenuh jual (RSI).
    *   `ema_cross.py`: Strategi Moving Average Crossover (Golden/Death Cross).
    *   `bollinger_bands.py`: Strategi Mean Reversion menggunakan pita volatilitas.

---

## 🔐 Keamanan & Infrastruktur VPS

VPS telah dikonfigurasi dengan standar keamanan tinggi (Hardened):
*   **SSL/TLS**: Dashboard dapat diakses via HTTPS (Self-signed) untuk enkripsi data.
*   **Firewall (UFW)**: Hanya membuka port esensial (22, 80, 443, 5000, 8080).
*   **Fail2Ban**: Melindungi dari serangan brute-force SSH.
*   **Kernel Hardening**: Proteksi terhadap serangan jaringan tingkat rendah.
*   **Auto-Update**: Sistem akan melakukan patching keamanan otomatis setiap hari.

---

## 🛠️ Tutorial Penggunaan

### A. Cara Menjalankan Project
1.  **Backend Node.js**:
    ```bash
    cd backend && npm start
    ```
2.  **Backtest Engine**:
    ```bash
    python run.py
    ```

### B. Menggunakan Dashboard Backtest
1.  Buka **`https://[IP_VPS]:8080`** di browser.
2.  **Ambil Data**: Klik "Kelola Data Market" untuk mengunduh data koin dari Binance ke database lokal.
3.  **Pilih Konfigurasi**:
    *   Pilih koin (Koin dengan tanda ✅ berarti data tersedia di DB).
    *   Pilih strategi dan interval waktu.
4.  **Jalankan**: Klik "Jalankan Simulasi".
5.  **Analisis**: Lihat grafik "Market Price & Signals" untuk melihat posisi beli/jual dan grafik "Growth Performance" untuk melihat pertumbuhan saldo.

---

## 📁 Struktur Direktori Utama
```text
.
├── admin/               # Antarmuka Web Dashboard
├── backend/             # Server Node.js (API Pengguna)
├── kontrol/             # API Python (API Backtest)
├── strategi/            # Modul Strategi Trading (Modular)
├── tester/              # Inti Mesin Backtest & Handler Data
├── .env                 # Konfigurasi Kredensial (Rahasia)
└── run.py               # Entry point untuk suite Python
```

---

## 🤖 Catatan untuk AI Agent
*   **Data Handling**: Selalu gunakan `tester/data_handler.py` untuk interaksi database.
*   **New Strategy**: Untuk menambah strategi baru, buat file baru di `/strategi/`, implementasikan fungsi `strategy(row, portfolio, **kwargs)`, dan daftarkan di `/kontrol/running.py`.
*   **Environment**: Semua kredensial (DB, API Key, Password) **WAJIB** disimpan di `.env` dan tidak boleh ditulis langsung di kode atau dokumentasi ini.

---
*Dibuat dengan ❤️ oleh Antigravity untuk Keuntungan Maksimal.*

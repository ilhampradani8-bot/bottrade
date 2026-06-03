const http = require('http');

const message = `📌 *PENGUMUMAN PENTING / IMPORTANT ANNOUNCEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━

🇮🇩 *[BAHASA INDONESIA]*
Halo semuanya! Selamat datang di *TradingSafe Auto-Analysis Engine*.

📢 *Informasi Pengembangan:*
Bulan ini, layanan kami baru tersedia dalam bentuk *Telegram & WhatsApp Auto-Bot*. Untuk *Web App Utama* (Dashboard Trading & Kontrol Manual) saat ini masih dalam tahap *30% Active Development* dan sedang dikerjakan secara intensif.

🛠️ *Detail Teknis TradingSafe Engine:*
1. 🕒 *Aktif 24 Jam Non-Stop:* Bot bekerja 24/7 di VPS berkecepatan tinggi tanpa libur untuk memantau pergerakan harga pasar crypto secara real-time.
2. 📊 *Pemantauan Top 5 Koin Teratas:* Aset utama yang dipantau secara real-time langsung dari Binance WebSocket adalah: *BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, dan XRP/USDT*.
3. ⏳ *Laporan Rutin 1 Jam Sekali:* Setiap 1 jam rutin, bot akan mengirimkan laporan status pasar terupdate (Heartbeat Report) berisi ringkasan status 5 koin utama.
4. ⚡ *Sinyal Breakout Dadakan (Instan):* Bot memantau timeframe *5m (Scalping)*, *15m (Day Trading)*, dan *1d (Macro Swing)*. Begitu terdeteksi kesempatan breakout valid (*BULLISH* / *BEARISH*), bot akan *seketika langsung mengirimkan sinyal entri, target profit (TP), dan cut loss (CL)*! Kondisi sideways otomatis di-filter agar tidak mengganggu grup.
5. 💵 *Multi-Mata Uang Lokal:* Seluruh harga dikonversi otomatis dalam 3 mata uang utama: *USD ($), Rupiah (Rp), dan Ringgit Malaysia (RM)* secara real-time.
6. 📈 *Indikator Pendukung Akurat:* Setiap sinyal didukung data real-time RSI (14), EMA (50), MACD, serta *Alasan Analisa yang 100% Dinamis* berdasarkan pergerakan pasar terbaru.

━━━━━━━━━━━━━━━━━━━━━━━━━━

🇬🇧 *[ENGLISH VERSION]*
Hello everyone! Welcome to *TradingSafe Auto-Analysis Engine*.

📢 *Development Update:*
This month, our service is exclusively available via the *Telegram & WhatsApp Auto-Bot*. The core *Web App Dashboard* is currently under *30% active development* and is being built to standard.

🛠️ *TradingSafe Technical Features:*
1. 🕒 *Active 24/7 Non-Stop:* The bot runs 24/7 on a high-speed VPS, continuously listening to live market movements without downtime.
2. 📊 *Top 5 Major Coins Monitored:* Real-time data streams straight from Binance WebSockets for: *BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, and XRP/USDT*.
3. ⏳ *Hourly Routine Report:* Every 1 hour, the bot posts a routine market heartbeat report summarizing the current status of all 5 major assets.
4. ⚡ *Instant Breakout Signals:* The engine monitors *5m (Scalping)*, *15m (Day Trading)*, and *1d (Macro Swing)* timeframes. The moment a valid trend breakout (*BULLISH* / *BEARISH*) is detected, the bot *instantly broadcasts precise Entry, Target Profit (TP), and Cut Loss (CL)* signals. Consolidating sideways noise is auto-filtered.
5. 💵 *Local Multi-Currency Support:* All key prices are automatically converted into three major currencies: *USD ($), Indonesian Rupiah (Rp), and Malaysian Ringgit (RM)*.
6. 📈 *Precision Indicators:* Each signal features real-time RSI (14), EMA (50), MACD Trend, and a *100% Dynamic Market Reasoning* tailored to current charts.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *Powered by TradingSafe Auto-Analysis Engine*`;

const data = JSON.stringify({ message });

const options = {
  hostname: '127.0.0.1',
  port: 5002,
  path: '/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('✅ Broadcast Success! Response:', body);
  });
});

req.on('error', (error) => {
  console.error('❌ Broadcast Failed:', error);
});

req.write(data);
req.end();

# 📌 Status Proyek BotTrade & Panduan Pengembang (Cheatsheet Sesi Baru)

> [!NOTE]
> **ATURAN PENGHEMATAN TOKEN UNTUK SESI AI BARU:**
> 1. JANGAN memindai seluruh direktori atau menganalisis ulang struktur frontend/backend dari awal.
> 2. Gunakan file ini untuk memahami arsitektur, port, status terakhir, dan detail integrasi sistem.
> 3. Langsung eksekusi fitur atau perbaiki masalah berdasarkan cetak biru (blueprint) di bawah ini.

---

## 1. 🚀 Gambaran Umum & Status Proyek

* **Status**: *Pengembangan Aktif & Pemolesan UI/UX - Sleek Minimalist Apple-Vibe & Dual Theme Selesai 100%*
* **TradingSafe Engine**: **Analysis Engine (Rust)** 24/7 + **WhatsApp Bridge (Node.js)** berjalan di background VPS.
* **Automated Marketing Engine**: **Marketing Bot (Rust)** terintegrasi Groq API (Llama 3.3) berjalan otonom di background VPS.
* **Backend App**: **Engine24am** (Tokio worker loop dinamis, Polars data engine, DB sinkronisasi setiap 10 detik).
* **Frontend**: **Next.js 16 (Turbopack) + Tailwind CSS v4** (Dashboard modern premium dengan sistem tema dual-mode).
* **Host API Utama**: `http://139.59.122.230:8080/api` (Backend Rust).
* **Desain Standard**: **2026 Minimalist High-Density, Apple-Vibe Dynamic Layout & Seamless Color Mapping**.

---

## 2. 📁 Komponen Utama Frontend (Dashboard)

Semua halaman dashboard (`Overview`, `StrategySettings`, `ApiSettings`, `LabSimulasi`, `CariBot` (Cari Asisten), `JurnalRiwayat`, `ChatSupport`) dikonfigurasi **100% full-width tanpa celah (Edge-to-Edge)**.

### A. Sidebar Navigasi Collapsible & Frozen (`Sidebar.tsx`)
* **Lebar Dinamis**: Menyusut dari `w-72` menjadi **`w-56` (224px)** saat aktif.
* **Collapse Penuh**: Pada desktop, sidebar dapat disembunyikan sepenuhnya (`w-0`, `opacity-0`, `border-r-0`) dengan transisi mulus.
* **Frozen / Fixed Layout**: Dipasang dengan posisi `fixed top-14 left-0 h-[calc(100vh-56px)] z-40 bg-[#06070b]/95 backdrop-blur-xl`. Layout konten utama (`AdminLayout.tsx`) tergeser otomatis menggunakan `lg:pl-56` ketika terbuka dan `lg:pl-0` ketika ditutup dengan transisi halus (`transition-all duration-300`).
* **Cari Asisten Button**: Tombol menu "Marketplace" diperbarui namanya menjadi **"Cari Asisten"** di sidebar dan header navigasi.

### B. Header Ramping, Sistem Tema Dual-Mode & Frozen (`Navbar.tsx`)
* **Tinggi Padat & Frozen**: Dikurangi dari `h-20` menjadi **`h-14` (56px)** dan menggunakan posisi `fixed top-0 left-0 right-0 z-[999]`.
* **Sistem Tema**: Toggle ☀️/🌙 di dropdown profil (user) dan dropdown *Get Started* (tamu). Tema disimpan di `localStorage` (`theme`) dan mengubah class `light-theme` pada tag `body` tanpa flicker.
* **Auto-Open Auth Modal**: Membaca pemicu `open_auth_modal` dari `localStorage` saat dimuat. Jika bernilai `'login'` atau `'register'`, modal autentikasi akan langsung terbuka secara otomatis di mode yang sesuai.

### C. Simulasi Lab & Backtest Terpadu (`LabSimulasi.tsx`)
* **Desain Tab Lebar Penuh**: Mengganti layout terpisah kolom kiri/kanan dengan navigasi Tab penuh ("Pengaturan Parameter" vs "Hasil Simulasi") tanpa batasan max-width (`w-full`) sehingga form parameter sangat luas dan lega.
* **Auto-Tab Switch**: Saat menekan tombol "Jalankan Simulasi Backtest", tab otomatis berpindah ke "Hasil Simulasi".
* **Desain Flat**: Menghapus ornamen card dengan latar belakang gelap, mengganti *Result Cards* dengan desain flat beraksen garis tepi kiri tebal (`border-l-4`).
* **Scroll Data Kustom**: Tabel riwayat transaksi dibatasi tinggi maks (`max-h-[600px] overflow-y-auto`) dengan scrollbar vertikal kustom hanya ketika data transaksi sangat banyak.
* **Lebar Input Waktu**: Kolom input waktu (`startTime` / `endTime`) diperlebar menjadi `w-32` untuk mencegah browser memotong teks kontrol input bawaan.
* **Efek Umpan Balik Glow**: Saat menekan preset **QUICK SHORT** atau **QUICK LONG**, kolom input yang nilainya berubah (Base/Safety order, Price Dev, Trailing Callback, dan box Trailing Stop) memancarkan cahaya glow kuning/amber lembut (`border-amber-400 ring-2/50 bg-amber-500/10`) selama 1.2 detik.

### D. Optimasi Pencarian Koin & Meme Coin Prioritas (`RealtimeLab.tsx`)
* **100 Items Limit**: Dropdown pencarian koin diperluas kapasitasnya untuk menampilkan hingga 100 koin agar koin real-time lebih bervariasi.
* **Prioritas Koin Meme & Populer**: Saat kolom pencarian kosong, daftar teratas dropdown secara otomatis memprioritaskan koin populer dan meme coins teraktif Binance (`DOGE`, `SHIB`, `PEPE`, `BONK`, `FLOKI`, `WIF`, `BTC`, `ETH`, `SOL`, dll.) sehingga langsung terlihat sekali klik tanpa perlu diketik manual.

### E. Portal Auth Neuromorphic (`AuthModal.tsx`)
* **Rendering Aman**: Dirender langsung ke `document.body` menggunakan React Portal untuk kestabilan stacking index.
* **Desain**: Input bergaya sunken (`bg-[#06070a]`) dengan tombol aksi gradient timbul.

### D. Kokpit Strategi Padat (`StrategySettings.tsx`)
* **Bot-Centric Tab**: Navigasi ringkas 5-bot (DCA Lite, Smart DCA, Grid Master, Hybrid, Trailing) langsung di bagian atas panel kontrol.
* **Responsif**: Input 2-kolom di desktop (`xl:grid-cols-2`) dan bertumpuk di HP (`grid-cols-1`).
* **Popup Mobile Full-Screen**: Di layar HP, popup konfigurasi menutupi TradingView Chart secara penuh mulai tepat di bawah Navbar (`top-14 z-[100] h-[calc(100vh-56px)]`) untuk mencegah tabrakan z-index dengan iframe.

### E. Global Footer "Hide/View Info" (`Footer.tsx`)
* **Default (Collapsed)**: Hanya menampilkan teks hak cipta tipis dan tombol chevron `>`.
* **Expanded**: Menampilkan panel kontak, navigasi, dan langganan newsletter dengan tipografi mikro `text-[11px]`.

### F. Laporan Jurnal & Riwayat Perubahan Permanen (`JurnalRiwayat.tsx`)
* **Excel-like & Flat Aesthetic**: Badge/card pada kolom PnL digantikan dengan teks flat bersih (emerald untuk profit, rose untuk loss).
* **Screenshot Engine Pro**: Capture menggunakan `html2canvas` dengan injeksi CSS dinamis untuk menyembunyikan tombol aksi ("Hapus") dan mempertahankan lebar kolom tabel yang konsisten.
* **Audit Trail Permanen (SQL)**: Riwayat audit perubahan transaksi dipindahkan dari `localStorage` browser ke database PostgreSQL permanen di kolom `change_history` (tabel `trades_by_jurnalriwayat`). Pembaruan disimpan via request `PUT` dan penghapusan via `DELETE` ke backend Rust.
* **i18n Internasionalisasi**: Sistem multi-bahasa terintegrasi (Indonesian `id`, English `en`, French `fr`, Chinese `zh`) dengan bendera SVG yang sinkron antara landing page (`ts_lang`/`lang` di `localStorage`) dan panel dashboard.

### G. Persistensi Sesi Chat Support & Reverse-Chronological Loading (`ChatSupport.tsx`)
* **Session-Based Isolation**: Menggunakan pengenal `session_id` murni sebagai identifikasi sesi chat yang terkait dengan User ID asli.
* **SQL Session Persistence**: Seluruh sesi chat disimpan dalam tabel `chat_sessions_by_chat` (ID sesi, nama sesi, User ID).
* **Socket Integration**: Menggunakan Socket.IO untuk mengirimkan (`chat:send`) pesan secara langsung ke server Rust dengan payload berisi `session_id` aktif.
* **Mode Pengunjung Tanpa Login (Guest Chat Support)**: Jika belum login, widget otomatis men-generate ID tamu unik persisten (`guest_<random_hash>`) di `localStorage`. Pesan dari pengunjung tanpa login otomatis masuk ke database dengan identitas "Tamu [ID]" dan disinkronkan ke dashboard admin secara real-time.
* **Paginasi & Infinite Scroll Ke Atas**: Hanya memuat 20 pesan terbaru saat pertama kali dibuka. Menggunakan scroll instan (`behavior: "auto"`) saat render awal agar tidak melompat. Pesan lama dimuat secara dinamis saat user meng-scroll ke atas (indikator "Memuat pesan lama...").
* **Estetika Chat Sederhana & Bersih**: Menghapus bar status "KONEKSI REAL-TIME AKTIF" dan avatar bulat "TS" di header. Header kini bersih berupa teks nama "TradingSafe Support" dengan lampu status hijau "Online".
* **Rendering Global**: Widget dipasang agar muncul di seluruh rute termasuk Landing Page (`/home`, `/`) dan Halaman Login (`/login`) melalui bypass integrasi di `AdminLayout.tsx`.

### H. UI Cari Asisten / Cari Bot (`CariBot.tsx`)
* **Header Removal**: Menghapus header lokal di dalam halaman Cari Bot, mengandalkan Navbar untuk penampilan judul halaman `"Cari Asisten"`.
* **Warning Alert Box**: Menambahkan card peringatan/status di bagian atas halaman yang menjelaskan bahwa fitur ini masih dalam pengembangan dan memerlukan penyiapan tabel SQL bot dari sisi admin.
* **Simplified Interactive Cards**: Mengubah card bot strategi menjadi elemen `<button>` yang dapat diklik secara utuh dan langsung mengarahkan pengguna ke konfigurasi strategi, serta menghilangkan nested button modal/info.

---

## 3. 🧠 TradingSafe Engine & Prediction V2

### A. Standalone V2 Prediction Test Engine (`prediction-v2`)
* **Target Routing Sinyal**:
  * **WhatsApp**: Notifikasi sinyal BULLISH (UP) dikirim ke grup `TradingSafe - Up Predictions` (`120363427987942506@g.us`), sinyal BEARISH (DOWN) ke `TradingSafe - Down Predictions` (`120363409651722299@g.us`). Format bahasa: **Bahasa Inggris**.
  * **Telegram**: Sinyal BULLISH dikirim ke grup utama (`-1003973511282`), sinyal BEARISH dikirim ke grup khusus (`-5215838199`).
* **Fitur Utama**:
  * **Dormant V1**: Logika V1 tetap berjalan di background untuk review internal, tetapi pengiriman publik dinonaktifkan (di-comment).
  * **Anti-Spam Cooldown**: Jeda paksa **15 menit** setelah siklus prediksi suatu koin selesai sebelum sinyal baru untuk koin tersebut dapat dipicu kembali.
  * **Format Desimal Dinamis**: Koin bernilai rendah (seperti XRP) menggunakan **4 desimal** agar target harga tidak tumpang tindih akibat pembulatan. Koin besar lainnya menggunakan 2 desimal standar.
  * **Threaded Quoted Reply**: Robot menyimpan ID pesan pertama kali sinyal dikirim dan secara otomatis membalas (*reply/quote*) pesan awal tersebut ketika status target tercapai, batal, atau habis waktu (*timeout*).
  * **Log JSON**: Riwayat siklus hidup prediksi disimpan di `/root/bottrade/logs/prediction_history.json`.

---

## 4. 📢 Automated Marketing Engine (Rust)

* **Otonom 1-Hour Scheduling**: Konten pemasaran diposting otomatis setiap 1 jam, dikelola melalui file state `/root/bottrade/logs/marketing_state.json`.
* **Event-Driven Target Hit**: Mengirim postingan promosi instan ketika sinyal mencapai target (`TARGET_HIT`).
* **Distribusi Multi-Platform**: Mengirim postingan ke WhatsApp, Telegram, dan Buffer (X/Threads).
* **Optimasi Karakter & Format**:
  * **Bahasa**: Sepenuhnya disajikan dalam **Bahasa Inggris** (tidak ada teks ganda/terjemahan).
  * **Twitter Safety Character Limit**: Postingan X/Twitter otomatis dipotong di karakter 277 dengan akhiran `...` jika melebihi batas 280 karakter.
  * **Real-time Push**: Menggunakan mode `"shareNow"` pada API GraphQL Buffer untuk melompati antrean dan batasan kuota gratis.
  * **Copywriting Bebas Jargon**: Menghapus istilah teknis komputer (seperti *Rust, latency, database, API keys*) menjadi keunggulan bisnis yang mudah dipahami (non-custodial diubah menjadi "dana tetap aman di dompet Anda").

---

## 5. 🎨 Modernisasi Landing Page

### A. Struktur File Bersih & Tunggal (Single Source of Truth)
* **Lokasi Tunggal**: Semua aset halaman utama dikonsolidasikan langsung di folder `/root/bottrade/frontend/public/` (`landing.html`, `landing.css`, `landing.js`, `lang/`, `img/`).
* **Pembersihan**: Folder cadangan `src/app/home/` (berisi `page.js.backup`) dan folder redundan `src/components/landing-static/` telah dihapus sepenuhnya untuk menghindari kerancuan pengembangan.

### B. Integrasi Navigasi Login/Dashboard
* **Auth Buttons**: Menambahkan tombol **Login** (ID `login-btn`) dengan gaya minimalis berbingkai tipis bersanding dengan tombol **Dashboard** (ID `dashboard-btn`) di pojok kanan atas.
* **Auto-Hide**: Ketika dimuat, `landing.js` mengecek keberadaan token autentikasi di `localStorage`. Jika user sudah login, tombol **Login** disembunyikan dan hanya menampilkan tombol **Dashboard**.
* **Fungsi Redirect**: Mengklik tombol **Login** akan menyimpan pemicu `open_auth_modal` ke `localStorage` dan mengalihkan user ke `/`.

### C. Efek Parallax Peel-Off Slow-mo Stacking (Desktop Only)
* **Z-Index Stacking**: Setiap section diatur berurutan menggunakan `position: sticky; top: 0` dengan z-index berkelipatan 10.
* **Efek Peel-Off**: Fungsi `handleScroll` di `landing.js` menerjemahkan section saat ini ke atas secara lambat (`translateY(-120px)`) dan menyusutkannya secara dinamis (`scale(0.98)`) saat section berikutnya terangkat naik.
* **Back to Top Floating Bubble**: Tombol gelembung bulat melayang (`#back-to-top`, `z-[999]`) di pojok kanan bawah yang muncul otomatis saat scroll melewati 400px dan terintegrasi dengan Lenis smooth scroll.

### D. Restrukturisasi Layout Landing Page
* **Simulator**: Layout diubah menjadi split 2-kolom (Kiri: deskripsi, Kanan: mockup simulator browser).
* **Komunitas**: Seksi diubah menjadi *full-width* dengan latar belakang biru muda (#e6effb), teks gelap, dan kartu putih minimalis. Link Telegram disederhanakan menjadi tautan teks biru dengan ikon panah (`➔`).
* **Penyelarasan Warna**: Background default tag `html` disetel ke warna gelap (#09090b) untuk membaurkan sisa celah sub-pixel browser di bawah footer secara mulus.

---

## 6. 🛠 Detail Teknologi & Perintah Pengembangan

* **Database (PostgreSQL)**:
  * Database utama: `bottrade_db`
  * Tabel data historis backtest: **`market_data_by_backtest`** (telah dimigrasi dari `market_data_by_marketplace`).
  * Kolom Audit Trail Jurnal: **`change_history`** (tipe `TEXT`) telah ditambahkan pada tabel `trades_by_jurnalriwayat` untuk persistensi log perubahan.
  * Tabel Sesi Chat: **`chat_sessions_by_chat`** menyimpan metadata sesi chat (ID, nama, User ID).
  * Kolom Sesi Chat: **`session_id`** (tipe `VARCHAR`) ditambahkan pada tabel `chat_messages_by_chat` untuk mengikat pesan chat ke sesi tertentu.
* **Relokasi Sync Hub**:
  * Fitur penarikan data historis Binance (**Sync Hub / Data Acquisition**) telah dihapus dari sidebar & dashboard frontend utama user biasa, dan dipindahkan sepenuhnya ke **Halaman Dashboard Admin Control Center** (`admin/src/app/page.tsx`).
  * Implementasi penarikan data pada admin menggunakan native `fetch` API (tanpa dependency `axios`).
* **Lokasi Proyek**:
  * Frontend: `/root/bottrade/frontend`
  * Backend Rust: `/root/bottrade/backend`
  * Engine Rust: `/root/bottrade/engine`
  * WhatsApp Service: `/root/bottrade/whatsapp-service`
* **Layanan PM2 (Process Management)**:
  * `bottrade-backend` (ID: 0) - REST API server backend Rust (port 8080)
  * `bottrade-admin` (ID: 6) - Admin dashboard Next.js (port 8081)
  * `whatsapp-bridge` (ID: 2) - Bridge bot WhatsApp untuk alert/notifikasi
  * `bottrade-frontend` (ID: 3) - Next.js frontend (port 3000)
  * `bottrade-db-admin` (ID: 4) - Adminer database explorer (port 8089)
  * `bottrade-engine` (ID: 5) - Engine bot trading otonom/prediksi (analysis, prediction-v2)
  * `engine-user-operator` (ID: 7) - **Engine eksekutor bot pengguna real-time** (baru, lihat §8)
* **Perintah Pengembangan**:
  * Restart semua layanan:
    ```bash
    pm2 restart bottrade-backend bottrade-frontend bottrade-engine engine-user-operator bottrade-admin
    ```
  * Lihat logs:
    ```bash
    pm2 logs bottrade-backend
    pm2 logs engine-user-operator
    ```
  * Membangun frontend (Production Build):
    ```bash
    npm run build  # di folder /root/bottrade/frontend
    ```
  * Membangun engine-user-operator (Rust):
    ```bash
    cargo build --bin engine-user-operator  # di folder /root/bottrade/engine
    pm2 restart engine-user-operator
    ```

---

## 7. 🔐 Integrasi OAuth & Halaman Login Modern (`/login`)

* **Halaman Login Tunggal Modern**: `/login` (berjalan di Next.js `/app/login`) terisolasi dari dashboard dan menggantikan pop-up login lama.
* **Integrasi OAuth 2.0 Penuh**: Google, GitHub, dan Discord terintegrasi di bawah NextAuth.js. Pendaftaran akun secara sosial berjalan otomatis di sisi backend Rust (`postgres_auth_hub.rs`) tanpa credential ganda.
* **Desain Premium & Glassmorphic**:
  * **Brand Header**: Menggunakan nama **TradingSafe** dengan warna putih solid kontras.
  * **Tema Sinkron**: Mode gelap & terang disinkronkan langsung dari preferensi yang disimpan pengunjung di `localStorage` (`theme`).
  * **Latar Belakang Gambar**: Visual grafik trading crypto modern dengan overlay glassmorphic backdrop-blur.
  * **Floating Card Kembali ke Beranda**: Terpasang melayang di pojok kiri atas dengan desain mewah beraksen warna biru muda.
  * **Uji Coba Akun Demo**: Tombol demo menghasilkan akun tamu instan (`guest_demo_<id>@tradingsafe.com`) dan langsung masuk ke dashboard secara instan tanpa jeda atau penundaan loading.
  * **Akselerasi Pengalihan**: Pengalihan login sukses/demo langsung meluncurkan user ke `/dashboard` menggunakan instant direct redirect.
* **Penyelarasan HTTPS Prod**: `NEXTAUTH_URL` diatur ke `https://tradingsafe.mijdigital.my` (HTTPS port 443 reverse-proxied via Apache) untuk mencegah error `redirect_uri_mismatch` pada callback Google OAuth.
* **Simplifikasi Header Dashboard**: Judul redundan (`API Vault` pada `ApiSettings.tsx`) telah dihapus untuk mengandalkan judul Navbar, menyisakan tata letak minimalis terpadu.

---

## 8. ⚙️ Engine-User Operator (Eksekutor Bot Pengguna Real-time)

Sistem baru yang terpisah dari `bottrade-engine` (prediksi/analisis), khusus menjalankan bot trading pengguna secara real-time berdasarkan konfigurasi strategi yang tersimpan di database SQL.

### A. Arsitektur & Lokasi File
* **Folder Utama**: `/root/bottrade/engine/Engine-User/`
  * `operator/main.rs` — Orkestrator utama (binary: `engine-user-operator`)
  * `operator/hear.rs` — WebSocket price listener (mendengarkan harga real-time dari exchange)
  * `operator/bot.rs` — Mesin eksekutor strategi per-bot (keputusan beli/jual & pencatatan transaksi)
  * `strategi/` — Salinan kode strategi dari `backend/src/strategies/` (DCA, Grid, Bollinger, RSI, EMA, Trailing, Combo) untuk referensi logika kalkulasi
* **Binary Rust**: Terdaftar di `engine/Cargo.toml` sebagai `[[bin]] engine-user-operator`
* **PM2 Process**: `engine-user-operator` (ID: 7), berjalan persisten di background

### B. Alur Kerja Dinamis (`main.rs`)
1. **Inisialisasi**: Koneksi ke PostgreSQL, membuat shared state harga (`Arc<RwLock<HashMap<String, f64>>>`).
2. **Polling Database Aktif**: Setiap 5 detik, query `SELECT ... FROM strategies_by_strategysettings WHERE status = 'Running'`.
3. **Hot-Reload Bot**: Bot baru yang diaktifkan (status diubah ke `'Running'` via Admin Page) langsung di-spawn ke memori. Bot yang dihentikan (`'Stopped'`) langsung di-unload.
4. **Dynamic WebSocket Resubscribe**: Jika daftar pair trading berubah (misalnya bot ETH/USDT diaktifkan), WebSocket listener otomatis ditutup dan dibuka ulang dengan langganan pair terbaru tanpa restart engine.
5. **Tick Loop**: Setiap 1 detik, semua bot aktif di memori dieksekusi `.tick()` secara bergilir.

### C. Price Listener (`hear.rs`)
* **Protokol**: WebSocket (`tokio-tungstenite`) ke `wss://stream.binance.com:9443/stream?streams=...`
* **Event**: Berlangganan `aggTrade` (Aggregated Trade) untuk setiap pair aktif, memberikan harga transaksi terbaru secara instan.
* **Fault Tolerance**: Loop reconnect otomatis dengan *exponential backoff* (5s → 10s → 20s → max 60s) jika koneksi terputus. Tidak akan crash meskipun jaringan exchange bermasalah.
* **Multi-Exchange Ready**: Arsitektur siap diperluas untuk mendengarkan WebSocket dari Bybit (`wss://stream.bybit.com/v5/public/linear`), OKX, dan exchange lain dengan menyesuaikan URL dan format parser JSON.

### D. Strategy Executor (`bot.rs`)
* **Multi-Bot per User**: Satu pengguna dapat menjalankan banyak bot secara simultan. Setiap bot diidentifikasi berdasarkan ID primary key database (bukan user ID).
* **Parsing JSON Settings Lengkap**: Membaca seluruh parameter dari kolom `settings` JSONB di tabel `strategies_by_strategysettings`:
  * `nominal` / `buy_amount` — Jumlah investasi per order (mendukung format string berkoma `"1,000,000"`)
  * `take_profit_percentage` — Persentase take profit (dibagi 100 otomatis jika integer)
  * `stop_loss_percentage` — Persentase stop loss (0 = nonaktif)
  * `safety_deviation` — Persentase deviasi harga untuk safety order DCA
  * `coins`, `platforms`, `days`, `sim_balance` — Parameter simulasi/konfigurasi tambahan
* **Strategi yang Didukung**:
  * **DCA (Dollar Cost Averaging)**: Buy saat harga turun melewati `safety_deviation`, sell saat `take_profit_percentage` tercapai, emergency sell saat `stop_loss_percentage` tertembus.
  * **Grid Trading**: Buy/sell pada level grid spacing yang telah ditentukan.
  * **Indicator-Based**: Placeholder siap diisi logika RSI, Bollinger, EMA, MACD dari folder `strategi/`.
* **Pencatatan Transaksi**: Setiap eksekusi BUY/SELL dicatat langsung ke tabel PostgreSQL `trades_by_jurnalriwayat` dengan kolom lengkap (user_id, pair, strategy_type, side, price, amount, pnl, created_at, status, requested_price, slippage, market_regime, is_manual_intervention).

---

## 9. 🛡 TradingSafe Admin Dashboard (`/admin`)

Panel kontrol administratif terpisah dari dashboard pengguna, berjalan di Next.js port 8081.

### A. Desain & Navigasi
* **Branding**: Nama ditampilkan sebagai **TradingSafe** di sidebar (sebelumnya "Bottrade").
* **Sidebar**: Menu navigasi minimalis dengan mode collapsed (burger icon). Item menu: Dashboard, Users, Bots, API Keys, Engine Control.
* **Navbar**: Header fixed dengan judul halaman dinamis, dropdown profil (info + logout), toggle bahasa Indonesia/Inggris.
* **Estetika**: Cardless flat design, glassmorphic dark theme, custom thin scrollbar (6px) di seluruh halaman.
* **Halaman Dihapus**: Menu & halaman `Market Data` (`/market`) ### B. Manajemen Pengguna (`/users`)
* **Tabel Full-Width Edge-to-Edge**: Margin negatif (`-mx-8 w-[calc(100%+4rem)]`) untuk memaksimalkan ruang tabel.
* **Kolom Verified Badge**: Status verifikasi email ditampilkan sebagai **pill badge premium** (hijau `VERIFIED` dengan ikon check, abu-abu `UNVERIFIED`).
* **Integrasi Kolom Kontak**: Menambahkan bidang `whatsapp_number` dan `telegram_id` ke skema pengguna, backend API, dan formulir Add / Edit User (dan Info Lengkap detail modal) dengan tampilan flat tanpa card.
* **Filter & Pencarian**: Search bar, filter dropdown per kolom (Role, Status, Signal, Marketing, Verified), tombol Reset Filter, dan sorting per kolom.
* **Pop-up Detail**: Klik baris pengguna memunculkan modal detail lengkap bergaya tab (Info Lengkap, Edit User, Tindakan) dengan sudut tajam `rounded-xl` dan layout flat list-border (menghapus container bertumpuk).
* **Info Summary Bar**: Footer menampilkan total pengguna, jumlah aktif, dan jumlah terblokir.

### C. Manajemen Bot (`/bots`)
* **Live & Simulation Switcher**: Menambahkan switcher tab premium ("Live Trading Engine" vs "Simulation Lab Engine") di bagian atas untuk mengelola bot live dan bot simulasi secara independen.
* **Model Tab Bar**: Navigasi tab horizontal untuk filter tipe strategi (ALL BOTS, DCA BOT, GRID BOT, RSI BOT, MACD BOT) dengan badge counter dinamis per kategori.
* **Tabel Profesional**: Kolom #, ID (`#BOT-{id}` atau `#SIM-{id}`), Bot Engine (nama + tipe strategi), Owner, Pair/Symbol, Status (teks berwarna), dan Actions.
* **Aksi Hover**: Tombol Play/Pause dan Stop muncul elegan saat baris di-hover. Mengklik tombol ini mengirim request `POST /api/admin/bots/{id}/status` atau `POST /api/admin/simulations/{id}/status` ke backend Rust untuk mengubah status di database.
* **Integrasi Engine-User Operator**: Perubahan status di halaman admin langsung terdeteksi oleh `engine-user-operator` (polling setiap 5 detik) yang kemudian secara otomatis men-spawn atau menghentikan instans bot terkait (baik live maupun simulasi).
* **Toast Notification**: Konfirmasi aksi (start/stop/error) ditampilkan sebagai toast alert premium semi-transparan di pojok kanan atas (auto-dismiss setelah 4 detik).
* **Strategy Detail Modal**: Mengklik baris bot memunculkan pop-up modal berisi: Strategy Engine type, Trading Pair, System Status, Owner Account, dan **Engine Strategy Settings** (tampilan JSON lengkap dari kolom `settings` JSONB di database). Tombol Start/Stop juga tersedia di dalam modal.
* **Info Summary Bar**: Footer menampilkan total bot, jumlah Running, Stopped, dan Paused.

### D. Pengaturan Notifikasi & Broadcast (`/notifications`)
* **Desain Minimalis Tajam (Cardless & Full-Width)**: Seluruh antarmuka diubah ke mode lebar penuh (edge-to-edge) tanpa card pembungkus.
* **Dual-Tab Workflow**: Membagi proses penyiaran ke dalam sub-tab utama:
  * `1. Tulis & Kirim`: Menulis pesan dan memilih kanal target (Telegram, WhatsApp, Web, Email).
  * `2. Pilih Penerima`: Spreadsheet-like HTML table untuk manajemen target penerima.
* **Inline Spreadsheet-Style Header Filters**: Menyediakan form filter teks dan dropdown (Role, Status) langsung di dalam baris header tabel penerima (Username, Email, Telegram, WhatsApp, Role, Status) untuk menyaring data secara instan.
* **Penyelarasan Nilai SQL**: Filter dropdown Status diselaraskan dengan nilai lowercase database asli (`aktif`, `pending`, `blokir`) dan Role diselaraskan dengan (`admin`, `premium`, `trader`).
* **Header Controls Bar**: Menempatkan statistik real-time (`Menampilkan X cocok filter. Terpilih: Y`) dan tombol kontrol penyeleksian (`Pilih Semua yang Tampil`, `Batal Pilih`, `Kosongkan`) tepat di sebelah bar navigasi sub-tab.
* **Smart Polling (Hemat Daya)**: Menyegarkan data daftar akun secara otomatis di latar belakang setiap 15 detik. Menggunakan pengecekan visibility state (`document.hidden`) untuk mematikan request ke backend jika tab browser sedang tidak aktif/di-minimize guna mencegah beban koneksi database (overload) berlebihan.
* **Sub-Tabbed Configuration & Settings**: Membagi halaman pengaturan menjadi dua sub-tab yang teratur:
  * `1. API & Koneksi`: Mengatur parameter Token Telegram, Group Chat ID UP/DOWN, WhatsApp Port, Cooldown, dan tombol toggle *Error Alerts*.
  * `2. Template Darurat`: Form kustomisasi pesan darurat instan yang tersimpan permanen di database (Sistem Down, Diretas, Maintenance).
* **Audit Trail Riwayat Broadcast**: Menyimpan status pengiriman (`success`, `partial_success`, `failed`), kanal tujuan, isi pesan, dan timestamp ke tabel `broadcast_logs_by_admin`.

### E. Catatan Keamanan
* **Route Protection**: Middleware autentikasi rute di `layout.tsx` saat ini di-*bypass* untuk efisiensi pengembangan. **WAJIB diaktifkan kembali sebelum deployment produksi.**
* **Login Admin**: JWT + Bcrypt (User: `adminbottrade1`).

### F. Kontrol Kernel & Pemantauan Node (`/engine`)
* **Pemantauan Ringan & Dinamis**: Status PM2 diambil secara on-demand menggunakan perintah `pm2 jlist` pada Rust API backend (`GET /api/admin/vps-nodes`) saat dashboard dibuka (tidak ada daemon background terus-menerus guna menghemat CPU/RAM).
* **Interactive Schema Information (Tombol !)**: Menambahkan tombol "!" kuning/amber di header halaman kontrol kernel (`/engine`), laporan keuangan (`/reports`), dan chat support (`/reports/chat`) untuk memicu modal popup detail relasi skema database PostgreSQL terkait.
* **Model Tab Utama**: Menghapus terminal log lama yang boros memori dan membagi sistem kontrol menjadi 2 tab:
  * `Node Monitor`: Daftar tabel status proses node VPS.
  * `Laporan Logs`: Log kesalahan sistem yang di-stream dari log PM2 dan disimpan ke SQL.
* **Sub-Tab Kategori Node**: Di dalam menu Node Monitor, proses dikelompokkan dan dapat difilter melalui sub-tab modular:
  * `Semua` (Seluruh proses VPS)
  * `Bot Trading` (misal: `bottrade-engine`)
  * `Bot User` (misal: `engine-user-operator`)
  * `Bot Notifikasi` (misal: `whatsapp-bridge`)
  * `Bot Frontend` (misal: `bottrade-frontend`)
  * `Bot Sistem` (misal: `bottrade-backend`, `bottrade-admin`, `bottrade-db-admin`)
* **SQL Log Ingestion (PostgreSQL)**:
  * Membaca file `-error.log` dan `-out.log` dari `/root/.pm2/logs/` untuk setiap proses.
  * Menyaring log berdasarkan level `ERROR`, `WARN`, dan `INFO`.
  * Menyimpan log secara otomatis ke tabel `system_logs_by_admin` dengan batasan `UNIQUE` pada kombinasi nama proses dan isi pesan untuk menghindari redundansi data.

---

## 10. 📊 Skema Database Terkini (PostgreSQL `bottrade_db`)

| Tabel | Fungsi |
|---|---|
| `users_by_user` / `users_by_usermanagement` | Data pengguna lengkap (`whatsapp_number` dan `telegram_id` ditambahkan) |
| `strategies_by_strategysettings` | Konfigurasi bot pengguna (id, user_id, name, bot_type, pair, settings JSONB, status) |
| `simulations_by_simsettings` | Konfigurasi bot simulasi pengguna (id, user_id, name, bot_type, pair, settings JSONB, status) |
| `trades_by_jurnalriwayat` | Jurnal transaksi live (20 kolom: user_id, pair, strategy_type, side, price, amount, pnl, created_at, status, requested_price, slippage, ... ) |
| `simulation_trades_by_jurnal` | Jurnal transaksi simulasi (user_id, pair, strategy_type, side, price, amount, pnl, created_at, status, requested_price, slippage, ... ) |
| `market_data_by_backtest` | Data historis kline untuk simulasi backtest |
| `chat_sessions_by_chat` | Sesi chat metadata (session_id, name, user_id) |
| `chat_messages_by_chat` | Pesan-pesan chat terikat session_id |
| `broadcast_logs_by_admin` | Log pengiriman broadcast admin (id, message, channels, status, created_at) |
| `system_logs_by_admin` | Log deteksi error/warning sistem dari log file PM2 VPS (id, process_name, log_level, message, created_at) |



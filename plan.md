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
* **Lokasi Proyek**:
  * Frontend: `/root/bottrade/frontend`
  * Backend Rust: `/root/bottrade/backend`
  * Engine Rust: `/root/bottrade/engine`
  * WhatsApp Service: `/root/bottrade/whatsapp-service`
* **Layanan PM2 (Process Management)**:
  * `bottrade-backend` (ID: 0) - REST API server backend Rust (port 8080)
  * `bottrade-admin` (ID: 1) - Layanan admin panel
  * `whatsapp-bridge` (ID: 2) - Bridge bot WhatsApp untuk alert/notifikasi
  * `bottrade-frontend` (ID: 3) - Next.js frontend
  * `bottrade-db-admin` (ID: 4) - Adminer database explorer (port 8089)
  * `bottrade-engine` (ID: 5) - Engine bot trading otonom/prediksi
* **Perintah Pengembangan**:
  * Restart semua layanan:
    ```bash
    pm2 restart bottrade-backend bottrade-frontend bottrade-engine
    ```
  * Lihat logs:
    ```bash
    pm2 logs bottrade-backend
    ```
  * Membangun frontend (Production Build):
    ```bash
    npm run build  # di folder /root/bottrade/frontend
    ```

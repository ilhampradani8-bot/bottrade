# 📌 Status Proyek BotTrade & Panduan Pengembang (Cheatsheet Sesi Baru)

> [!NOTE]
> **ATURAN PENGHEMATAN TOKEN UNTUK SESI AI BARU:**
> 1. JANGAN membuang-buang token untuk memindai semua file direktori atau menganalisis ulang struktur frontend/backend dari awal.
> 2. Baca file ini segera untuk memahami arsitektur proyek saat ini, konfigurasi port, dan status kode terakhir.
> 3. Langsung eksekusi fitur atau perbaiki masalah berdasarkan cetak biru (blueprint) di bawah ini.

---

## 1. 🚀 Gambaran Umum & Status Proyek

* **Status**: *Pengembangan Aktif & Pemolesan Antarmuka (UI) - **Minimalist Edge-to-Edge, Global Light/Dark Theme & Apple-Vibe Sleek Layout Selesai 100%***
  * **TradingSafe Engine**: **Analysis Engine (Rust)** 24/7 + **WhatsApp Bridge (Node.js)** berjalan kokoh di background VPS.
  * **Backend App**: **Engine24am** (Loop worker dinamis berbasis Tokio, mesin analisis data Polars, sinkronisasi DB setiap 10 detik).
  * **Frontend**: **Next.js 16 (Turbopack) + Tailwind CSS v4** (Antarmuka modern premium bergaya Apple dengan sistem tema dual-mode).
  * **Host API Utama**: `http://139.59.122.230:8080/api` (Backend Rust).
  * **Design Standard**: Sesuai panduan visual premium **2026 Minimalist High-Density, Apple-Vibe Dynamic Layout & Seamless Color Mapping**.

---

## 2. 📁 Arsitektur Komponen Utama Frontend

Sebelum memodifikasi UI, harap ketahui implementasi yang telah selesai berikut ini:

### A. Sidebar Navigasi Collapsible (`Sidebar.tsx`)
* **Lokasi**: `/root/bottrade/frontend/src/components/Sidebar.tsx`
* **Lebar Tipis & Collapsible**: Menyusut dari ukuran lebar `w-72` menjadi lebar tipis **`w-56` (224px)** untuk memaksimalkan ruang kerja.
* **Desktop Collapse**: Mendukung fitur sembunyi/collapse penuh di layar desktop. Apabila `isOpen` bernilai `false`, sidebar menciut ke lebar `w-0` dengan efek transisi transparansi (`opacity-0 border-r-0`) yang sangat mulus.
* **Tinggi Sinkron**: Menggunakan tinggi dinamis `h-[calc(100vh-56px)]` agar presisi terhadap tinggi Navbar baru.

### B. Header Ramping & Sistem Tema Dual-Mode (`Navbar.tsx`)
* **Lokasi**: `/root/bottrade/frontend/src/components/Navbar.tsx`
* **Tinggi Sangat Padat**: Diperkecil dari `h-20` (80px) menjadi **`h-14` (56px)** untuk menghemat ruang kerja vertikal.
* **Sistem Tema Mode Terang & Gelap**:
  * Menambahkan tombol toggle mode (`Mode: dark` / `Mode: light`) yang dilengkapi dengan ikon Matahari ☀️ dan Bulan 🌙.
  * Tombol ditempatkan di dalam dropdown profil untuk pengguna terdaftar, serta di dalam dropdown *Get Started* untuk tamu (anonim).
  * Pilihan tema disimpan secara persisten di `localStorage` dan secara dinamis mengubah class `light-theme` pada tag `body` tanpa visual flicker saat reload.

### C. Portal Auth Neuromorphic (`AuthModal.tsx`)
* **Lokasi**: `/root/bottrade/frontend/src/components/AuthModal.tsx`
* **Keamanan Stacking (Portal)**: Dirender langsung ke `document.body` menggunakan React Portal.
* **Gaya Neuromorphic Dark Mode**: Sunken fields pada input (`bg-[#06070a]`) dan raised buttons (`bg-gradient-to-br from-blue-600 to-blue-700`).

### D. Tata Letak Penuh Tanpa Celah (Edge-to-Edge Full-Width)
* **Status**: Seluruh halaman dashboard (`Overview`, `StrategySettings`, `ApiSettings`, `LabSimulasi`, `JurnalRiwayat`, `ChatSupport`) kini dikonfigurasi **100% full-width tanpa celah**.
* **Layout Wrapper**: Di dalam `AdminLayout.tsx`, area pembungkus utama disetel ke **`p-0`** dan **`max-w-none w-full`** secara global. Seluruh margin/padding luar dikontrol secara mandiri oleh masing-masing sub-komponen secara presisi.
* **Viewport Tinggi Selaras**: Panel visual utama (TradingView di `StrategySettings` dan chat box di `ChatSupport`) menggunakan tinggi dinamis `h-[calc(100vh-56px)]` untuk mengisi sisa layar vertikal secara sempurna.

### E. Dashboard Kokpit Strategi Padat & Taktil (`StrategySettings.tsx`)
* **Arsitektur Bot-Centric Tab**: Mengganti sistem sub-tab lama dengan navigasi tab utama 5-bot (DCA Lite, Smart DCA, Grid Master, Hybrid, Trailing) yang super ringkas (`text-[8.5px] py-1.5`) langsung di bagian atas panel kontrol.
* **Gaya Dark Neumorphic Taktil**: Seluruh tombol aksi, tab pilihan, sakelar (toggle), platform selector, dan CTA utama (Save & Start) menggunakan visual fisik **dark neumorphism**.
* **Grid 2-Kolom Desktop Responsif**: Kolom input nilai pendek otomatis tersusun berdampingan dalam **2 baris/kolom di mode desktop (`xl:grid-cols-2`)** dan bertumpuk vertikal dalam **1 kolom di mode HP (`grid-cols-1`)**. Menjamin visual tetap padat dan efisien ruang.
* **Popup Mobile Full-Screen Edge-to-Edge**: Di layar HP, popup konfigurasi strategi terbuka penuh menutup TradingView Chart secara penuh mulai tepat di bawah Navbar (`top-14 z-[100] h-[calc(100vh-56px)]`). Ini mencegah bentrokan z-index dengan TradingView iframe dan memberikan fokus penuh.

### F. Global Footer "Hide/View Info" Apple-Vibe (`Footer.tsx`)
* **Lokasi**: `/root/bottrade/frontend/src/components/Footer.tsx`
* **Integrasi Global**: Dirender secara terpusat di paling bawah layout utama `AdminLayout.tsx` sehingga tampil di semua halaman dan secara kokoh duduk di bagian terbawah viewport.
* **Desain Apple-Vibe Sangat Rapi**:
  * *Tampilan Default (Collapsed):* Hanya menampilkan teks copyright legal singkat **`© 2026 TRADINGSAFE. ALL RIGHTS RESERVED.`** dan tombol toggle **`>`** (Chevron). Sangat bersih, tipis, dan berkelas!
  * *Tampilan Lengkap (Expanded):* Saat tombol `>` diklik, panel bergeser turun secara dinamis memunculkan baris kartu kontak (Find us, Call us, Mail us), kolom link navigasi cepat (Useful Links), deskripsi ringkas beserta ikon sosial media SVG, dan kolom langganan email.
  * *Unifikasi Tipografi:* Semua teks diatur seragam menggunakan micro-typography premium **`text-[11px]`** dengan spasi renggang (`tracking-widest`) untuk mewujudkan nuansa Apple premium.

---

## 3. 🛠 Detail Teknologi & Perintah Pengembangan

* **Lokasi Frontend**: `/root/bottrade/frontend`
* **Lokasi Backend**: `/root/bottrade/backend`
* **Lokasi TradingSafe Rust Engine**: `/root/bottrade/engine`
* **Lokasi WhatsApp Node.js Bridge**: `/root/bottrade/whatsapp-service`
* **Server Pengembangan**: `npm run dev` (dijalankan di dalam folder `frontend`)
* **Build Produksi**: `npm run build`
* **Pembersihan Cache Turbopack**: Jika Anda menemui error Chunk Load atau blank:
  ```bash
  rm -rf .next && npm run dev
  ```

---

## 4. 🚀 TradingSafe Auto-Analysis & WhatsApp Microservice (24/7 Production-Ready)

Mesin analisis pasar kripto otomatis yang terintegrasi dengan jembatan WhatsApp Baileys dan Telegram.

### A. Komponen & Alur Data
1. **Rust Engine (`analysis-engine`)**:
   * Menghubungkan secara real-time ke Binance WebSocket untuk melacak 5 koin top (BTC, ETH, SOL, BNB, XRP) di 4 timeframe (5m, 15m, 1h, 1d).
   * Melakukan kalkulasi teknikal RSI (14) & EMA (50) di setiap penutupan candle.
   * **Bilingual Twin-Broadcast**: Secara dinamis menghasilkan laporan versi Indonesia dan Inggris saat terjadi breakout/heartbeat berkala.
2. **WhatsApp Service (`index.js` - Node.js)**:
   * Berjalan pada port `5002` dengan persistensi sesi otentikasi di folder `auth_info`.
   * Berperan sebagai jembatan HTTP REST API (`/send`) yang dipanggil Rust engine untuk mengirim pesan ke ID grup tujuan.

### B. Konfigurasi Khusus & Target Routing
* **Welcome Bot Investor (`120363408324880520@g.us`)**: Menyambut anggota baru dengan pesan profesional Bahasa Indonesia dan mengarahkan mereka untuk membaca proposal lengkap di Deskripsi Grup.
* **Group Analisa Bahasa Indonesia (`120363427987942506@g.us` & Telegram)**: Menerima seluruh laporan analisis berkala dan breakout versi Bahasa Indonesia secara real-time.
* **Group Analisa Bahasa Inggris (`120363409228885921@g.us`)**: Menerima seluruh laporan analisis berkala dan breakout versi Bahasa Inggris secara real-time.

### C. Standalone V2 Prediction Test Engine (`prediction-v2`)
* **Status**: **Aktif Berjalan Secara Penuh di Grup Utama & Telegram** (Menggantikan V1 untuk seluruh pengiriman notifikasi publik).
* **Fitur Canggih Terbaru**:
  * **Target Routing V2 Baru**: Seluruh notifikasi prediksi V2 Bahasa Indonesia sekarang dialihkan langsung ke grup utama WhatsApp **`120363427987942506@g.us`** serta dikirimkan ke **Telegram** (default Chat ID).
  * **V1 Disimpan (Dormant/Ditinjau)**: Kode dan logic teknikal dari `analysis-engine` (V1) tetap aktif berjalan di background, namun seluruh pengiriman ke WhatsApp grup dan Telegram dinonaktifkan (dikomentari) agar tidak terjadi duplikasi atau spam.
  * **Anti-Spam Cooldown**: Menghindari pengiriman pesan berlebih dengan memaksakan jeda tenang (*cooldown*) selama **15 menit** setelah suatu siklus prediksi koin selesai (TARGET_HIT, STOP_LOSS_HIT, atau TIMEOUT) sebelum prediksi baru pada koin tersebut bisa dipicu kembali.
  * **Format Desimal Dinamis (Coin-Specific Decimals)**: Koin bernilai rendah seperti **XRP** menggunakan format **4 desimal** (contoh: Entry: $1.2435, TP: $1.2497) agar target profit (TP) dan batas keluar tidak tampak identik akibat pembulatan desimal. Koin besar lainnya tetap menggunakan format 2 desimal standar.
  * **Pesan Profesional**: Tajuk pesan diubah menjadi lebih rapi dan formal: `[TRADINGSAFE V2]` (menghapus kata "PAMER PREDIKSI").
  * **Threaded Quoted Reply (WhatsApp & Telegram)**: Robot menyimpan ID pesan awal saat memicu prediksi baru di WhatsApp & Telegram. Ketika status prediksi berubah menjadi **Target Tercapai**, **Batal**, atau **Batas Waktu Habis**, robot secara otomatis membalas (*reply/quote*) pesan prediksi awal tersebut di grup WhatsApp masing-masing serta utas chat Telegram agar riwayat teratur dan transparan.
  * **Log Riwayat Prediksi Persisten**: Setiap peristiwa siklus hidup prediksi didokumentasikan otomatis ke dalam berkas log JSON terstruktur di `/root/bottrade/logs/prediction_history.json`.
  * **Dukungan Prediksi Bearish**: Mendukung pendeteksian penuh baik untuk sinyal naik (**BULLISH CALL**) maupun turun (**BEARISH CALL**) secara real-time pada timeframe 15 menit menggunakan EMA (50) & RSI (14).

---

## 5. 🧠 Cetak Biru (Blueprint) untuk Sesi AI Baru (Petunjuk Langsung)

Saat pengguna memberikan perintah baru di sesi berikutnya:
1. **Patuhi Batasan Tinggi (Navbar Height)**: Navbar utama bertinggi mutlak `56px` (`h-14`). Semua layout baru yang membutuhkan tinggi penuh wajib mengikuti rumus tinggi dinamis `h-[calc(100vh-56px)]`.
2. **Pertahankan Layout Edge-to-Edge**: Jangan sekali-kali menambahkan margin atau padding luar tebal (`p-6` atau `max-w-7xl mx-auto`) di tingkat tata letak utama `AdminLayout.tsx`. Layout harus tetap menempel penuh hingga ke batas tepi window browser.
3. **Pelihara Estetika Neumorphic & High-Density**: Jika menambahkan kontrol tombol baru, pastikan menggunakan kelas bayangan ganda taktil (`shadow-[3px_3px_6px...]` atau kelas `.neumorphic-btn` di `globals.css`) dan tinggi ramping (`rounded-[4px]` dan `py-1.5`) agar konsisten dengan dashboard kokpit trading 2026.
4. **Optimalkan Transisi Sidebar**: State `isSidebarOpen` dikontrol oleh pengguna melalui tombol toggle Navbar. Gunakan transisi properti lebar (`w-56` ke `w-0`) untuk menyembunyikan sidebar di desktop secara elegan.
5. **Manajemen Service Latar Belakang (VPS)**:
   * **Restart WhatsApp Bridge**: `pkill -f "node index.js"` dan jalankan kembali `nohup node index.js > /root/bottrade/logs/whatsapp-bridge.log 2>&1 &` di folder `whatsapp-service`.
   * **Restart Rust Engine Utama**: `pkill -f "target/release/analysis-engine"` dan jalankan kembali `nohup target/release/analysis-engine > /root/bottrade/logs/analysis-engine.log 2>&1 &` di folder `engine` (atau jalankan script `bash build.sh`).
   * **Restart Rust V2 Prediction Standalone**: `pkill -f "target/release/prediction-v2"` dan jalankan kembali `nohup target/release/prediction-v2 > /root/bottrade/logs/prediction-v2.log 2>&1 &` di folder `engine` (atau jalankan script `bash build_v2.sh`).
6. **Pemantauan Real-time Log**:
   * WhatsApp Bridge: `tail -f /root/bottrade/logs/whatsapp-bridge.log`
   * Analysis Engine Utama: `tail -f /root/bottrade/logs/analysis-engine.log`
   * V2 Prediction Engine: `tail -f /root/bottrade/logs/prediction-v2.log`
   * Prediction JSON History: `cat /root/bottrade/logs/prediction_history.json`

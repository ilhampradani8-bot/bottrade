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
  * **Automated Marketing Engine**: **Marketing Bot (Rust)** terintegrasi Groq API (Llama 3.3) berjalan otonom di background VPS.
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

### C. Standalone V2 Prediction Test Engine (`prediction-v2`)
* **Status**: **Aktif Berjalan Secara Penuh di Grup Utama & Telegram** (Menggantikan V1 untuk seluruh pengiriman notifikasi publik).
* **Fitur Canggih Terbaru**:
  * **Target Routing V2 Baru**:
    * **WhatsApp**: Notifikasi sinyal dengan arah naik (UP) dikirimkan ke grup utama WhatsApp **`TradingSafe - Up Predictions` (`120363427987942506@g.us`)**, sedangkan arah turun (DOWN) dikirimkan ke grup khusus WhatsApp **`TradingSafe - Down Predictions` (`120363409651722299@g.us`)**. Pengantar sinyal dan pesan sambutan di kedua grup ini sepenuhnya disajikan dalam **Bahasa Inggris**. Grup Bahasa Inggris lama (`120363409228885921@g.us`) telah dinonaktifkan (dihentikan).
    * **Telegram**: Sinyal dengan arah naik (UP) dikirim ke group utama (`TELEGRAM_CHAT_ID="-1003973511282"`), sedangkan sinyal dengan arah turun (DOWN) dialihkan ke group khusus (`TELEGRAM_CHAT_ID_DOWN="-5215838199"`).
  * **V1 Disimpan (Dormant/Ditinjau)**: Kode dan logic teknikal dari `analysis-engine` (V1) tetap aktif berjalan di background, namun seluruh pengiriman ke WhatsApp grup dan Telegram dinonaktifkan (dikomentari) agar tidak terjadi duplikasi atau spam.
  * **Anti-Spam Cooldown**: Menghindari pengiriman pesan berlebih dengan memaksakan jeda tenang (*cooldown*) selama **15 menit** setelah suatu siklus prediksi koin selesai (TARGET_HIT, STOP_LOSS_HIT, atau TIMEOUT) sebelum prediksi baru pada koin tersebut bisa dipicu kembali.
  * **Format Desimal Dinamis (Coin-Specific Decimals)**: Koin bernilai rendah seperti **XRP** menggunakan format **4 desimal** (contoh: Entry: $1.2435, TP: $1.2497) agar target profit (TP) dan batas keluar tidak tampak identik akibat pembulatan desimal. Koin besar lainnya tetap menggunakan format 2 desimal standar.
  * **Pesan Profesional**: Tajuk pesan diubah menjadi lebih rapi dan formal: `[TRADINGSAFE V2]` (menghapus kata "PAMER PREDIKSI").
  * **Threaded Quoted Reply (WhatsApp & Telegram)**: Robot menyimpan ID pesan awal saat memicu prediksi baru di WhatsApp & Telegram. Ketika status prediksi berubah menjadi **Target Tercapai**, **Batal**, atau **Batas Waktu Habis**, robot secara otomatis membalas (*reply/quote*) pesan prediksi awal tersebut di grup WhatsApp masing-masing serta utas chat Telegram agar riwayat teratur dan transparan.
  * **Log Riwayat Prediksi Persisten**: Setiap peristiwa siklus hidup prediksi didokumentasikan otomatis ke dalam berkas log JSON terstruktur di `/root/bottrade/logs/prediction_history.json`.
  * **Dukungan Prediksi Bearish**: Mendukung pendeteksian penuh baik untuk sinyal naik (**BULLISH CALL**) maupun turun (**BEARISH CALL**) secara real-time pada timeframe 15 menit menggunakan EMA (50) & RSI (14).

---

## 5. 🛠 Detail Teknologi & Perintah Pengembangan

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

## 6. 📢 TradingSafe Automated Marketing & Copywriting Engine

Sistem otomatisasi copywriting iklan berbasis AI menggunakan Groq API (`llama-3.1-8b-instant`) dan Rust Daemon.

### A. Fitur Utama & Cara Kerja
1. **Otonom 1-Hour Scheduling**: Konten pemasaran diposting secara konsisten setiap 1 jam sekali. Jadwal dihitung secara otomatis dan disimpan secara persisten di `/root/bottrade/logs/marketing_state.json`. Apabila jadwal berikutnya tersimpan lebih dari 1 jam di masa depan, sistem otomatis memotongnya ke maksimal 1 jam dari sekarang.
2. **Event-Driven Target Hit**: Bereaksi instan saat target profit koin tercapai (`TARGET_HIT` event terdeteksi di log history) untuk menyusun caption performa/keberhasilan sinyal secara real-time.
3. **Pilar Konten Dinamis (Proposal-Based)**: 
   * AI menyusun konten bernilai orisinal dan bervariasi dengan tema: visi asisten trading kalkulatif 24 jam tanpa emosi, keamanan dana 100% di dompet pengguna (*non-custodial*), tanpa biaya bagi hasil (*no profit fee*), desain antarmuka minimalis modern Apple-vibe, transparansi sinyal tanpa manipulasi, dan program promo gratis akses rilis beta.
4. **Log Anti-Repetisi (Anti-Repeat)**: 
   * Bot menyimpan 5 topik postingan terakhir di berkas state. Log topik ini diumpankan kembali ke prompt Groq API untuk memastikan tidak ada pengulangan pilar konten berturut-turut.
5. **Kepatuhan Format & Batasan Sosial**:
   * **Bilingual ke English-Only**: Seluruh postingan pemasaran (WhatsApp, Telegram, dan Buffer) sekarang disajikan sepenuhnya dalam **Bahasa Inggris** (tidak ada lagi postingan ganda Indonesia/Inggris). Laporan Info Pasar Kripto juga dikonversi ke format Bahasa Inggris.
   * **Real-time Push (Immediate Publishing)**: Menggunakan mode `"shareNow"` (bukan `"addToQueue"`) di API GraphQL Buffer. Ini mempublikasikan konten secara instan dari VPS ke Threads dan X (Twitter), sehingga melompati batasan kuota antrean 10 postingan di akun gratis Buffer.
   * **Safety Character Limit (Twitter/X)**: Melindungi pengiriman dari kegagalan akibat batas 280 karakter Twitter. Di dalam modul `notifications.rs`, postingan yang ditargetkan untuk Twitter/X yang melebihi 280 karakter akan otomatis dipotong secara aman pada karakter ke-277 dan disematkan akhiran `...`.
   * **Bebas Jargon Teknis**: Teks bebas dari istilah komputer (seperti *Rust, latency, database, non-custodial, API keys, dll*), digantikan dengan keunggulan bisnis yang mudah dipahami orang awam.
   * **Multi-Platform Distribution**: Mengirimkan hasil tulisan secara paralel ke WhatsApp, Telegram, dan Buffer (X & Threads).
   * **Robust Telegram Deliverability**: Jika pengiriman dengan format Markdown gagal, sistem secara otomatis melakukan retry pengiriman pesan dalam format teks polos (plain text) untuk menjamin postingan selalu terkirim tanpa gagal.

# Apple Modern UI Design Principles 🍏

Dokumen ini berfungsi sebagai pedoman utama untuk membangun antarmuka web yang mengikuti estetika ekosistem Apple (iOS/macOS), menggabungkan **Human Interface Guidelines (HIG)** dengan teknologi web modern.

---

## 1. Fondasi Desain & Sumber Daya

### 🎨 Visual & Ikonografi
*   **SF Symbols**: Gunakan [SF Symbols](https://developer.apple.com/sf-symbols/) sebagai referensi utama ikonografi. Untuk web, ekspor ke format SVG atau gunakan alternatif seperti **Lucide Icons** yang memiliki *stroke weight* serupa.
*   **Apple Design Resources**: Gunakan kit resmi untuk [Figma](https://www.figma.com/community/file/1406654123009283715/ios-design-library-ui-components-and-templates) guna mempelajari grid, spacing, dan radius sudut yang presisi.

### 🔡 Tipografi (San Francisco)
Jangan mengunduh file font sembarangan. Gunakan *system font stack* agar otomatis memanggil font asli di perangkat Apple:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
```

---

## 2. Tech Stack Direkomendasikan

Untuk meniru komponen Apple dengan presisi tinggi, gunakan kombinasi berikut:

| Alat | Kegunaan |
| :--- | :--- |
| **Tailwind CSS** | Mempermudah pembuatan efek Glassmorphism dan radius sudut spesifik. |
| **Shadcn/ui** | Library komponen minimalis yang bersih (clean) dan elegan. |
| **Framer Motion** | Standar untuk membuat animasi "spring" (kenyal) dan transisi halus khas iOS. |

---

## 3. Elemen Visual Kunci

### ✨ Glassmorphism (Efek Kaca)
Gunakan perpaduan blur latar belakang dengan opasitas rendah:
*   **CSS**: `backdrop-filter: blur(20px);`
*   **Background**: `rgba(255, 255, 255, 0.7)` (Light) atau `rgba(0, 0, 0, 0.4)` (Dark).

### 📐 Corner Radius (Squircle)
Apple menggunakan radius sudut yang besar dan lembut:
*   **Cards**: 12px hingga 24px.
*   **Buttons**: 10px hingga 14px.

### 🔝 Hierarki Tipografi
*   **Contrast**: Gunakan `font-weight: 700` (Bold) untuk judul besar dan `font-weight: 400/500` untuk konten.
*   **Spacing**: Jaga *tracking* (letter-spacing) tetap rapat untuk judul besar agar terlihat lebih modern.

---

## 4. Filosofi Interaksi (Prinsip Utama)

### 📱 Adaptive Layout
Desain harus terasa "asli" di setiap ukuran layar. Jangan hanya mengecilkan elemen:
*   **Mobile**: Gunakan *bottom navigation bar* agar mudah dijangkau satu tangan.
*   **Desktop**: Gunakan *sidebar* untuk memanfaatkan ruang horizontal.
*   **Transition**: Gunakan transisi halus saat elemen berpindah tempat untuk menjaga konteks pengguna.

### 🖼️ Content Deference
Antarmuka harus "mengalah" terhadap konten. UI tidak boleh mendominasi perhatian:
*   **Minimalist Chrome**: Gunakan bezel dan border seminimal mungkin.
*   **Negative Space**: Berikan ruang napas yang cukup agar data (chart, profit, log) menjadi pusat perhatian.
*   **Transparency**: Gunakan efek translusen agar user tetap merasa terhubung dengan konteks di bawah lapisan UI.

---

---

## 5. ⚡ Prinsip UI Minimalis Padat & Full-Width 2026

Untuk mendukung kejelasan data, fungsionalitas, serta efisiensi ruang antarmuka, terapkan pedoman minimalis terbaru berikut ini:

### 📏 Tata Letak Sangat Padat (Compact Spacing)
*   **Minimal Padding & Margins**: Kurangi ruang kosong berlebih di desktop maupun mobile. Gunakan padding halaman luar yang sangat rapat (`lg:p-6` secara umum, dan khusus untuk dashboard/overview batasi ke `p-1 lg:px-2 lg:py-4` untuk merapat ke pinggir layar).
*   **Snug Component Layout**: Spasi vertikal antar-komponen utama dipersempit (`space-y-4` alih-alih `space-y-8`) untuk memastikan semua metrik penting tampil langsung di satu halaman layar (*above the fold*).

### 📐 Hapus Desain Kartu Boxy (Flat Line Border Design)
*   **Tanpa Latar Kartu Solid**: Hapus semua blok latar kartu solid (seperti `bg-[#0a0c14]`) dan bayangan luar (*box shadows*) tebal yang membuat antarmuka terasa berat dan kaku.
*   **Garis subtle sebagai Pembatas**: Batasi pembagian struktur data hanya menggunakan garis tipis horizontal dan vertikal yang elegan (`border-t`, `border-b`, `divide-x divide-white/10`) di atas latar belakang transparan.

### 🖼️ Rentang Penuh (Edge-to-Edge Full-Width)
*   **Tanpa Jarak Samping**: Seluruh grafik, tabel, grid, dan daftar data wajib merentang penuh 100% (`w-full`) hingga menyentuh batas garis horizontal/vertikal tepi halaman (gunakan `px-0` pada kontainer grafik serta hilangkan margin bawaan chart seperti `<AreaChart margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>`).

### 🔘 Desain Kartu Khusus untuk Tombol Aksi (Cards on Interactive Buttons Only)
*   **Pembatasan Elemen Kartu**: Desain ala kartu mikro bertingkat (*raised / sunken card*), efek border tebal, hover scaling, atau background khusus **hanya** diperbolehkan pada elemen interaktif yang bisa diklik (seperti tombol aksi utama, tombol toggle, atau dropdown).
*   **Data Statis Rata**: Komponen visual data statis murni harus dibuat flat/rata dan transparan tanpa dekorasi kartu.

### 🚫 Bersih dari Jargon Dekoratif (Clutter-Free & Professional)
*   **Hapus Teks Berlebihan**: Hilangkan semua tulisan dekoratif non-profesional yang merusak kemurnian data (seperti jargon "SISTEM TRADING SAFE BEROPERASI NORMAL", status "ONLINE / SECURE" yang tidak memiliki fungsi klik). Antarmuka harus fokus penuh pada data angka nyata dan fungsionalitas murni.

### 📐 Standardisasi Radius Ujung Sedikit Tumpul (Subtle Rounded Corner Standard)
*   **rounded-[6px] & rounded-t-[12px]**: Gunakan standard `rounded-[6px]` untuk semua border tombol interaktif, selector, input field, dan kartu mini. Desain ini menjaga bentuk visual tetap terasa kotak (*sharp*), namun memiliki sentuhan ujung tumpul yang halus (*slightly rounded*) agar terkesan premium, rapi, dan tidak menusuk mata. Untuk mobile slide-up sheets/popups, gunakan radius sudut atas `rounded-t-[12px]` yang lebih lembut.

### 🗂️ Desain Pop-Up Tidy Berbasis Tab (Step-by-Step Tabbed Control Popups)
*   **Tab-Based Step Form**: Untuk pop-up konfigurasi atau control setup yang memiliki banyak parameter, dilarang menampilkan semua field secara vertikal sekaligus. Rapikan menggunakan pembagian tab terstruktur (seperti **CORE**, **LOGIC**, **RISK & RUN**). Ini menghindari kejenuhan informasi (*cognitive overload*) bagi pengguna dan memberikan navigasi konfigurasi yang responsif, terarah, dan premium.

---

## 6. Alat Bantu & Standar Pengembangan

*   **Responsive Design Mode**: Selalu uji tampilan menggunakan Inspector Browser mode iPhone/iPad.
*   **Area Klik (Hit Targets)**: Pastikan elemen interaktif memiliki area klik minimal **44x44 points** agar nyaman digunakan dengan jari.
*   **Smooth Motion**: Hindari animasi linear. Gunakan *easing* `cubic-bezier(0.4, 0, 0.2, 1)` untuk gerakan yang terasa lebih natural dan premium.

---

## Referensi & Inspirasi
1. [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
2. [iOS Design Library - Figma Community](https://www.figma.com/community/file/1406654123009283715)
3. [Design Systems Collective](https://www.designsystemscollective.com)

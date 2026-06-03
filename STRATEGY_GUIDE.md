# 📖 Strategy Development Guide

Agar strategi Anda dapat berjalan otomatis di **Engine24am**, setiap file di `backend/src/strategies` harus mengikuti standar interface berikut.

## 🛠️ Struktur Dasar (Trait)

Setiap strategi harus mengimplementasikan fungsi `analyze` dengan input data pasar dan output berupa `Signal`.

```rust
pub enum Signal {
    Buy(f64),  // Harga beli yang disarankan
    Sell(f64), // Harga jual yang disarankan
    Hold,      // Tidak ada aksi
}

pub trait BaseStrategy {
    fn name(&self) -> &str;
    fn analyze(&self, data: &DataFrame) -> Signal;
}
```

## 📏 Aturan Penulisan
1. **Gunakan Polars**: Selalu terima data dalam bentuk `DataFrame` untuk performa maksimal.
2. **Stateless**: Jangan simpan data di dalam struct strategi. Gunakan buffer yang disediakan oleh `bot24jam`.
3. **Konfigurasi**: Jika strategi butuh parameter (seperti periode RSI), ambil dari tabel `strategies.config` di database.
4. **Return Value**:
   - `Signal::Buy(price)`: Menginstruksikan bot untuk melakukan entri.
   - `Signal::Sell(price)`: Menginstruksikan bot untuk melakukan exit/Take Profit.
   - `Signal::Hold`: Tetap memantau tanpa aksi.

## 📂 Contoh File (`dca_pro.rs`)
```rust
pub struct DcaPro;

impl BaseStrategy for DcaPro {
    fn name(&self) -> &str { "DCA PRO" }
    fn analyze(&self, df: &DataFrame) -> Signal {
        // Logika indikator di sini...
        Signal::Hold
    }
}
```

---
*Mesin akan secara otomatis melakukan loop dan memberikan data candle terbaru ke fungsi `analyze` Anda setiap detik.*

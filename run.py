# run.py
# SATU-SATUNYA FILE YANG PERLU ANDA JALANKAN
# File ini bertindak sebagai titik masuk utama untuk aplikasi.
# Karena berada di direktori root, Python secara otomatis akan mengenali
# folder 'tester' dan 'engine' sebagai modul yang dapat diimpor.

import logging
from kontrol.running import app

if __name__ == "__main__":
    # Konfigurasi logging dasar
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    # Pesan startup
    print("===========================================================")
    print("-> Meluncurkan Suite Backtesting Berbasis Web...")
    print("-> Buka browser Anda dan akses: http://127.0.0.1:8080")
    print("===========================================================")
    
    # Menjalankan aplikasi Flask dari kontrol.running
    # host='0.0.0.0' membuat server dapat diakses dari jaringan lokal
    # debug=True akan secara otomatis me-restart server jika ada perubahan kode
    app.run(host='0.0.0.0', port=8080, debug=True)

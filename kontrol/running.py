
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import logging

# Tambahkan path proyek ke sys.path untuk memungkinkan impor dari direktori lain
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

# Impor modul kita setelah path diatur
from tester import data_handler, backtest_engine
from strategi import dca, rsi_dca, ema_cross, bollinger_bands

# Konfigurasi logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Inisialisasi Aplikasi Flask
app = Flask(__name__, static_folder=os.path.join(project_root, 'admin'), static_url_path='')
CORS(app) # Aktifkan CORS untuk akses lintas domain

@app.route('/')
def serve_admin_page():
    """Melayani halaman admin utama."""
    return send_from_directory(app.static_folder, 'admin_tester.html')

@app.route('/admin_getdata.html')
def serve_getdata_page():
    """Melayani halaman pengambilan data."""
    return send_from_directory(app.static_folder, 'admin_getdata.html')

@app.route('/api/coins')
def get_coins():
    """Mendapatkan daftar koin dari Binance (Real-time)."""
    import requests
    try:
        response = requests.get("https://api.binance.com/api/v3/exchangeInfo")
        data = response.json()
        symbols = [s for s in data['symbols'] if s['status'] == 'TRADING' and s['quoteAsset'] == 'USDT']
        
        coins = []
        for s in symbols:
            coins.append({
                "name": f"{s['baseAsset']} / USDT",
                "symbol": f"{s['baseAsset']}/IDR", # Tetap simpan sebagai /IDR untuk kompatibilitas data_handler
                "binance": s['symbol']
            })
        return jsonify(coins)
    except Exception as e:
        # Fallback ke list lokal jika API gagal
        import json
        try:
            with open(os.path.join(project_root, 'tester', 'coin_list.json'), 'r') as f:
                return jsonify(json.load(f))
        except:
            return jsonify([])

@app.route('/api/fetch_data', methods=['POST'])
def fetch_and_save_data():
    """Endpoint untuk mengambil data dari API dan menyimpannya ke database."""
    try:
        data = request.get_json()
        if not data or 'pair' not in data or 'days' not in data:
            return jsonify({"error": "Input tidak valid. Butuh 'pair' dan 'days'."}), 400

        pair = data['pair']
        days = int(data['days'])
        interval = data.get('interval', '5m')
        
        logging.info(f"Menerima permintaan untuk mengambil data: {pair} selama {days} hari dengan interval {interval}.")

        # 1. Ambil data dari API
        df = data_handler.get_historical_data_from_api(pair, days, interval)
        if df is None or df.empty:
            return jsonify({"error": "Gagal mengambil data dari CoinGecko."}), 500

        # 2. Simpan data ke database
        success, message = data_handler.save_data_to_db(df)
        if not success:
            return jsonify({"error": f"Gagal menyimpan data ke DB: {message}"}), 500

        return jsonify({"message": message})

    except Exception as e:
        logging.error(f"Kesalahan di endpoint /api/fetch_data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/start_backtest', methods=['POST'])
def start_backtest():
    """Endpoint untuk memulai proses backtesting."""
    try:
        config = request.get_json()
        if not config:
            return jsonify({"error": "Konfigurasi backtest tidak ditemukan."}), 400
            
        logging.info(f"Menerima permintaan backtest dengan konfigurasi: {config}")

        # Ambil parameter dari request
        pair = config.get('pair')
        days = int(config.get('periode', 90))
        modal_awal = float(config.get('modal', 0))
        strategi = config.get('strategi')
        interval = config.get('interval', '5m') # Ambil interval dari request

        if not all([pair, modal_awal > 0, strategi]):
            return jsonify({"error": "Parameter tidak lengkap atau tidak valid."}), 400

        # Dapatkan data dari database (dengan filter interval)
        historical_data = data_handler.get_data_from_db(pair, days, interval)
        if historical_data is None or historical_data.empty:
            return jsonify({
                "error": f"Data untuk {pair} ({interval}) tidak ditemukan di database. Silakan 'Ambil & Simpan Data' terlebih dahulu."
            }), 404

        # Pilih strategi
        params = {'investasi_per_periode': 100000} # Default
        
        if strategi == 'dca':
            hasil_akhir = backtest_engine.run(historical_data, modal_awal, dca.strategy, params)
        elif strategi == 'rsi_dca':
            hasil_akhir = backtest_engine.run(historical_data, modal_awal, rsi_dca.strategy, params)
        elif strategi == 'ema_cross':
            hasil_akhir = backtest_engine.run(historical_data, modal_awal, ema_cross.strategy, params)
        elif strategi == 'bollinger_bands':
            hasil_akhir = backtest_engine.run(historical_data, modal_awal, bollinger_bands.strategy, params)
        else:
            return jsonify({"error": f"Strategi '{strategi}' tidak dikenal."}), 400

        return jsonify(hasil_akhir)

    except Exception as e:
        # Menggunakan repr(e) untuk mendapatkan detail exception yang lebih kaya
        return jsonify({"error": f"Kesalahan server internal: {repr(e)}"}), 500
        
@app.route('/api/inventory')
def get_inventory():
    """Mendapatkan data yang tersedia di database."""
    try:
        return jsonify(data_handler.get_data_inventory())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Gunakan host='0.0.0.0' untuk membuat server dapat diakses dari luar container/VM
    # Gunakan port default 5000 atau port lain yang sesuai
    app.run(host='0.0.0.0', port=8080, debug=True)

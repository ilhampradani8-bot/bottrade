import requests
import pandas as pd
import os
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- KONFIGURASI API & DATABASE (DIAGNOSTIK) ---
API_KEY = os.getenv("COINGECKO_API_KEY")

# Berdasarkan pengujian, Binance memberikan data interval 5m yang jauh lebih baik.
BINANCE_API_URL = "https://api.binance.com/api/v3/klines"
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
logging.info(f"Mencoba mode kompatibilitas: Menargetkan {COINGECKO_API_URL} dengan header demo.")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_TABLE = "historical_ohlc"

from urllib.parse import quote_plus

# Membuat koneksi SQLAlchemy
db_engine = None
if DB_NAME and DB_USER and DB_PASSWORD:
    try:
        encoded_password = quote_plus(DB_PASSWORD)
        db_connection_str = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}"
        db_engine = create_engine(db_connection_str)
        logging.info("Koneksi database berhasil dikonfigurasi.")
    except Exception as e:
        logging.error(f"Gagal inisialisasi database engine: {e}")

def get_coingecko_id(symbol: str) -> str | None:
    """Memetakan simbol (misal: 'btc') ke ID CoinGecko (misal: 'bitcoin')."""
    try:
        url = f"{COINGECKO_API_URL}/coins/list"
        response = requests.get(url)
        response.raise_for_status()
        coins = response.json()
        for coin in coins:
            if coin['symbol'].lower() == symbol.lower():
                return coin['id']
    except Exception as e:
        logging.error(f"Gagal menghubungi API CoinGecko untuk mendapatkan daftar koin: {e}")
    return None

def get_binance_data(pair: str, interval: str = '5m', limit: int = 1000) -> pd.DataFrame | None:
    """
    Mengambil data historical dari Binance.
    """
    try:
        # Konversi pair (BTC/IDR -> BTCUSDT)
        asset = pair.split('/')[0].upper()
        # Binance menggunakan USDT untuk koin-koin IDR kecuali ada pair IDR spesifik
        symbol = f"{asset}USDT" 
        
        url = BINANCE_API_URL
        params = {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        }
        
        logging.info(f"Mengambil data {interval} untuk {symbol} dari Binance...")
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        df = pd.DataFrame(data, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume', 
            'close_time', 'quote_asset_volume', 'number_of_trades', 
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])
        
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].apply(pd.to_numeric)
        df['pair'] = pair.upper()
        df['interval'] = interval
        
        df = df[['pair', 'interval', 'timestamp', 'open', 'high', 'low', 'close']]
        logging.info(f"Berhasil mengambil {len(df)} titik data dari Binance.")
        return df

    except Exception as e:
        logging.error(f"Gagal mengambil data dari Binance: {e}")
        return None

def get_historical_data_from_api(pair: str, days: int, interval: str = '5m') -> pd.DataFrame | None:
    """
    Fungsi utama untuk mengambil data historis (Sekarang menggunakan Binance).
    """
    # Map 'days' ke limit (5m interval: 1 hari = 288 baris, 1h = 24 baris)
    # Kita ambil limit max 1000 agar data cukup lengkap
    limit = 1000
    
    df = get_binance_data(pair, interval, limit)
    
    if df is None or df.empty:
        logging.warning("Gagal ambil dari Binance.")
        return None
        
    return df

def save_data_to_db(df: pd.DataFrame) -> tuple[bool, str]:
    """Menyimpan DataFrame ke database MySQL, menangani duplikat."""
    if df is None or df.empty:
        return False, "DataFrame kosong."

    try:
        with db_engine.begin() as conn:
            conn.execute(text(f"CREATE TEMPORARY TABLE temp_ohlc LIKE {DB_TABLE}"))
            df.to_sql('temp_ohlc', con=conn, if_exists='append', index=False)
            upsert_query = text(f"""
                INSERT INTO {DB_TABLE} (pair, `interval`, timestamp, open, high, low, close)
                SELECT pair, `interval`, timestamp, open, high, low, close FROM temp_ohlc
                ON DUPLICATE KEY UPDATE
                    open = VALUES(open),
                    high = VALUES(high),
                    low = VALUES(low),
                    close = VALUES(close)
            """)
            conn.execute(upsert_query)
            conn.execute(text("DROP TEMPORARY TABLE temp_ohlc"))

        return True, f"{len(df)} baris data berhasil disimpan/diperbarui."
    except Exception as e:
        logging.error(f"Gagal menyimpan data ke database: {e}")
        return False, f"Gagal menyimpan data: {str(e)}"

def get_data_from_db(pair: str, days: int, interval: str = '5m') -> pd.DataFrame | None:
    """Mengambil data historis dari database MySQL filter berdasarkan interval."""
    try:
        query = text(f"SELECT * FROM {DB_TABLE} WHERE pair = :pair AND `interval` = :interval AND timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY) ORDER BY timestamp ASC")
        df = pd.read_sql(query, con=db_engine, params={"pair": pair.upper(), "interval": interval, "days": days})
        
        if df.empty:
            logging.warning(f"Data tidak ditemukan di database untuk {pair} ({interval}) dalam {days} hari terakhir.")
            return None
            
        df.set_index('timestamp', inplace=True)
        return df
    except Exception as e:
        logging.error(f"Gagal mengambil data dari database: {e}")
        return None

def get_data_inventory():
    """Mengambil daftar koin, interval, dan rentang tanggal yang tersedia di database."""
    if not db_engine:
        return {}
    
    try:
        with db_engine.connect() as conn:
            # Ambil daftar pair dan interval
            query = text(f"SELECT pair, `interval`, MIN(timestamp) as start_date, MAX(timestamp) as end_date, COUNT(*) as count FROM {DB_TABLE} GROUP BY pair, `interval`")
            result = conn.execute(query)
            inventory = []
            for row in result:
                inventory.append({
                    "pair": row[0],
                    "interval": row[1],
                    "start_date": row[2].strftime('%Y-%m-%d'),
                    "end_date": row[3].strftime('%Y-%m-%d'),
                    "count": row[4]
                })
            return inventory
    except Exception as e:
        logging.error(f"Gagal mengambil inventori data: {e}")
        return []

import pandas as pd
import requests
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_binance_data(symbol: str, interval: str, limit: int = 1000):
    """
    Mengambil data historical Klines/OHLC dari Binance.
    Symbol format: 'BTCUSDT'
    Interval: '1m', '5m', '15m', '1h', '4h', '1d'
    """
    url = "https://api.binance.com/api/v3/klines"
    params = {
        'symbol': symbol.upper(),
        'interval': interval,
        'limit': limit
    }
    
    try:
        logging.info(f"Mengambil data {interval} untuk {symbol} dari Binance...")
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Format respons Binance: [Open time, Open, High, Low, Close, Volume, Close time, ...]
        df = pd.DataFrame(data, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume', 
            'close_time', 'quote_asset_volume', 'number_of_trades', 
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])
        
        # Konversi tipe data
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].apply(pd.to_numeric)
        
        # Pilih kolom yang dibutuhkan
        df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
        
        logging.info(f"Berhasil mengambil {len(df)} titik data.")
        return df
        
    except Exception as e:
        logging.error(f"Gagal mengambil data dari Binance: {e}")
        return None

if __name__ == "__main__":
    # Test: Ambil data 5 menit terakhir (limit 1000 = ~3.5 hari)
    df = get_binance_data('BTCUSDT', '5m', 1000)
    if df is not None:
        print(df.head())
        print("\nInformasi Data:")
        print(f"Awal: {df['timestamp'].min()}")
        print(f"Akhir: {df['timestamp'].max()}")
        print(f"Jumlah baris: {len(df)}")

import pandas as pd
import logging
from datetime import datetime

def run(data, initial_capital, strategy_func, strategy_params):
    """
    Menjalankan simulasi backtest.
    
    Args:
        data (pd.DataFrame): Data OHLC historis (index: timestamp).
        initial_capital (float): Modal awal dalam mata uang quote (IDR).
        strategy_func (function): Fungsi strategi yang mengembalikan {'action', 'amount_cash', 'amount_asset'}.
        strategy_params (dict): Parameter tambahan untuk strategi.
        
    Returns:
        dict: Hasil statistik backtest.
    """
    if data is None or data.empty:
        return {"error": "Data kosong, tidak bisa melakukan backtest."}

    # Inisialisasi portofolio
    portfolio = {
        'cash': initial_capital,
        'asset_value': 0.0,       # Nilai aset saat ini dalam mata uang quote
        'asset_quantity': 0.0,    # Jumlah unit aset yang dimiliki
        'total_value': initial_capital,
        'average_price': 0.0,      # Harga rata-rata pembelian (cost basis)
        'transactions': []          # Catatan setiap transaksi
    }

    history = []
    
    # Hitung indikator teknis (SMA, RSI, Bollinger Bands)
    data = data.copy()
    data['sma20'] = data['close'].rolling(window=20).mean()
    data['sma50'] = data['close'].rolling(window=50).mean()
    
    # Simple RSI calculation
    delta = data['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    data['rsi'] = 100 - (100 / (1 + rs))

    # Bollinger Bands
    std_dev = data['close'].rolling(window=20).std()
    data['bb_upper'] = data['sma20'] + (std_dev * 2)
    data['bb_lower'] = data['sma20'] - (std_dev * 2)
    
    for index, row in data.iterrows():
        current_price = row['close']
        current_time = index
        
        # Jalankan strategi
        decision = strategy_func(row, portfolio, **strategy_params)
        
        # Eksekusi keputusan
        if decision['action'] == 'BUY':
            amount_cash = decision.get('amount_cash', 0)
            amount_asset = decision.get('amount_asset', 0)
            
            if portfolio['cash'] >= amount_cash > 0:
                # Update quantity
                old_qty = portfolio['asset_quantity']
                portfolio['asset_quantity'] += amount_asset
                portfolio['cash'] -= amount_cash
                
                # Update average price (Weighted Average)
                total_cost = (portfolio['average_price'] * old_qty) + amount_cash
                portfolio['average_price'] = total_cost / portfolio['asset_quantity'] if portfolio['asset_quantity'] > 0 else 0
                
                # Catat transaksi
                transaction = {
                    'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'action': 'BUY',
                    'price': current_price,
                    'amount_idr': amount_cash,
                    'amount_asset': amount_asset,
                    'total_portfolio': portfolio['cash'] + (portfolio['asset_quantity'] * current_price),
                    'sma20': row['sma20'],
                    'rsi': row['rsi']
                }
                portfolio['transactions'].append(transaction)

        elif decision['action'] == 'SELL':
            sell_quantity = decision.get('amount_asset', 0)
            if portfolio['asset_quantity'] >= sell_quantity > 0:
                received_cash = sell_quantity * current_price
                
                # Hitung profit dari transaksi ini
                profit_idr = received_cash - (portfolio['average_price'] * sell_quantity)
                
                portfolio['cash'] += received_cash
                portfolio['asset_quantity'] -= sell_quantity
                
                # Catat transaksi
                transaction = {
                    'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'action': 'SELL',
                    'price': current_price,
                    'amount_idr': received_cash,
                    'amount_asset': sell_quantity,
                    'profit_idr': profit_idr,
                    'total_portfolio': portfolio['cash'] + (portfolio['asset_quantity'] * current_price),
                    'sma20': row['sma20'],
                    'rsi': row['rsi']
                }
                
                # Reset average price jika semua terjual
                if portfolio['asset_quantity'] <= 1e-10:
                    portfolio['average_price'] = 0
                
                portfolio['transactions'].append(transaction)

        # Update nilai total portofolio harian/per bar
        portfolio['asset_value'] = portfolio['asset_quantity'] * current_price
        portfolio['total_value'] = portfolio['cash'] + portfolio['asset_value']
        
        history.append({
            'date': current_time.strftime('%Y-%m-%d %H:%M'),
            'value': portfolio['total_value'],
            'price': current_price,
            'sma20': row['sma20'] if not pd.isna(row['sma20']) else None,
            'rsi': row['rsi'] if not pd.isna(row['rsi']) else None,
            'bb_upper': row['bb_upper'] if not pd.isna(row['bb_upper']) else None,
            'bb_lower': row['bb_lower'] if not pd.isna(row['bb_lower']) else None
        })

    # Hitung hasil akhir
    total_profit = portfolio['total_value'] - initial_capital
    profit_pct = (total_profit / initial_capital) * 100
    
    return {
        "Laporan Backtest": {
            "Modal Awal": f"IDR {initial_capital:,.0f}",
            "Modal Akhir": f"IDR {portfolio['total_value']:,.0f}",
            "Total Keuntungan": f"IDR {total_profit:,.0f}",
            "Persentase Keuntungan": f"{profit_pct:.2f}%",
            "Jumlah Transaksi": len(portfolio['transactions'])
        },
        "Detail Portofolio Akhir": {
            "Saldo Kas (IDR)": f"IDR {portfolio['cash']:,.0f}",
            "Nilai Aset": f"IDR {portfolio['asset_value']:,.0f}",
            "Kuantitas Aset": f"{portfolio['asset_quantity']:.8f}"
        },
        "history": history,
        "transactions": portfolio['transactions']
    }

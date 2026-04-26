# strategi/dca.py
# Penjelasan: Strategi Dollar Cost Averaging (DCA) Standar dengan filter tren.
# Bot akan membeli koin dalam jumlah tetap setiap interval waktu yang ditentukan,
# namun hanya jika harga saat ini berada di bawah Simple Moving Average (SMA20).
# Ini bertujuan untuk menghindari pembelian di "puncak" tren jangka pendek.
# Penjualan dilakukan jika profit mencapai 5% atau profit 2% dengan indikasi tren melemah.

def strategy(row, portfolio, **kwargs):
    investasi_rutin = kwargs.get('investasi_per_periode', 100000)
    cash = portfolio.get('cash', 0)
    asset_qty = portfolio.get('asset_quantity', 0)
    current_price = row['close']
    avg_price = portfolio.get('average_price', 0)
    sma20 = row.get('sma20', 0)
    
    # Logika Jual (Take Profit)
    if asset_qty > 0 and avg_price > 0:
        profit_pct = (current_price - avg_price) / avg_price
        if profit_pct >= 0.05: # Jual jika profit 5%
            return {'action': 'SELL', 'amount_asset': asset_qty}
        elif profit_pct >= 0.02 and current_price > sma20 > 0: # Jual jika profit 2% & harga di atas MA
            return {'action': 'SELL', 'amount_asset': asset_qty}

    # Logika Beli Rutin (Hanya beli jika harga di bawah MA / 'diskon')
    if cash >= investasi_rutin and (current_price < sma20 or sma20 == 0):
        return {'action': 'BUY', 'amount_cash': investasi_rutin, 'amount_asset': investasi_rutin / current_price}
    
    return {'action': 'HOLD'}

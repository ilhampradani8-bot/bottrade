# strategi/ema_cross.py
# Penjelasan: Strategi klasis "Moving Average Crossover".
# Menggunakan dua garis: Cepat (SMA 20) dan Lambat (SMA 50).
# - Golden Cross: Terjadi saat garis SMA 20 memotong ke ATAS SMA 50. Ini sinyal BELI (Tren naik).
# - Death Cross: Terjadi saat garis SMA 20 memotong ke BAWAH SMA 50. Ini sinyal JUAL (Tren turun).
# Strategi ini sangat efektif pada pasar yang sedang trending (Trending Market).

def strategy(row, portfolio, **kwargs):
    cash = portfolio.get('cash', 0)
    asset_qty = portfolio.get('asset_quantity', 0)
    current_price = row['close']
    sma20 = row.get('sma20', 0)
    sma50 = row.get('sma50', 0)
    
    # Pastikan data indikator sudah tersedia
    if sma20 == 0 or sma50 == 0:
        return {'action': 'HOLD'}

    # Logika Golden Cross (Beli saat Tren Naik terkonfirmasi)
    if sma20 > sma50 and cash > 0:
        # Beli menggunakan seluruh uang kas (All-in) untuk memaksimalkan profit tren
        return {'action': 'BUY', 'amount_cash': cash, 'amount_asset': cash / current_price}
        
    # Logika Death Cross (Jual sebelum harga turun lebih jauh)
    elif sma20 < sma50 and asset_qty > 0:
        return {'action': 'SELL', 'amount_asset': asset_qty}
        
    return {'action': 'HOLD'}

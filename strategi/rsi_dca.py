# strategi/rsi_dca.py
# Penjelasan: Strategi Dynamic DCA yang dikombinasikan dengan indikator RSI (Relative Strength Index).
# Logika utamanya adalah "Buy the Fear": Semakin rendah RSI (semakin oversold), 
# maka bot akan melipatgandakan jumlah investasi (Martingale ringan).
# - RSI < 30: Beli 2x lipat dari modal standar.
# - RSI < 40: Beli 1.5x lipat dari modal standar.
# Penjualan dilakukan jika profit > 5% atau RSI > 70 (Overbought).

def strategy(row, portfolio, **kwargs):
    investasi_rutin = kwargs.get('investasi_per_periode', 100000)
    cash = portfolio.get('cash', 0)
    asset_qty = portfolio.get('asset_quantity', 0)
    current_price = row['close']
    avg_price = portfolio.get('average_price', 0)
    rsi = row.get('rsi', 50)
    
    # Logika Jual (Take Profit & RSI Filter)
    if asset_qty > 0 and avg_price > 0:
        profit_pct = (current_price - avg_price) / avg_price
        # Jual jika profit sangat bagus (5%) atau pasar sudah terlalu panas (RSI > 70)
        if profit_pct >= 0.05 or (profit_pct >= 0.02 and rsi > 70):
            return {'action': 'SELL', 'amount_asset': asset_qty}

    # Dynamic Multiplier berdasarkan RSI (Semakin rendah RSI, semakin banyak beli)
    multiplier = 1.0
    if rsi < 30: multiplier = 2.0
    elif rsi < 40: multiplier = 1.5
    
    total_investasi = investasi_rutin * multiplier
    
    # Hanya beli jika pasar tidak sedang "Overbought" (RSI < 60)
    if cash >= total_investasi and rsi < 60:
        return {'action': 'BUY', 'amount_cash': total_investasi, 'amount_asset': total_investasi / current_price}
    
    return {'action': 'HOLD'}

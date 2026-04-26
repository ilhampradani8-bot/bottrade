# strategi/bollinger_bands.py
# Penjelasan: Strategi "Mean Reversion" menggunakan Bollinger Bands.
# Bollinger Bands mengukur volatilitas harga dengan tiga garis: Atas, Tengah, dan Bawah.
# Logika dasar: Harga cenderung kembali ke titik tengah (SMA20).
# - BELI: Saat harga menyentuh atau berada di bawah Lower Band (dianggap jenuh jual/oversold).
# - JUAL: Saat harga menyentuh atau berada di atas Upper Band (dianggap jenuh beli/overbought).
# Strategi ini sangat powerfull pada kondisi pasar "Sideways" atau mendatar.

def strategy(row, portfolio, **kwargs):
    cash = portfolio.get('cash', 0)
    asset_qty = portfolio.get('asset_quantity', 0)
    current_price = row['close']
    upper_band = row.get('bb_upper', 0)
    lower_band = row.get('bb_lower', 0)
    
    if upper_band == 0 or lower_band == 0:
        return {'action': 'HOLD'}

    # Logika Beli: Harga di bawah pita bawah (Oversold)
    if current_price <= lower_band and cash > 0:
        # Beli menggunakan 50% kas agar tetap memiliki cadangan jika harga turun lagi
        invest_amount = cash * 0.5
        return {'action': 'BUY', 'amount_cash': invest_amount, 'amount_asset': invest_amount / current_price}
        
    # Logika Jual: Harga di atas pita atas (Overbought)
    elif current_price >= upper_band and asset_qty > 0:
        return {'action': 'SELL', 'amount_asset': asset_qty}
        
    return {'action': 'HOLD'}

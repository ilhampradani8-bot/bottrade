import ccxt

def fetch_ticker(symbol):
    """
    Fetch the latest ticker price for a given symbol using CCXT.
    Example symbol: 'BTC/USDT'
    """
    try:
        # Initialize exchange (defaulting to binance for demo)
        exchange = ccxt.binance()
        ticker = exchange.fetch_ticker(symbol)
        return str(ticker['last'])
    except Exception as e:
        return f"Error: {str(e)}"

def execute_order(exchange_id, api_key, secret, symbol, side, amount, price=None):
    """
    Execute a buy or sell order.
    side: 'buy' or 'sell'
    amount: quantity to trade
    price: optional, for limit orders
    """
    try:
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({
            'apiKey': api_key,
            'secret': secret,
            'enableRateLimit': True,
        })
        
        if price:
            order = exchange.create_order(symbol, 'limit', side, amount, price)
        else:
            order = exchange.create_order(symbol, 'market', side, amount)
            
        return f"Success: {order['id']}"
    except Exception as e:
        return f"Error: {str(e)}"

def list_exchanges():
    """
    Return a list of all supported exchanges by CCXT.
    """
    return ccxt.exchanges

if __name__ == "__main__":
    # Test script
    print(f"Total Exchanges: {len(list_exchanges())}")
    print(fetch_ticker("BTC/USDT"))

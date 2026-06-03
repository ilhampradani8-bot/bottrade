import talib
import pandas_ta as ta
import pandas as pd
import json

def get_indicators():
    # TA-Lib functions
    talib_funcs = talib.get_functions()
    
    # Pandas-TA indicators
    df = pd.DataFrame()
    # List all indicators in pandas_ta
    pd_ta_funcs = df.ta.indicators(as_list=True)

    data = {
        "ta_lib": talib_funcs,
        "pandas_ta": pd_ta_funcs
    }
    
    with open('indicators.json', 'w') as f:
        json.dump(data, f)

if __name__ == "__main__":
    get_indicators()

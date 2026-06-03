use pyo3::prelude::*;
use pyo3::types::PyModule;

pub struct CcxtProvider;

impl CcxtProvider {
    /// Fetch ticker price using CCXT (Python) via PyO3
    pub fn fetch_ticker(symbol: &str) -> PyResult<String> {
        Python::with_gil(|py| {
            // Load the python script
            let engine_code = include_str!("ccxt_engine.py");
            let module = PyModule::from_code_bound(py, engine_code, "ccxt_engine.py", "ccxt_engine")?;
            
            // Call the python function
            let result: String = module.getattr("fetch_ticker")?.call1((symbol,))?.extract()?;
            Ok(result)
        })
    }

    /// List all exchanges supported by CCXT
    pub fn get_exchanges() -> PyResult<Vec<String>> {
        Python::with_gil(|py| {
            let engine_code = include_str!("ccxt_engine.py");
            let module = PyModule::from_code_bound(py, engine_code, "ccxt_engine.py", "ccxt_engine")?;
            
            let result: Vec<String> = module.getattr("list_exchanges")?.call0()?.extract()?;
            Ok(result)
        })
    }

    /// Execute an order (Buy/Sell) using CCXT
    pub fn execute_order(
        exchange_id: &str,
        api_key: &str,
        secret: &str,
        symbol: &str,
        side: &str,
        amount: f64,
        price: Option<f64>,
    ) -> PyResult<String> {
        Python::with_gil(|py| {
            let engine_code = include_str!("ccxt_engine.py");
            let module = PyModule::from_code_bound(py, engine_code, "ccxt_engine.py", "ccxt_engine")?;
            
            let result: String = module.getattr("execute_order")?.call1((
                exchange_id,
                api_key,
                secret,
                symbol,
                side,
                amount,
                price
            ))?.extract()?;
            Ok(result)
        })
    }
}

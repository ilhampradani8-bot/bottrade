use axum::{
    routing::get,
    Router,
    response::Html,
};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Serialize, Clone)]
struct BotStatus {
    id: String,
    symbol: String,
    strategy: String,
    status: String,
    pnl: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(dashboard));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8081));
    println!("🚀 Admin Panel running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn dashboard() -> Html<String> {
    let active_bots = vec![
        BotStatus { id: "1".into(), symbol: "BTC/USDT".into(), strategy: "DCA PRO".into(), status: "Running".into(), pnl: "+$124.50".into() },
        BotStatus { id: "2".into(), symbol: "ETH/USDT".into(), strategy: "Grid Lite".into(), status: "Running".into(), pnl: "-$12.20".into() },
        BotStatus { id: "3".into(), symbol: "SOL/USDT".into(), strategy: "Trailing".into(), status: "Stopped".into(), pnl: "$0.00".into() },
    ];

    let mut bots_html = String::new();
    for bot in active_bots {
        let status_color = if bot.status == "Running" { "#00ff88" } else { "#ff0055" };
        let pnl_class = if bot.pnl.starts_with("+") { "pnl-plus" } else { "pnl-minus" };
        
        bots_html.push_str(&format!(r#"
            <div class="card">
                <h3>Bot ID #{id}</h3>
                <div class="symbol">{symbol}</div>
                <div class="strategy">{strategy}</div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Status</span>
                        <b style="color: {status_color}">{status}</b>
                    </div>
                    <div class="stat-item">
                        <span>PNL (Realized)</span>
                        <b class="{pnl_class}">{pnl}</b>
                    </div>
                </div>
                <button class="btn-action">CONTROL BOT</button>
            </div>
        "#, id=bot.id, symbol=bot.symbol, strategy=bot.strategy, status=bot.status, status_color=status_color, pnl_class=pnl_class, pnl=bot.pnl));
    }

    let html = format!(r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BotTrade Admin Controller</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {{ --bg-main: #0a0a0c; --bg-card: #121217; --primary: #00f2ff; --secondary: #7000ff; --text-main: #e0e0e6; --text-dim: #888891; --success: #00ff88; --danger: #ff0055; --warning: #ffcc00; }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; border-radius: 0 !important; }}
        body {{ background-color: var(--bg-main); color: var(--text-main); font-family: 'Outfit', sans-serif; overflow-x: hidden; }}
        .navbar {{ height: 60px; background: var(--bg-card); border-bottom: 1px solid #2d2d3d; display: flex; align-items: center; padding: 0 30px; justify-content: space-between; }}
        .logo {{ font-weight: 700; font-size: 1.2rem; letter-spacing: 2px; color: var(--primary); text-transform: uppercase; }}
        .container {{ padding: 40px; max-width: 1400px; margin: 0 auto; }}
        .header-section {{ margin-bottom: 40px; }}
        .header-section h1 {{ font-size: 2rem; margin-bottom: 10px; }}
        .status-pill {{ display: inline-block; padding: 4px 12px; font-size: 0.75rem; font-weight: 600; background: rgba(0, 242, 255, 0.1); color: var(--primary); border: 1px solid var(--primary); text-transform: uppercase; letter-spacing: 1px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .card {{ background: var(--bg-card); border: 1px solid #2d2d3d; padding: 25px; position: relative; transition: all 0.3s ease; }}
        .card:hover {{ border-color: var(--primary); box-shadow: 0 0 20px rgba(0, 242, 255, 0.1); }}
        .card::before {{ content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--primary); }}
        .card h3 {{ font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; }}
        .card .symbol {{ font-size: 1.5rem; font-weight: 700; margin-bottom: 5px; }}
        .card .strategy {{ font-size: 0.9rem; color: var(--primary); margin-bottom: 20px; }}
        .stats {{ display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 1px solid #2d2d3d; }}
        .stat-item span {{ display: block; font-size: 0.7rem; color: var(--text-dim); margin-bottom: 5px; }}
        .stat-item b {{ font-size: 1.1rem; font-family: 'JetBrains Mono', monospace; }}
        .pnl-plus {{ color: var(--success); }}
        .pnl-minus {{ color: var(--danger); }}
        .btn-action {{ margin-top: 25px; width: 100%; padding: 12px; background: transparent; border: 1px solid #2d2d3d; color: var(--text-main); font-weight: 600; cursor: pointer; transition: all 0.2s; }}
        .btn-action:hover {{ background: var(--text-main); color: var(--bg-main); }}
        .logs-section {{ margin-top: 60px; background: #000; border: 1px solid #2d2d3d; padding: 20px; }}
        .logs-section h2 {{ font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; color: var(--text-dim); }}
        .log-line {{ font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-bottom: 8px; color: #666; }}
        .log-line b {{ color: var(--primary); }}
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">BotTrade Engine</div>
        <div class="status-pill">System Online</div>
    </nav>
    <div class="container">
        <div class="header-section">
            <h1>Master Controller</h1>
            <p style="color: var(--text-dim)">Real-time strategy monitoring and engine task control.</p>
        </div>
        <div class="grid">{bots_html}</div>
        <div class="logs-section">
            <h2>System Logs</h2>
            <div class="log-line">[20:44:05] <b>ENGINE:</b> Initializing connection to PostgreSQL...</div>
            <div class="log-line">[20:44:08] <b>ENGINE:</b> Found 3 active strategies in task queue.</div>
            <div class="log-line">[20:44:10] <b>STRATEGY:</b> DCA PRO (BTC/USDT) executed BUY order at $63,120.</div>
            <div class="log-line" style="color: var(--warning)">[20:44:15] <b>RISK:</b> SOL/USDT reached Daily Drawdown Limit. Stopping bot.</div>
        </div>
    </div>
</body>
</html>
"#, bots_html=bots_html);
    Html(html)
}

# 🚀 TradingSafe (BotTrade)
### High-Performance Autonomous Algorithmic Trading Infrastructure & Real-time Signal Engine

[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

---

## 🌌 Overview
**TradingSafe** is a complete, enterprise-grade, autonomous algorithmic trading platform designed for the crypto markets. It bridges high-frequency quantitative analysis with a premium, sleek **Apple-inspired user interface**. Powered by a high-concurrency **Rust (Axum) backend**, the platform continuously tracks asset feeds, executes modular trading strategies, and broadcasts real-time bilingual predictions to WhatsApp and Telegram groups.

---

## ⚡ Key Features

### 1. ⚙️ High-Performance Core Engine (`Engine24am` & `analysis-engine`)
*   **Asynchronous Loop Workers**: Engineered in Rust using the **Tokio** runtime for ultra-low latency, running thousands of concurrent strategy workers.
*   **Polars DataFrame Computations**: Lightning-fast technical indicator analysis and mathematical transformations.
*   **Multi-Exchange Integration**: Seamless CCXT & OpenLimit integrations supporting 100+ global cryptocurrency exchanges.
*   **Financial-Grade Accuracy**: Built using the `rust_decimal` crate, supporting up to 28 decimal places of mathematical precision to prevent rounding errors.

### 2. 🎨 Premium Apple-Vibe UI/UX
*   **Next.js 16 & Tailwind CSS v4**: Blazing fast rendering and modern styling.
*   **Minimalist & High-Density**: Clean edge-to-edge layout, flat-line borders, and custom neumorphic details.
*   **Dual-Theme System**: Dark and light modes with zero-flicker reload.
*   **Tabbed Control Popups**: Multi-parameter strategy configurators structured to reduce user cognitive load.

### 3. 🧠 Smart Broadcast Predictor V2
*   **Bilingual Twin-Broadcast**: Sends analysis in both English and Indonesian.
*   **Advanced Target Tracking**: Automatically calculates entry, targets (TP), and exit (SL) prices with coin-specific decimals (e.g., 4-decimal points for low-value assets like XRP).
*   **Anti-Spam Cooldowns**: Imposes a strict 15-minute wait time after a signal cycle closes.
*   **Threaded Quoted Replies**: Automatically threads target hits, invalidations, or timeouts to their original signal message.

### 4. 🤖 Supported Bot Strategies
*   **DCA Lite & DCA Pro**: Multi-level safety orders, leverage configuration, and trailing take profits.
*   **Grid Master**: Automated spot grid trading for sideways market conditions.
*   **Hybrid DCA/Grid**: Combines average down entries with dynamic grid take-profits.
*   **Trailing Stop Tracker**: Follows rallies and locks in profits.
*   **Indicator-driven Entries**: Bollinger Bands, EMA Cross, and RSI Momentum strategies.

---

## 📁 Repository Structure

```
bottrade/
├── backend/               # Rust Axum Web API & Strategy Core
│   ├── src/               # CCXT bridges, JWT Auth, Database queries, & Strategy modules
│   └── Cargo.toml         
├── engine/                # Rust Analysis & Prediction Engine V2
│   ├── src/               # Websocket listener, TA-lib indicators, & Telegram/WA alerts
│   └── Cargo.toml
├── frontend/              # Next.js 16 + Tailwind CSS v4 Admin Dashboard
│   ├── src/               # React components, Custom Hooks, and Language Translations
│   └── package.json
├── whatsapp-service/      # Node.js Baileys API bridge for WhatsApp broadcasting
│   ├── index.js           # REST API endpoints for message relaying
│   └── package.json
├── logs/                  # Application logs and prediction ledger history
├── scratch/               # Database initialization SQL and test scripts
├── .gitignore             # Strict repository files exclusion rules
└── README.md              # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites
*   **Rust** (1.75+)
*   **Node.js** (v18+)
*   **PostgreSQL** (v14+)
*   **Python 3.10+** (with Pandas & TA-Lib for Python-Rust bridges)

### Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgres://username:password@localhost/bottrade
JWT_SECRET=your_jwt_secret_here
PORT=8080
BINANCE_WS_URL=wss://stream.binance.com:9443/ws
WHATSAPP_BRIDGE_URL=http://localhost:5002
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Installation & Run Commands

#### 1. Database Setup
Initialize your database schemas:
```bash
psql -U username -d bottrade -f scratch/init_db.sql
```

#### 2. Run the Backend API (Rust Axum)
```bash
cd backend
cargo run --release
```

#### 3. Run the Auto-Analysis Engine (Rust Engine)
```bash
cd engine
cargo run --release --bin analysis-engine
# Or run prediction standalone v2:
cargo run --release --bin prediction-v2
```

#### 4. Run the WhatsApp Service (Node.js)
```bash
cd whatsapp-service
npm install
node index.js
```

#### 5. Run the Frontend Dashboard (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🚀 Deployment & VPS Management
For 24/7 background persistence, run the services using background workers or PM2:

```bash
# Restart WhatsApp service
pm2 start whatsapp-service/index.js --name "whatsapp-service"

# Run Rust engines in the background
nohup backend/target/release/backend > logs/backend.log 2>&1 &
nohup engine/target/release/analysis-engine > logs/analysis-engine.log 2>&1 &
nohup engine/target/release/prediction-v2 > logs/prediction-v2.log 2>&1 &
```

---

## 📝 License
This project is licensed under the MIT License. See the LICENSE file for details.

---
*Developed with ❤️ by the TradingSafe Dev Team.*

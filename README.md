# 🚀 TradingSafe (BotTrade)
### High-Performance Automated Crypto Trading Bot, Algorithmic Trading Platform, & Real-Time Signal Broadcaster

[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

---

## 🌌 Overview
**TradingSafe** is a complete, enterprise-grade, autonomous algorithmic crypto trading platform designed for high-frequency market execution. It bridges complex quantitative trading models with a premium, sleek **Apple-inspired user interface**. Powered by a highly concurrent **Rust (Axum) backend**, the system tracks real-time Binance feeds, runs modular trading strategies (DCA, Grid, and Hybrid), and broadcasts automated buy/sell signals to WhatsApp and Telegram communities.

This project is created and maintained by **[Ilham Pradani S.H.](https://www.ilhampradani.me)**. Learn more about the developer and other projects at **[www.ilhampradani.me](https://www.ilhampradani.me)**.

---

## 🔎 SEO Keywords & Target Tags
*`automated crypto trading bot`, `algorithmic trading platform`, `rust axum trading engine`, `next.js crypto dashboard`, `telegram crypto signal bot`, `whatsapp trading broadcaster`, `quantitative trading framework`, `dca bot`, `spot grid bot`, `real-time cryptocurrency tracker`, `binance automated trading`, `high-frequency trading engine`, `open-source crypto trading software`*

---

## ⚡ Key Features

### 1. ⚙️ High-Performance Core Engine (`Engine24am` & `analysis-engine`)
*   **Asynchronous Loop Workers**: Engineered in Rust using the **Tokio** runtime for ultra-low latency, running thousands of concurrent strategy workers.
*   **Polars DataFrame Computations**: Lightning-fast technical indicator analysis (RSI, EMA, Bollinger Bands, MACD) and mathematical transformations.
*   **Multi-Exchange Integration**: Seamless CCXT & OpenLimit integrations supporting 100+ global cryptocurrency exchanges.
*   **Financial-Grade Accuracy**: Built using the `rust_decimal` crate, supporting up to 28 decimal places of mathematical precision to prevent floating-point rounding errors.

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
├── .env.example           # Example configuration template file
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
To keep your secrets safe, **never commit your `.env` file to the repository**. Instead, use the provided `.env.example` file to set up your configuration.

1. Copy the `.env.example` template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your actual credentials (API keys, database password, JWT secret, etc.).

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

## 👤 Developer & Maintainer
*   **Author**: **Ilham Pradani S.H.**
*   **Website**: [www.ilhampradani.me](https://www.ilhampradani.me)
*   **Portfolio / Contact**: Visit the official website at [ilhampradani.me](https://www.ilhampradani.me) to connect, hire, or check out more open-source projects.

---

## 📝 License
This project is licensed under the MIT License. See the LICENSE file for details.

---
*Developed with ❤️ by Ilham Pradani S.H. & the TradingSafe Dev Team.*

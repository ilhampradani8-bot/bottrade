#!/bin/bash
echo "🚧 Compiling automated Marketing & Copywriting Engine..."
cd /root/bottrade/marketing
cargo build --release

echo "🔄 Stopping existing marketing-bot process if active..."
pkill -f "target/release/marketing-bot" || true

echo "🚀 Launching marketing-bot in background..."
nohup target/release/marketing-bot > /root/bottrade/logs/marketing-bot.log 2>&1 &

echo "✅ Marketing Engine is now running!"
echo "📈 Track execution logs at: tail -f /root/bottrade/logs/marketing-bot.log"

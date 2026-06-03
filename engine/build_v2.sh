#!/bin/bash
echo "🚧 Compiling standalone V2 Prediction Engine..."
cd /root/bottrade/engine
cargo build --release --bin prediction-v2

echo "🔄 Stopping existing prediction-v2 process if active..."
pkill -f "target/release/prediction-v2" || true

echo "🚀 Launching prediction-v2 standalone forecaster in background..."
nohup target/release/prediction-v2 > /root/bottrade/logs/prediction-v2.log 2>&1 &

echo "✅ V2 Standalone Forecaster is now running!"
echo "📈 Track execution logs at: tail -f /root/bottrade/logs/prediction-v2.log"

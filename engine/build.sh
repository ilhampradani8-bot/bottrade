#!/bin/bash
echo "🚧 Starting recompile and restart task..."
cd /root/bottrade/engine
cargo build --release --bin analysis-engine

echo "📦 Copying binary to central bin directory..."
mkdir -p /root/bottrade/bin
cp target/release/analysis-engine /root/bottrade/bin/analysis-engine

echo "🔄 Killing old process..."
pkill -f "bin/analysis-engine" || true

echo "🚀 Starting new engine..."
nohup /root/bottrade/bin/analysis-engine > /root/bottrade/logs/analysis-engine.log 2>&1 &
echo "✅ Done!"

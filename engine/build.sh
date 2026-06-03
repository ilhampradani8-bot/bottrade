#!/bin/bash
echo "🚧 Starting recompile and restart task..."
cd /root/bottrade/engine
cargo build --release
echo "🔄 Killing old process..."
pkill -f "target/release/analysis-engine" || true
echo "🚀 Starting new engine..."
nohup target/release/analysis-engine > /root/bottrade/logs/analysis-engine.log 2>&1 &
echo "✅ Done!"

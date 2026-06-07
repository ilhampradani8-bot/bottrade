#!/bin/bash
# Script untuk menjalankan WhatsApp Bridge menggunakan PM2 agar berjalan selamanya di background (tidak mati saat terminal ditutup)

echo "Stopping existing whatsapp-bridge in PM2 if any..."
pm2 delete whatsapp-bridge 2>/dev/null || true

echo "Starting WhatsApp Bridge under PM2..."
pm2 start index.js --name "whatsapp-bridge"

echo "Saving PM2 process list..."
pm2 save

echo "WhatsApp Bridge has been daemonized under PM2!"
echo "Check status: pm2 status"
echo "Check logs: pm2 logs whatsapp-bridge"

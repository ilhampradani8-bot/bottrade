#!/bin/bash

# VPS Setup Script for Bot Trade
# To be run as root on the VPS

set -e

echo "Updating system..."
apt-get update
apt-get install -y mysql-server php php-mysql apache2 libapache2-mod-php wget curl git

echo "Configuring MySQL..."
# Set root password and create database
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '@Dani22334455D'; FLUSH PRIVILEGES;"
mysql -u root -p'@Dani22334455D' -e "CREATE DATABASE IF NOT EXISTS bot_cuan;"

echo "Installing Adminer..."
mkdir -p /var/www/html/adminer
wget "https://www.adminer.org/latest.php" -O /var/www/html/adminer/index.php

echo "Setting up Apache..."
systemctl enable apache2
systemctl restart apache2

echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "Checking Python..."
apt-get install -y python3-pip python3-venv

echo "Setup Complete!"
echo "Adminer: http://$(hostname -I | awk '{print $1}')/adminer"

#!/bin/bash

#############################################
#   MP RECORDS - Smart Deploy Script (Auto-Detect)
#   
#   NAPRAWIONO: Błąd cudzysłowów w Nginx
#   NAPRAWIONO: Generowanie pliku .env
#############################################

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. AUTO-DETEKCJA ŚCIEŻKI I UŻYTKOWNIKA
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
APP_NAME="mprecords"

#############################################
# FUNKCJE POMOCNICZE
#############################################

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Ten skrypt wymaga uprawnień root!"
        log_info "Uruchom: sudo ./deploy.sh --setup"
        exit 1
    fi
}

cleanup_system() {
    log_warning "🧹 Rozpoczynam czyszczenie starych plików i błędnych konfiguracji..."
    if [ -f "/etc/apt/sources.list.d/mongodb-org-7.0.list" ]; then
        rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
    fi
    rm -f /etc/nginx/sites-enabled/$APP_NAME
    rm -f /etc/nginx/sites-available/$APP_NAME
    rm -f /etc/nginx/sites-enabled/default || true
    
    if [ -f "/etc/systemd/system/$APP_NAME.service" ]; then
        systemctl stop $APP_NAME 2>/dev/null || true
        systemctl disable $APP_NAME 2>/dev/null || true
        rm -f /etc/systemd/system/$APP_NAME.service
        systemctl daemon-reload
    fi
}

#############################################
# GŁÓWNA INSTALACJA
#############################################

first_setup() {
    log_info "🚀 ROZPOCZYNAM INSTALACJĘ W: $APP_DIR"
    
    cleanup_system
    
    echo ""
    read -p "🌐 Podaj domenę (np. mprecords.pl): " DOMAIN
    read -p "📧 Podaj email (do SSL): " EMAIL
    read -p "👤 Login admina: " ADMIN_LOGIN
    read -sp "🔑 Hasło admina: " ADMIN_PASSWORD
    echo ""
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    log_info "📦 Aktualizacja systemowa..."
    apt update && apt upgrade -y
    
    # 2. Node.js 20
    if ! command -v node &> /dev/null; then
        log_info "🟢 Instaluję Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    
    # 3. MongoDB 8.0
    log_info "🟢 Konfiguruję MongoDB 8.0..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # 4. Nginx i Certbot
    apt install -y nginx certbot python3-certbot-nginx
    
    # 5. Firewall
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    # 6. .env
    cat > "$APP_DIR/.env" << ENVFILE
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/mprecords
JWT_SECRET=$JWT_SECRET
ADMIN_LOGIN=$ADMIN_LOGIN
ADMIN_PASSWORD=$ADMIN_PASSWORD
ENVFILE
    chmod 600 "$APP_DIR/.env"
    
    # 7. NPM
    cd "$APP_DIR"
    npm install --production
    
    # 8. Uprawnienia
    mkdir -p "$APP_DIR/server/uploads"/{wydania,produkty,czlonkowie}
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"

    # 9. Tworzenie Admina
    log_info "👤 Dodaję admina do MongoDB..."
    node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect('mongodb://localhost:27017/mprecords').then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('$ADMIN_PASSWORD', salt);
    await mongoose.connection.db.collection('users').updateOne(
        { login: '$ADMIN_LOGIN' },
        { \$set: { 
            username: '$ADMIN_LOGIN', 
            login: '$ADMIN_LOGIN', 
            password: hash, 
            role: 'admin', 
            isAdmin: true,
            status: 'active',
            updatedAt: new Date() 
        }},
        { upsert: true }
    );
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });"
    
    # 10. Systemd
    cat > /etc/systemd/system/$APP_NAME.service << SERVICE
[Unit]
Description=MP Records App
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE
    
    systemctl daemon-reload
    systemctl enable $APP_NAME
    systemctl start $APP_NAME
    
    # 11. NGINX (Naprawione cudzysłowy)
    log_info "⚙️ Konfiguruję Nginx..."
    cat > /etc/nginx/sites-available/$APP_NAME << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /uploads {
        alias $APP_DIR/server/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    client_max_body_size 100M;
}
NGINX
    
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    nginx -t
    systemctl reload nginx
    
    # 12. SSL
    log_info "🔐 Uzyskuję certyfikat SSL..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" || log_warning "SSL nie powiódł się. Uruchom potem: certbot --nginx"
    
    log_success "🚀 GOTOWE! Strona dostępna pod: https://$DOMAIN"
}

update_app() {
    log_info "🔄 Aktualizacja aplikacji..."
    cd "$APP_DIR"
    git pull origin main || git pull origin master
    npm install --production
    chown -R www-data:www-data "$APP_DIR"
    systemctl restart $APP_NAME
    log_success "Zaktualizowano!"
}

check_root

if [[ "$1" == "--setup" ]]; then
    first_setup
else
    if [[ ! -f "/etc/systemd/system/$APP_NAME.service" ]]; then
        log_error "Aplikacja nie jest zainstalowana. Użyj: sudo ./deploy.sh --setup"
    else
        update_app
    fi
fi

#!/bin/bash

#############################################
#   MP RECORDS - Smart Deploy Script (Auto-Detect)
#   
#   Ten skrypt:
#   1. Sam wykrywa katalog, w którym go uruchamiasz.
#   2. Sam czyści stare śmieci (błędne repozytoria, stare configi).
#   3. Instaluje poprawną wersję MongoDB 8.0 dla Ubuntu 24.04.
#   4. AUTOMATYCZNIE TWORZY ADMINA W BAZIE (Fix błędu 500)
#
#   UŻYCIE:
#     chmod +x deploy.sh
#     sudo ./deploy.sh --setup
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
CURRENT_USER=${SUDO_USER:-$USER}

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

#############################################
# AUTOMATYCZNE CZYSZCZENIE
#############################################

cleanup_system() {
    log_warning "🧹 Rozpoczynam czyszczenie starych plików i błędnych konfiguracji..."

    # 1. Usuwanie błędnego repozytorium MongoDB 7.0
    if [ -f "/etc/apt/sources.list.d/mongodb-org-7.0.list" ]; then
        rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
    fi

    # 2. Usuwanie starych konfliktów Nginx
    rm -f /etc/nginx/sites-enabled/$APP_NAME
    rm -f /etc/nginx/sites-available/$APP_NAME
    rm -f /etc/nginx/sites-enabled/default

    # 3. Czyszczenie starych procesów systemd
    if [ -f "/etc/systemd/system/$APP_NAME.service" ]; then
        systemctl stop $APP_NAME 2>/dev/null || true
        systemctl disable $APP_NAME 2>/dev/null || true
        rm -f /etc/systemd/system/$APP_NAME.service
        systemctl daemon-reload
    fi
}

#############################################
# PIERWSZA INSTALACJA
#############################################

first_setup() {
    log_info "🚀 ROZPOCZYNAM INSTALACJĘ W KATALOGU: $APP_DIR"
    
    cleanup_system
    
    echo ""
    read -p "🌐 Podaj domenę (np. mprecords.pl): " DOMAIN
    read -p "📧 Podaj email (do SSL): " EMAIL
    read -p "👤 Login admina: " ADMIN_LOGIN
    read -sp "🔑 Hasło admina: " ADMIN_PASSWORD
    echo ""
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    log_info "📦 Aktualizacja i instalacja narzędzi..."
    apt update && apt upgrade -y
    
    # 2. Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # 3. MongoDB 8.0
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # 4. Nginx i Certbot
    apt install -y nginx certbot python3-certbot-nginx
    
    # 5. Firewall
    ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
    
    # 6. Plik .env
    log_info "⚙️ Generuję plik .env..."
    cat > "$APP_DIR/.env" << ENVFILE
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/mprecords
JWT_SECRET=$JWT_SECRET
ADMIN_LOGIN=$ADMIN_LOGIN
ADMIN_PASSWORD=$ADMIN_PASSWORD
ENVFILE
    chmod 600 "$APP_DIR/.env"
    
    # 7. npm install
    log_info "📦 Instaluję zależności npm..."
    cd "$APP_DIR"
    npm install --production
    
    # 8. Uprawnienia
    mkdir -p "$APP_DIR/server/uploads"/{wydania,produkty,czlonkowie}
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"

    # 9. NOWOŚĆ: Dodanie admina bezpośrednio do MongoDB (Zapobiega błędowi 500)
    log_info "👤 Tworzę admina w bazie danych..."
    node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const login = '$ADMIN_LOGIN';
const password = '$ADMIN_PASSWORD';

mongoose.connect('mongodb://localhost:27017/mprecords').then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await mongoose.connection.db.collection('users').updateOne(
        { login: login },
        { \$set: { 
            username: login, 
            login: login, 
            password: hash, 
            role: 'admin', 
            isAdmin: true,
            status: 'active',
            updatedAt: new Date() 
        }},
        { upsert: true }
    );
    console.log('✅ Admin dodany do bazy.');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
"
    
    # 10. Systemd service
    log_info "⚙️ Tworzę serwis systemd..."
    cat > /etc/systemd/system/$APP_NAME.service << SERVICE
[Unit]
Description=MP Records Application
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE
    
    systemctl daemon-reload
    systemctl enable $APP_NAME
    systemctl start $APP_NAME
    
    # 11. Nginx config
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
        add_header Cache-Control \"public, immutable\";
    }
    
    client_max_body_size 100M;
}
NGINX
    
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    # 12. SSL
    log_info "🔐 Konfiguruję HTTPS..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" || log_warning "Skonfiguruj SSL ręcznie: certbot --nginx"
    
    log_success "✅ INSTALACJA ZAKOŃCZONA!"
    echo "🌐 Strona: https://$DOMAIN"
}

update_app() {
    log_info "🔄 AKTUALIZACJA..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
    npm install --production
    chown -R www-data:www-data "$APP_DIR"
    systemctl restart $APP_NAME
    log_success "Gotowe!"
}

echo "╔═══════════════════════════════════════╗"
echo "║   MP RECORDS - Smart Deploy Script    ║"
echo "╚═══════════════════════════════════════╝"

check_root

if [[ "$1" == "--setup" ]] || [[ "$1" == "-s" ]]; then
    first_setup
else
    if [[ ! -f "/etc/systemd/system/$APP_NAME.service" ]]; then
        log_warning "Brak instalacji. Użyj: ./deploy.sh --setup"
    else
        update_app
    fi
fi

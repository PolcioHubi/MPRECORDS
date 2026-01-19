#!/bin/bash

#############################################
#  MP RECORDS - Deploy Script
#  
#  Ten skrypt jest w repozytorium z projektem.
#  
#  PIERWSZA INSTALACJA (na świeżym VPS):
#    1. Sklonuj repo: git clone URL /var/www/mprecords
#    2. Uruchom: cd /var/www/mprecords && chmod +x deploy.sh && ./deploy.sh --setup
#  
#  AKTUALIZACJA:
#    ./deploy.sh
#
#############################################

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ścieżka aplikacji
APP_DIR="/var/www/mprecords"
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
        log_info "Uruchom: sudo ./deploy.sh"
        exit 1
    fi
}

#############################################
# PIERWSZA INSTALACJA
#############################################

first_setup() {
    log_info "🚀 PIERWSZA INSTALACJA MP RECORDS"
    echo ""
    
    # Zbierz dane
    read -p "🌐 Podaj domenę (np. mprecords.pl): " DOMAIN
    read -p "📧 Podaj email (do SSL): " EMAIL
    read -p "👤 Login admina: " ADMIN_LOGIN
    read -sp "🔑 Hasło admina: " ADMIN_PASSWORD
    echo ""
    
    # Generuj JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    echo ""
    log_info "Rozpoczynam instalację..."
    echo ""

    # 1. Aktualizacja systemu
    log_info "📦 Aktualizuję system..."
    apt update && apt upgrade -y
    
    # 2. Instalacja Node.js 20
    log_info "📦 Instaluję Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # 3. Instalacja MongoDB
    log_info "📦 Instaluję MongoDB..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # 4. Instalacja Nginx
    log_info "📦 Instaluję Nginx..."
    apt install -y nginx
    
    # 5. Instalacja Certbot
    log_info "📦 Instaluję Certbot..."
    apt install -y certbot python3-certbot-nginx
    
    # 6. Firewall
    log_info "🔒 Konfiguruję firewall..."
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    # 7. Plik .env
    log_info "⚙️ Tworzę plik .env..."
    cat > "$APP_DIR/.env" << ENVFILE
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/mprecords
JWT_SECRET=$JWT_SECRET
ADMIN_LOGIN=$ADMIN_LOGIN
ADMIN_PASSWORD=$ADMIN_PASSWORD
ENVFILE
    chmod 600 "$APP_DIR/.env"
    
    # 8. Instalacja zależności
    log_info "📦 Instaluję zależności npm..."
    cd "$APP_DIR"
    npm install --production
    
    # 9. Folder uploads
    mkdir -p "$APP_DIR/server/uploads"/{wydania,produkty,czlonkowie}
    chown -R www-data:www-data "$APP_DIR/server/uploads"
    chmod -R 755 "$APP_DIR/server/uploads"
    
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
    
    chown -R www-data:www-data "$APP_DIR"
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
        add_header Cache-Control "public, immutable";
    }
    
    client_max_body_size 100M;
}
NGINX
    
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    
    # 12. SSL
    log_info "🔐 Konfiguruję HTTPS (Let's Encrypt)..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
    
    # Auto-renewal
    systemctl enable certbot.timer
    
    echo ""
    echo "=========================================="
    log_success "INSTALACJA ZAKOŃCZONA!"
    echo "=========================================="
    echo ""
    echo "🌐 Strona:  https://$DOMAIN"
    echo "🔧 Admin:   https://$DOMAIN/admin"
    echo "👤 Login:   $ADMIN_LOGIN"
    echo ""
    echo "📝 Przydatne komendy:"
    echo "   Status:    systemctl status $APP_NAME"
    echo "   Logi:      journalctl -u $APP_NAME -f"
    echo "   Restart:   systemctl restart $APP_NAME"
    echo "   Update:    ./deploy.sh"
    echo ""
}

#############################################
# AKTUALIZACJA
#############################################

update_app() {
    log_info "🔄 AKTUALIZACJA MP RECORDS"
    echo ""
    
    cd "$APP_DIR"
    
    # Pobierz zmiany
    log_info "📥 Pobieram zmiany z GitHub..."
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
    
    # Zainstaluj zależności
    log_info "📦 Instaluję zależności..."
    npm install --production
    
    # Uprawnienia uploads
    chown -R www-data:www-data "$APP_DIR/server/uploads" 2>/dev/null || true
    
    # Restart
    log_info "🔄 Restartuję aplikację..."
    systemctl restart $APP_NAME
    
    # Sprawdź status
    sleep 3
    if systemctl is-active --quiet $APP_NAME; then
        echo ""
        log_success "Aktualizacja zakończona!"
        echo ""
        echo "📊 Wersja: $(git log -1 --format='%h - %s' 2>/dev/null || echo 'brak info')"
        echo "📅 Data:   $(git log -1 --format='%ci' 2>/dev/null || echo 'brak info')"
    else
        log_error "Błąd! Sprawdź logi:"
        echo "   journalctl -u $APP_NAME -n 50"
    fi
    echo ""
}

#############################################
# GŁÓWNA LOGIKA
#############################################

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║       MP RECORDS - Deploy Script      ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Sprawdź czy root
check_root

# Sprawdź parametry
if [[ "$1" == "--setup" ]] || [[ "$1" == "-s" ]]; then
    first_setup
elif [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Użycie:"
    echo "  ./deploy.sh --setup   Pierwsza instalacja na VPS"
    echo "  ./deploy.sh           Aktualizacja aplikacji"
    echo ""
else
    # Sprawdź czy to pierwsza instalacja czy aktualizacja
    if [[ ! -f "/etc/systemd/system/$APP_NAME.service" ]]; then
        log_warning "Nie wykryto zainstalowanej aplikacji."
        echo ""
        read -p "Czy to pierwsza instalacja? (t/n): " FIRST_INSTALL
        if [[ "$FIRST_INSTALL" == "t" ]] || [[ "$FIRST_INSTALL" == "T" ]]; then
            first_setup
        else
            log_error "Uruchom z parametrem --setup dla pierwszej instalacji"
            exit 1
        fi
    else
        update_app
    fi
fi

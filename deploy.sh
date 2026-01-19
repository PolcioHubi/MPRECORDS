#!/bin/bash

#############################################
#  MP RECORDS - Smart Deploy Script (Auto-Detect)
#  
#  Ten skrypt:
#  1. Sam wykrywa katalog, w którym go uruchamiasz.
#  2. Sam czyści stare śmieci (błędne repozytoria, stare configi).
#  3. Instaluje poprawną wersję MongoDB 8.0 dla Ubuntu 24.04.
#
#  UŻYCIE:
#    chmod +x deploy.sh
#    sudo ./deploy.sh --setup
#############################################

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. AUTO-DETEKCJA ŚCIEŻKI I UŻYTKOWNIKA
# Skrypt pobiera ścieżkę do katalogu, w którym się znajduje
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
# AUTOMATYCZNE CZYSZCZENIE (Efekt Domino)
#############################################

cleanup_system() {
    log_warning "🧹 Rozpoczynam czyszczenie starych plików i błędnych konfiguracji..."

    # 1. Usuwanie błędnego repozytorium MongoDB 7.0 (Naprawa błędu 404)
    if [ -f "/etc/apt/sources.list.d/mongodb-org-7.0.list" ]; then
        log_info "Usuwam błędną listę repozytoriów MongoDB 7.0..."
        rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
    fi

    # 2. Usuwanie starych konfliktów Nginx
    rm -f /etc/nginx/sites-enabled/$APP_NAME
    rm -f /etc/nginx/sites-available/$APP_NAME
    rm -f /etc/nginx/sites-enabled/default # Usuwamy domyślną stronę, by nie blokowała portu 80

    # 3. Czyszczenie starych procesów systemd
    if [ -f "/etc/systemd/system/$APP_NAME.service" ]; then
        log_info "Zatrzymuję stary serwis..."
        systemctl stop $APP_NAME 2>/dev/null || true
        systemctl disable $APP_NAME 2>/dev/null || true
        rm -f /etc/systemd/system/$APP_NAME.service
        systemctl daemon-reload
    fi

    # 4. Odświeżenie apt po czyszczeniu
    apt update || log_warning "Apt update zgłosił błędy, ale próbujemy dalej..."
}

#############################################
# PIERWSZA INSTALACJA
#############################################

first_setup() {
    log_info "🚀 ROZPOCZYNAM INSTALACJĘ W KATALOGU: $APP_DIR"
    
    # Najpierw sprzątamy
    cleanup_system
    
    echo ""
    # Zbierz dane
    read -p "🌐 Podaj domenę (np. mprecords.pl): " DOMAIN
    read -p "📧 Podaj email (do SSL): " EMAIL
    read -p "👤 Login admina: " ADMIN_LOGIN
    read -sp "🔑 Hasło admina: " ADMIN_PASSWORD
    echo ""
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    echo ""
    log_info "Rozpoczynam konfigurację..."

    # 1. Aktualizacja systemu
    log_info "📦 Aktualizuję system..."
    apt update && apt upgrade -y
    
    # 2. Instalacja Node.js 20
    log_info "📦 Instaluję Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # 3. Instalacja MongoDB 8.0 (Specjalnie dla Ubuntu 24.04 Noble)
    log_info "📦 Instaluję MongoDB 8.0 (Noble Fix)..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # 4. Instalacja Nginx i Certbot
    log_info "📦 Instaluję Nginx i Certbot..."
    apt install -y nginx certbot python3-certbot-nginx
    
    # 5. Firewall
    log_info "🔒 Konfiguruję firewall..."
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
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
    
    # 7. Instalacja zależności
    log_info "📦 Instaluję zależności npm w $APP_DIR..."
    cd "$APP_DIR"
    npm install --production
    
    # 8. Folder uploads i uprawnienia
    mkdir -p "$APP_DIR/server/uploads"/{wydania,produkty,czlonkowie}
    
    # WAŻNE: Ustawiamy właściciela na www-data, ale dajemy dostęp grupie
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    # 9. Systemd service
    log_info "⚙️ Tworzę serwis systemd (auto-path)..."
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
    
    # 10. Nginx config
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
    nginx -t && systemctl reload nginx
    
    # 11. SSL
    log_info "🔐 Konfiguruję HTTPS..."
    # Sprawdź czy domena działa, jeśli nie - pomiń błąd, żeby nie wywalić skryptu na końcu
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" || log_warning "Nie udało się wygenerować SSL. Upewnij się, że domena $DOMAIN wskazuje na ten serwer i uruchom: certbot --nginx"
    
    echo ""
    log_success "✅ INSTALACJA ZAKOŃCZONA SUKCESEM!"
    echo "📂 Aplikacja zainstalowana w: $APP_DIR"
    echo "🌐 Strona: https://$DOMAIN"
}

#############################################
# AKTUALIZACJA
#############################################

update_app() {
    log_info "🔄 AKTUALIZACJA MP RECORDS W: $APP_DIR"
    cd "$APP_DIR"
    
    log_info "📥 Pobieram zmiany..."
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
    
    log_info "📦 Instaluję zależności..."
    npm install --production
    chown -R www-data:www-data "$APP_DIR"
    
    log_info "🔄 Restartuję..."
    systemctl restart $APP_NAME
    log_success "Gotowe!"
}

#############################################
# GŁÓWNA LOGIKA
#############################################

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   MP RECORDS - Smart Deploy Script    ║"
echo "╚═══════════════════════════════════════╝"
echo ""

check_root

if [[ "$1" == "--setup" ]] || [[ "$1" == "-s" ]]; then
    first_setup
else
    # Jeśli serwis nie istnieje, sugeruj setup
    if [[ ! -f "/etc/systemd/system/$APP_NAME.service" ]]; then
        log_warning "Nie wykryto zainstalowanej aplikacji w systemie."
        read -p "Czy chcesz uruchomić pełną instalację (setup)? (t/n): " DO_SETUP
        if [[ "$DO_SETUP" == "t" || "$DO_SETUP" == "T" ]]; then
            first_setup
        else
            exit 0
        fi
    else
        update_app
    fi
fi

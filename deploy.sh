#!/bin/bash

#############################################
#   MP RECORDS - Smart Deploy Script v2.0
#   
#   ✅ Auto-detekcja ścieżki
#   ✅ Pełne czyszczenie przed instalacją
#   ✅ Walidacja każdego kroku
#   ✅ Diagnostyka błędów
#   ✅ Backup przed aktualizacją
#############################################

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Auto-detekcja ścieżki
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
APP_NAME="mprecords"
LOG_FILE="/var/log/$APP_NAME-deploy.log"

#############################################
# FUNKCJE POMOCNICZE
#############################################

log_info() { echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"; }
log_step() { echo -e "${CYAN}▶️  $1${NC}" | tee -a "$LOG_FILE"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Ten skrypt wymaga uprawnień root!"
        log_info "Uruchom: sudo ./deploy.sh --setup"
        exit 1
    fi
}

# Sprawdź czy komenda się powiodła
check_status() {
    if [ $? -eq 0 ]; then
        log_success "$1"
    else
        log_error "$2"
        exit 1
    fi
}

# Sprawdź czy usługa działa
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        log_success "$service działa"
        return 0
    else
        log_error "$service nie działa!"
        log_info "Sprawdź logi: journalctl -u $service -n 50"
        return 1
    fi
}

# Wyczyść stare pliki i konfiguracje
deep_cleanup() {
    log_step "🧹 CZYSZCZENIE SYSTEMU..."
    
    # Zatrzymaj usługi
    log_info "Zatrzymuję stare usługi..."
    systemctl stop $APP_NAME 2>/dev/null || true
    systemctl disable $APP_NAME 2>/dev/null || true
    
    # Usuń stare pliki systemd
    rm -f /etc/systemd/system/$APP_NAME.service
    rm -f /etc/systemd/system/$APP_NAME.service.d/*.conf 2>/dev/null || true
    rmdir /etc/systemd/system/$APP_NAME.service.d 2>/dev/null || true
    
    # Usuń stare konfiguracje Nginx
    rm -f /etc/nginx/sites-enabled/$APP_NAME
    rm -f /etc/nginx/sites-available/$APP_NAME
    rm -f /etc/nginx/sites-enabled/default
    
    # Usuń stare repo MongoDB (wszystkie wersje)
    rm -f /etc/apt/sources.list.d/mongodb*.list
    rm -f /usr/share/keyrings/mongodb*.gpg
    
    # Wyczyść cache apt
    apt-get clean
    
    # Przeładuj systemd
    systemctl daemon-reload
    
    # Przeładuj nginx jeśli działa
    systemctl reload nginx 2>/dev/null || true
    
    log_success "Czyszczenie zakończone"
}

# Diagnostyka systemu
run_diagnostics() {
    echo ""
    log_step "🔍 DIAGNOSTYKA SYSTEMU"
    echo "========================================"
    
    # Node.js
    if command -v node &> /dev/null; then
        echo -e "Node.js:    ${GREEN}$(node -v)${NC}"
    else
        echo -e "Node.js:    ${RED}nie zainstalowany${NC}"
    fi
    
    # MongoDB
    if systemctl is-active --quiet mongod; then
        echo -e "MongoDB:    ${GREEN}działa${NC}"
    else
        echo -e "MongoDB:    ${RED}nie działa${NC}"
    fi
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        echo -e "Nginx:      ${GREEN}działa${NC}"
    else
        echo -e "Nginx:      ${RED}nie działa${NC}"
    fi
    
    # Aplikacja
    if systemctl is-active --quiet $APP_NAME; then
        echo -e "Aplikacja:  ${GREEN}działa${NC}"
    else
        echo -e "Aplikacja:  ${RED}nie działa${NC}"
    fi
    
    # Plik .env
    if [ -f "$APP_DIR/.env" ]; then
        echo -e ".env:       ${GREEN}istnieje${NC}"
    else
        echo -e ".env:       ${RED}brak!${NC}"
    fi
    
    # Sprawdź porty
    echo ""
    echo "Porty:"
    if ss -tlnp | grep -q ':5000'; then
        echo -e "  Port 5000: ${GREEN}słucha${NC}"
    else
        echo -e "  Port 5000: ${RED}wolny${NC}"
    fi
    
    if ss -tlnp | grep -q ':80'; then
        echo -e "  Port 80:   ${GREEN}słucha${NC}"
    else
        echo -e "  Port 80:   ${RED}wolny${NC}"
    fi
    
    if ss -tlnp | grep -q ':443'; then
        echo -e "  Port 443:  ${GREEN}słucha${NC}"
    else
        echo -e "  Port 443:  ${YELLOW}wolny (brak SSL?)${NC}"
    fi
    
    # Sprawdź użytkowników w bazie
    echo ""
    echo "Baza danych:"
    if command -v mongosh &> /dev/null; then
        USER_COUNT=$(mongosh --quiet --eval "db.users.countDocuments()" mprecords 2>/dev/null || echo "błąd")
        echo -e "  Użytkownicy: $USER_COUNT"
    fi
    
    echo "========================================"
    echo ""
}

# Napraw admina w bazie
fix_admin() {
    log_step "🔧 NAPRAWA KONTA ADMINA"
    
    read -p "👤 Podaj login admina: " FIX_LOGIN
    read -sp "🔑 Podaj nowe hasło: " FIX_PASSWORD
    echo ""
    
    cd "$APP_DIR"
    
    node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/mprecords').then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('$FIX_PASSWORD', salt);
    
    // Usuń wszystkich starych adminów
    await mongoose.connection.db.collection('users').deleteMany({});
    
    // Utwórz nowego
    await mongoose.connection.db.collection('users').insertOne({
        username: '$FIX_LOGIN',
        password: hash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    console.log('✅ Admin utworzony: $FIX_LOGIN');
    process.exit(0);
}).catch(err => { 
    console.error('❌ Błąd:', err.message); 
    process.exit(1); 
});"
    
    log_success "Konto admina naprawione. Zrestartuj aplikację: systemctl restart $APP_NAME"
}

#############################################
# GŁÓWNA INSTALACJA
#############################################

first_setup() {
    log_info "🚀 ROZPOCZYNAM INSTALACJĘ W: $APP_DIR"
    echo "$(date): Rozpoczęcie instalacji" >> "$LOG_FILE"
    
    # Pełne czyszczenie
    deep_cleanup
    
    echo ""
    read -p "🌐 Podaj domenę (np. mprecords.pl): " DOMAIN
    read -p "📧 Podaj email (do SSL): " EMAIL
    read -p "👤 Login admina: " ADMIN_LOGIN
    read -sp "🔑 Hasło admina: " ADMIN_PASSWORD
    echo ""
    
    # Walidacja inputów
    if [[ -z "$DOMAIN" || -z "$EMAIL" || -z "$ADMIN_LOGIN" || -z "$ADMIN_PASSWORD" ]]; then
        log_error "Wszystkie pola są wymagane!"
        exit 1
    fi
    
    if [[ ${#ADMIN_PASSWORD} -lt 6 ]]; then
        log_error "Hasło musi mieć min. 6 znaków!"
        exit 1
    fi
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    # ========== KROK 1: System ==========
    log_step "1/12 Aktualizacja systemu..."
    apt update && apt upgrade -y
    check_status "System zaktualizowany" "Błąd aktualizacji systemu"
    
    # ========== KROK 2: Node.js ==========
    log_step "2/12 Instalacja Node.js..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    check_status "Node.js: $(node -v)" "Błąd instalacji Node.js"
    
    # ========== KROK 3: MongoDB ==========
    log_step "3/12 Instalacja MongoDB 8.0..."
    
    # Sprawdź czy MongoDB już działa
    if systemctl is-active --quiet mongod; then
        log_info "MongoDB już działa, pomijam instalację"
    else
        curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
        
        # Wykryj wersję Ubuntu i użyj odpowiedniego repo
        UBUNTU_VERSION=$(lsb_release -cs 2>/dev/null || echo "jammy")
        case "$UBUNTU_VERSION" in
            noble|oracular) MONGO_REPO="noble" ;;
            jammy) MONGO_REPO="jammy" ;;
            focal) MONGO_REPO="focal" ;;
            *) MONGO_REPO="jammy"; log_warning "Nieznana wersja Ubuntu, używam jammy" ;;
        esac
        
        echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/ubuntu $MONGO_REPO/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
        apt update
        apt install -y mongodb-org
        systemctl start mongod
        systemctl enable mongod
    fi
    
    # Poczekaj na MongoDB
    sleep 3
    check_service mongod
    
    # ========== KROK 4: Nginx ==========
    log_step "4/12 Instalacja Nginx..."
    apt install -y nginx
    check_service nginx
    
    # ========== KROK 5: Certbot ==========
    log_step "5/12 Instalacja Certbot..."
    apt install -y certbot python3-certbot-nginx
    check_status "Certbot zainstalowany" "Błąd instalacji Certbot"
    
    # ========== KROK 6: Firewall ==========
    log_step "6/12 Konfiguracja Firewall..."
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw --force enable
    check_status "Firewall skonfigurowany" "Błąd konfiguracji firewall"
    
    # ========== KROK 7: .env ==========
    log_step "7/12 Tworzenie pliku .env..."
    cat > "$APP_DIR/.env" << ENVFILE
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/mprecords
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=30d
ADMIN_LOGIN=$ADMIN_LOGIN
ADMIN_PASSWORD=$ADMIN_PASSWORD
ENVFILE
    chmod 600 "$APP_DIR/.env"
    check_status "Plik .env utworzony" "Błąd tworzenia .env"
    
    # ========== KROK 8: NPM ==========
    log_step "8/12 Instalacja zależności npm..."
    cd "$APP_DIR"
    npm install --production
    check_status "Zależności zainstalowane" "Błąd npm install"
    
    # ========== KROK 9: Uprawnienia ==========
    log_step "9/12 Konfiguracja uprawnień..."
    mkdir -p "$APP_DIR/server/uploads"/{wydania,produkty,czlonkowie}
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    chmod 600 "$APP_DIR/.env"
    check_status "Uprawnienia ustawione" "Błąd uprawnień"
    
    # ========== KROK 10: Admin ==========
    log_step "10/12 Tworzenie konta admina..."
    node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect('mongodb://localhost:27017/mprecords').then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('$ADMIN_PASSWORD', salt);
    
    // Wyczyść starych użytkowników i utwórz nowego
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('users').insertOne({
        username: '$ADMIN_LOGIN',
        password: hash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    console.log('Admin utworzony');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });"
    check_status "Admin utworzony: $ADMIN_LOGIN" "Błąd tworzenia admina"
    
    # ========== KROK 11: Systemd ==========
    log_step "11/12 Konfiguracja systemd..."
    cat > /etc/systemd/system/$APP_NAME.service << SERVICE
[Unit]
Description=MP Records App
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE
    
    systemctl daemon-reload
    systemctl enable $APP_NAME
    systemctl start $APP_NAME
    
    sleep 3
    check_service $APP_NAME
    
    # ========== KROK 12: Nginx ==========
    log_step "12/12 Konfiguracja Nginx..."
    cat > /etc/nginx/sites-available/$APP_NAME << 'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /uploads {
        alias APP_DIR_PLACEHOLDER/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    client_max_body_size 100M;
}
NGINX
    
    # Podmień placeholdery
    sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/$APP_NAME
    sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" /etc/nginx/sites-available/$APP_NAME
    
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Test konfiguracji
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx skonfigurowany"
    else
        log_error "Błąd konfiguracji Nginx!"
        exit 1
    fi
    
    # ========== SSL ==========
    log_step "Uzyskuję certyfikat SSL..."
    if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"; then
        log_success "SSL aktywny"
    else
        log_warning "SSL nie powiódł się - uruchom później: certbot --nginx -d $DOMAIN"
    fi
    
    # ========== PODSUMOWANIE ==========
    echo ""
    echo "========================================"
    log_success "🚀 INSTALACJA ZAKOŃCZONA!"
    echo "========================================"
    echo ""
    echo -e "🌐 Strona:     ${GREEN}https://$DOMAIN${NC}"
    echo -e "🔧 Admin:      ${GREEN}https://$DOMAIN/admin${NC}"
    echo -e "👤 Login:      ${CYAN}$ADMIN_LOGIN${NC}"
    echo ""
    echo "📝 Przydatne komendy:"
    echo "   Status:      systemctl status $APP_NAME"
    echo "   Logi:        journalctl -u $APP_NAME -f"
    echo "   Restart:     systemctl restart $APP_NAME"
    echo "   Diagnostyka: ./deploy.sh --status"
    echo "   Fix admin:   ./deploy.sh --fix-admin"
    echo ""
    
    # Uruchom diagnostykę
    run_diagnostics
}

update_app() {
    log_info "🔄 AKTUALIZACJA APLIKACJI"
    cd "$APP_DIR"
    
    # Backup przed aktualizacją
    log_info "Tworzę backup..."
    BACKUP_DIR="/tmp/mprecords-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "$APP_DIR/server/uploads" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$APP_DIR/.env" "$BACKUP_DIR/" 2>/dev/null || true
    
    # Pobierz zmiany
    log_info "Pobieram zmiany z GitHub..."
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
    
    # Instaluj zależności
    log_info "Instaluję zależności..."
    npm install --production
    
    # Przywróć uprawnienia
    chown -R www-data:www-data "$APP_DIR"
    chmod 600 "$APP_DIR/.env"
    
    # Restart
    log_info "Restartuję aplikację..."
    systemctl restart $APP_NAME
    
    sleep 3
    
    if check_service $APP_NAME; then
        log_success "Aktualizacja zakończona!"
        echo ""
        echo "📊 Commit: $(git log -1 --format='%h - %s' 2>/dev/null)"
        echo "📅 Data:   $(git log -1 --format='%ci' 2>/dev/null)"
        echo "💾 Backup: $BACKUP_DIR"
    else
        log_error "Aplikacja nie uruchomiła się! Sprawdź logi."
        log_info "Przywracam backup..."
        cp "$BACKUP_DIR/.env" "$APP_DIR/" 2>/dev/null || true
    fi
}

show_logs() {
    echo ""
    log_info "📋 OSTATNIE LOGI APLIKACJI"
    echo "========================================"
    journalctl -u $APP_NAME -n 50 --no-pager
    echo "========================================"
    echo ""
    echo "Podgląd na żywo: journalctl -u $APP_NAME -f"
}

#############################################
# GŁÓWNA LOGIKA
#############################################

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║     MP RECORDS - Deploy Script v2.0   ║"
echo "╚═══════════════════════════════════════╝"
echo ""

check_root

case "$1" in
    --setup|-s)
        first_setup
        ;;
    --status|-d)
        run_diagnostics
        ;;
    --fix-admin|-f)
        fix_admin
        ;;
    --logs|-l)
        show_logs
        ;;
    --clean|-c)
        deep_cleanup
        log_success "System wyczyszczony"
        ;;
    --help|-h)
        echo "Użycie:"
        echo "  ./deploy.sh --setup      Pierwsza instalacja"
        echo "  ./deploy.sh              Aktualizacja (git pull + restart)"
        echo "  ./deploy.sh --status     Diagnostyka systemu"
        echo "  ./deploy.sh --fix-admin  Napraw konto admina"
        echo "  ./deploy.sh --logs       Pokaż logi aplikacji"
        echo "  ./deploy.sh --clean      Wyczyść stare konfiguracje"
        echo ""
        ;;
    *)
        if [[ ! -f "/etc/systemd/system/$APP_NAME.service" ]]; then
            log_error "Aplikacja nie jest zainstalowana."
            echo ""
            read -p "Czy uruchomić pierwszą instalację? (t/n): " INSTALL
            if [[ "$INSTALL" == "t" || "$INSTALL" == "T" ]]; then
                first_setup
            else
                log_info "Użyj: ./deploy.sh --setup"
            fi
        else
            update_app
        fi
        ;;
esac

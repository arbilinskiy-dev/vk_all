#!/bin/bash
# =====================================================
# VK Content Planner — Инициализация новой VM
# =====================================================
# Запускать ОДИН РАЗ на свежей VM после создания.
# Устанавливает все пакеты, настраивает безопасность,
# nginx, SSL, Docker и запускает бэкенд.
#
# Использование:
#   scp vm_init.sh yc-user@<IP>:~/vm_init.sh
#   ssh yc-user@<IP> "chmod +x ~/vm_init.sh && sudo ~/vm_init.sh"
#
# Предварительные требования:
#   - Ubuntu 22.04 / 24.04 (Yandex Cloud)
#   - DNS: api.dosmmit.ru → IP этой VM
#   - Docker-образ уже собран и залит в Container Registry
#   - .env.production подготовлен и загружен в /home/yc-user/vkplanner/
# =====================================================

set -euo pipefail

DOMAIN="api.dosmmit.ru"
APP_DIR="/home/yc-user/vkplanner"
DOCKER_IMAGE="cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:latest"

echo "==========================================="
echo "  VK Planner — VM Init"
echo "==========================================="

# =====================================================
# 1. ОБНОВЛЕНИЕ СИСТЕМЫ
# =====================================================
echo "[1/8] Обновление системы..."
apt-get update -qq
apt-get upgrade -y -qq

# =====================================================
# 2. УСТАНОВКА ПАКЕТОВ
# =====================================================
echo "[2/8] Установка пакетов (nginx, fail2ban, certbot, ufw)..."
apt-get install -y -qq nginx fail2ban certbot python3-certbot-nginx ufw

# =====================================================
# 3. БЕЗОПАСНОСТЬ SSH
# =====================================================
echo "[3/8] Настройка SSH..."

# Отключаем вход по паролю (вход только по SSH-ключу)
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config

# Убедимся, что настройки есть (если sed не нашёл строку — добавим)
grep -q '^PasswordAuthentication no' /etc/ssh/sshd_config || echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config
grep -q '^ChallengeResponseAuthentication no' /etc/ssh/sshd_config || echo 'ChallengeResponseAuthentication no' >> /etc/ssh/sshd_config

systemctl restart ssh
echo "  SSH: вход по паролю отключён"

# =====================================================
# 4. ФАЙРВОЛ (UFW)
# =====================================================
echo "[4/8] Настройка файрвола (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (для Let's Encrypt + редирект)
ufw allow 443/tcp  # HTTPS
ufw --force enable
echo "  UFW: включён (22, 80, 443)"

# =====================================================
# 5. FAIL2BAN
# =====================================================
echo "[5/8] Настройка fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 86400
findtime = 600
maxretry = 3
banaction = iptables-multiport

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
findtime = 600
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "  fail2ban: 3 попытки → бан на 24 часа"

# =====================================================
# 6. NGINX + SSL
# =====================================================
echo "[6/8] Настройка nginx..."

# Добавляем rate limit zone в nginx.conf (в http-блок)
if ! grep -q 'callback_tunnel' /etc/nginx/nginx.conf; then
    sed -i '/http {/a\\tlimit_req_zone $binary_remote_addr zone=callback_tunnel:10m rate=5r/s;' /etc/nginx/nginx.conf
    echo "  nginx: добавлен rate limit zone"
fi

# Создаём конфиг сайта (без SSL — certbot добавит позже)
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Для Let's Encrypt проверки
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # SSH Tunnel для локальной разработки
    location /api/vk/callback-local {
        limit_req zone=callback_tunnel burst=10 nodelay;
        rewrite ^/api/vk/callback-local(.*) /api/vk/callback\$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Проксируем все запросы на Docker-контейнер
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }
}
EOF

# Включаем сайт
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

nginx -t && systemctl reload nginx
echo "  nginx: конфиг создан и активирован"

# SSL сертификат через Let's Encrypt
echo "  Запрашиваем SSL-сертификат..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@dosmmit.ru --redirect
echo "  SSL: сертификат получен, автообновление активно"

# =====================================================
# 7. DOCKER + ПРИЛОЖЕНИЕ
# =====================================================
echo "[7/8] Запуск приложения..."

# Создаём директорию проекта если нет
mkdir -p $APP_DIR

# Проверяем наличие docker-compose.yml и .env.production
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
    echo "  ОШИБКА: $APP_DIR/docker-compose.yml не найден!"
    echo "  Загрузите файл: scp docker-compose.yml yc-user@<IP>:$APP_DIR/"
    echo "  Затем перезапустите: cd $APP_DIR && docker compose up -d"
else
    if [ ! -f "$APP_DIR/.env.production" ]; then
        echo "  ОШИБКА: $APP_DIR/.env.production не найден!"
        echo "  Загрузите файл: scp .env.production yc-user@<IP>:$APP_DIR/"
    else
        cd $APP_DIR
        docker compose pull
        docker compose up -d
        echo "  Docker: контейнер запущен"
    fi
fi

# =====================================================
# 8. ПРОВЕРКА
# =====================================================
echo "[8/8] Проверка..."
echo ""

# Ждём старта
sleep 5

echo "  SSH:       $(sshd -T 2>/dev/null | grep -c 'passwordauthentication no' || echo '?') (ожидается 1)"
echo "  UFW:       $(ufw status | grep -c 'ALLOW' || echo '?') правил"
echo "  fail2ban:  $(fail2ban-client status sshd 2>/dev/null | grep 'Currently banned' || echo 'не определено')"
echo "  nginx:     $(systemctl is-active nginx)"
echo "  docker:    $(docker ps --format '{{.Status}}' 2>/dev/null | head -1 || echo 'не запущен')"
echo "  certbot:   $(systemctl is-active certbot.timer 2>/dev/null || echo 'не определено')"

# Проверяем API
API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/version 2>/dev/null || echo "000")
echo "  API:       HTTP $API_STATUS"

echo ""
echo "==========================================="
if [ "$API_STATUS" = "200" ]; then
    echo "  ✅ VM полностью настроена и работает!"
else
    echo "  ⚠️ VM настроена, но API пока не отвечает."
    echo "  Проверьте: docker logs vkplanner-backend"
fi
echo "==========================================="

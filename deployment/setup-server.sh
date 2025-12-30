#!/bin/bash

set -e

echo "=========================================="
echo "WoW Server Dashboard - Setup Script"
echo "=========================================="

if [ "$EUID" -ne 0 ]; then 
  echo "Por favor, execute como root (sudo)"
  exit 1
fi

read -p "Digite seu domínio (ou pressione Enter para usar IP): " DOMAIN
read -p "Digite seu email para Let's Encrypt: " EMAIL

if [ -z "$DOMAIN" ]; then
  DOMAIN=$(curl -s ifconfig.me)
  echo "Usando IP público: $DOMAIN"
fi

echo ""
echo "Atualizando sistema..."
apt update && apt upgrade -y

echo ""
echo "Instalando dependências..."
apt install -y curl git nginx ufw fail2ban certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

npm install -g pm2

echo ""
echo "Configurando Firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 8085/tcp
ufw allow 3724/tcp
ufw allow 7878/tcp
ufw --force enable

echo ""
echo "Configurando Fail2Ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo ""
echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/wow-dashboard <<EOF
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone \$binary_remote_addr zone=conn_limit:10m;

upstream backend {
    server 127.0.0.1:4000;
    keepalive 64;
}

server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;
    client_body_timeout 30s;
    client_header_timeout 30s;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        root /var/www/wow-dashboard;
        try_files \$uri \$uri/ /index.html;
        
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
        gzip_comp_level 6;
        
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/wow-dashboard /etc/nginx/sites-enabled/

nginx -t && systemctl restart nginx

if [ ! -z "$EMAIL" ]; then
  echo ""
  echo "Configurando HTTPS com Let's Encrypt..."
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect
fi

echo ""
echo "Otimizando MySQL..."
cat >> /etc/mysql/mysql.conf.d/mysqld.cnf <<EOF

max_connections = 200
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
query_cache_type = 1
query_cache_size = 64M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
EOF

systemctl restart mysql

echo ""
echo "=========================================="
echo "Setup concluído com sucesso!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Configure o arquivo .env no diretório do projeto"
echo "2. Execute: npm install (no diretório raiz e em /server)"
echo "3. Execute: npm run build (para gerar o frontend)"
echo "4. Execute: ./deployment/deploy.sh (para fazer deploy)"
echo ""
echo "Domínio/IP: $DOMAIN"
echo "Firewall: Ativo (UFW)"
echo "Fail2Ban: Ativo"
echo "Nginx: Configurado"
if [ ! -z "$EMAIL" ]; then
  echo "HTTPS: Configurado"
fi
echo ""

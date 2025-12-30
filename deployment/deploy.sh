#!/bin/bash

set -e

echo "=========================================="
echo "WoW Server Dashboard - Deploy Script"
echo "=========================================="

PROJECT_DIR="/var/www/wow-dashboard"
REPO_DIR=$(pwd)

if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "Erro: Execute este script do diretório raiz do projeto"
  exit 1
fi

echo ""
echo "Instalando dependências do frontend..."
npm install

echo ""
echo "Instalando dependências do backend..."
cd server
npm install
cd ..

echo ""
echo "Buildando frontend..."
npm run build

echo ""
echo "Copiando arquivos para $PROJECT_DIR..."
sudo mkdir -p $PROJECT_DIR
sudo cp -r dist/* $PROJECT_DIR/
sudo cp -r server $PROJECT_DIR/
sudo cp package.json $PROJECT_DIR/

sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

echo ""
echo "Configurando PM2..."
cd $PROJECT_DIR/server

pm2 delete wow-api 2>/dev/null || true

pm2 start index.js --name wow-api --time --log /var/log/pm2-wow-api.log

pm2 save
pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "=========================================="
echo "Deploy concluído com sucesso!"
echo "=========================================="
echo ""
echo "Comandos úteis:"
echo "  pm2 status          - Ver status do servidor"
echo "  pm2 logs wow-api    - Ver logs em tempo real"
echo "  pm2 restart wow-api - Reiniciar servidor"
echo "  pm2 stop wow-api    - Parar servidor"
echo ""

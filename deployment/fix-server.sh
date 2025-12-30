#!/bin/bash

echo "=========================================="
echo "CORRIGINDO PROBLEMAS DO SERVIDOR WOW"
echo "=========================================="
echo ""

echo "1. INICIANDO MYSQL..."
sudo systemctl start mysql
sudo systemctl enable mysql
sleep 2

if sudo systemctl is-active --quiet mysql; then
    echo "✅ MySQL iniciado com sucesso!"
else
    echo "❌ Falha ao iniciar MySQL. Verificando logs..."
    sudo journalctl -u mysql -n 20 --no-pager
fi
echo ""

echo "2. VERIFICANDO NGINX..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx já está rodando"
else
    echo "Iniciando Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi
echo ""

echo "3. INSTALANDO PM2 (se necessário)..."
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 já instalado"
fi
echo ""

echo "4. VERIFICANDO WORLDSERVER..."
if pgrep -f worldserver > /dev/null; then
    echo "✅ Worldserver já está rodando"
else
    echo "⚠️  Worldserver não está rodando"
    echo "Procurando diretório do AzerothCore..."
    
    if [ -d "$HOME/azerothcore/env/dist/bin" ]; then
        echo "Encontrado em: $HOME/azerothcore/env/dist/bin"
        echo "Para iniciar manualmente:"
        echo "  cd $HOME/azerothcore/env/dist/bin"
        echo "  screen -dmS worldserver ./worldserver"
    elif [ -d "/opt/azerothcore/env/dist/bin" ]; then
        echo "Encontrado em: /opt/azerothcore/env/dist/bin"
        echo "Para iniciar manualmente:"
        echo "  cd /opt/azerothcore/env/dist/bin"
        echo "  screen -dmS worldserver ./worldserver"
    else
        echo "❌ Diretório do AzerothCore não encontrado"
        echo "Procure manualmente com: find ~ -name worldserver 2>/dev/null"
    fi
fi
echo ""

echo "5. VERIFICANDO PORTAS..."
echo "Portas abertas:"
sudo netstat -tlnp | grep -E ':(80|443|3306|3724|8085|4000)' || sudo ss -tlnp | grep -E ':(80|443|3306|3724|8085|4000)'
echo ""

echo "6. CONFIGURANDO FIREWALL..."
echo "Abrindo portas necessárias..."
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 3306/tcp comment 'MySQL'
sudo ufw allow 3724/tcp comment 'WoW Auth'
sudo ufw allow 8085/tcp comment 'WoW World'
sudo ufw allow 4000/tcp comment 'API Node'
sudo ufw reload
echo ""

echo "7. STATUS FINAL..."
echo ""
echo "MySQL:"
sudo systemctl is-active mysql
echo ""
echo "Nginx:"
sudo systemctl is-active nginx
echo ""
echo "Authserver:"
pgrep -f authserver > /dev/null && echo "✅ Rodando" || echo "❌ Parado"
echo ""
echo "Worldserver:"
pgrep -f worldserver > /dev/null && echo "✅ Rodando" || echo "❌ Parado"
echo ""

echo "=========================================="
echo "CORREÇÃO CONCLUÍDA"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Se o Worldserver não iniciou, inicie manualmente"
echo "2. Configure o PM2 para o Node.js: pm2 start /caminho/para/server/index.js --name wow-api"
echo "3. Verifique os logs: sudo journalctl -xe"
echo ""

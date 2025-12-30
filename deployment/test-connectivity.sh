#!/bin/bash

echo "=========================================="
echo "TESTE DE CONECTIVIDADE DO SERVIDOR WOW"
echo "=========================================="
echo ""

SERVER_IP="192.168.1.86"

echo "Testando conectividade com $SERVER_IP..."
echo ""

test_port() {
    local port=$1
    local name=$2
    echo -n "Testando porta $port ($name)... "
    
    if timeout 2 bash -c "echo >/dev/tcp/$SERVER_IP/$port" 2>/dev/null; then
        echo "✅ ABERTA"
        return 0
    else
        echo "❌ FECHADA ou INACESSÍVEL"
        return 1
    fi
}

echo "PORTAS WEB:"
test_port 80 "HTTP"
test_port 443 "HTTPS"

echo ""
echo "PORTAS WOW:"
test_port 3724 "Authserver"
test_port 8085 "Worldserver"

echo ""
echo "PORTAS BACKEND:"
test_port 4000 "API Node.js"
test_port 3306 "MySQL"

echo ""
echo "TESTE DE PING:"
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ Servidor responde ao ping"
else
    echo "❌ Servidor não responde ao ping"
fi

echo ""
echo "TESTE HTTP:"
if command -v curl &> /dev/null; then
    echo "Testando HTTP..."
    http_status=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP 2>/dev/null || echo "000")
    if [ "$http_status" != "000" ]; then
        echo "✅ HTTP respondeu com status: $http_status"
    else
        echo "❌ HTTP não respondeu"
    fi
else
    echo "curl não instalado, pulando teste HTTP"
fi

echo ""
echo "=========================================="
echo "RESUMO:"
echo "=========================================="
echo "Se as portas estiverem fechadas, verifique:"
echo "1. Firewall no servidor (ufw status)"
echo "2. Serviços rodando (systemctl status)"
echo "3. Port forwarding no roteador (se acesso externo)"
echo ""

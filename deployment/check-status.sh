#!/bin/bash

echo "=========================================="
echo "VERIFICAÇÃO RÁPIDA DO SERVIDOR WOW"
echo "=========================================="
echo ""

check_service() {
    local service=$1
    local name=$2
    if systemctl is-active --quiet $service 2>/dev/null; then
        echo "✅ $name está RODANDO"
        return 0
    else
        echo "❌ $name está PARADO"
        return 1
    fi
}

check_port() {
    local port=$1
    local name=$2
    if netstat -tln 2>/dev/null | grep -q ":$port " || ss -tln 2>/dev/null | grep -q ":$port "; then
        echo "✅ Porta $port ($name) está ABERTA"
        return 0
    else
        echo "❌ Porta $port ($name) está FECHADA"
        return 1
    fi
}

check_process() {
    local process=$1
    local name=$2
    if pgrep -f "$process" > /dev/null 2>&1; then
        echo "✅ $name está RODANDO"
        return 0
    else
        echo "❌ $name NÃO está rodando"
        return 1
    fi
}

echo "SERVIÇOS:"
check_service mysql "MySQL"
check_service nginx "Nginx"

echo ""
echo "PROCESSOS WOW:"
check_process "worldserver" "Worldserver"
check_process "authserver" "Authserver"

echo ""
echo "PROCESSOS NODE.JS:"
if command -v pm2 &> /dev/null; then
    pm2_count=$(pm2 list | grep -c "online" 2>/dev/null || echo "0")
    if [ "$pm2_count" -gt 0 ]; then
        echo "✅ PM2 com $pm2_count processo(s) online"
        pm2 list
    else
        echo "❌ PM2 sem processos rodando"
    fi
else
    echo "❌ PM2 não instalado"
fi

echo ""
echo "PORTAS:"
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3306 "MySQL"
check_port 3724 "WoW Auth"
check_port 8085 "WoW World"
check_port 4000 "API Node.js"

echo ""
echo "CONECTIVIDADE:"
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo "✅ Internet OK"
else
    echo "❌ Sem internet"
fi

echo ""
echo "ESPAÇO EM DISCO:"
disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 80 ]; then
    echo "✅ Disco: ${disk_usage}% usado"
else
    echo "⚠️  Disco: ${disk_usage}% usado (ATENÇÃO!)"
fi

echo ""
echo "MEMÓRIA:"
mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
echo "Uso de memória: ${mem_usage}%"

echo ""
echo "=========================================="
echo "Para diagnóstico completo, execute:"
echo "  ./deployment/diagnostico.sh"
echo "=========================================="

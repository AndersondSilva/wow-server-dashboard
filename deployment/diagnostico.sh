#!/bin/bash

echo "=========================================="
echo "DIAGNÓSTICO DO SERVIDOR WOW"
echo "=========================================="
echo ""
date
echo ""

echo "=========================================="
echo "1. INFORMAÇÕES DO SISTEMA"
echo "=========================================="
echo "Hostname: $(hostname)"
echo "IP Local: $(hostname -I | awk '{print $1}')"
echo "Uptime: $(uptime -p)"
echo "Memória:"
free -h
echo ""
echo "Disco:"
df -h / | tail -1
echo ""

echo "=========================================="
echo "2. STATUS DO MYSQL"
echo "=========================================="
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL está RODANDO"
    mysql --version
    echo ""
    echo "Conexões ativas:"
    mysqladmin -u root processlist 2>/dev/null | head -10 || echo "Necessário senha root"
else
    echo "❌ MySQL está PARADO"
fi
echo ""

echo "=========================================="
echo "3. STATUS DO NGINX"
echo "=========================================="
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está RODANDO"
    nginx -v 2>&1
    echo ""
    echo "Configuração:"
    nginx -t 2>&1
else
    echo "❌ Nginx está PARADO"
fi
echo ""

echo "=========================================="
echo "4. STATUS DO PM2 (Node.js)"
echo "=========================================="
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 instalado"
    pm2 list
    echo ""
    echo "Logs recentes:"
    pm2 logs --lines 10 --nostream 2>/dev/null || echo "Nenhum processo PM2 rodando"
else
    echo "❌ PM2 não instalado"
fi
echo ""

echo "=========================================="
echo "5. PORTAS EM USO"
echo "=========================================="
echo "Portas importantes:"
netstat -tlnp 2>/dev/null | grep -E ':(80|443|3306|3724|8085|7878|4000)' || ss -tlnp | grep -E ':(80|443|3306|3724|8085|7878|4000)'
echo ""

echo "=========================================="
echo "6. FIREWALL (UFW)"
echo "=========================================="
if command -v ufw &> /dev/null; then
    sudo ufw status verbose 2>/dev/null || ufw status
else
    echo "UFW não instalado"
fi
echo ""

echo "=========================================="
echo "7. PROCESSOS DO SERVIDOR WOW"
echo "=========================================="
echo "Worldserver:"
ps aux | grep -i worldserver | grep -v grep || echo "❌ Worldserver não encontrado"
echo ""
echo "Authserver:"
ps aux | grep -i authserver | grep -v grep || echo "❌ Authserver não encontrado"
echo ""

echo "=========================================="
echo "8. BANCOS DE DADOS"
echo "=========================================="
if systemctl is-active --quiet mysql; then
    echo "Verificando bancos de dados..."
    mysql -u root -e "SHOW DATABASES;" 2>/dev/null | grep -E "(acore_auth|characters|acore_world)" || echo "Necessário senha root para verificar"
else
    echo "MySQL não está rodando"
fi
echo ""

echo "=========================================="
echo "9. LOGS RECENTES DE ERRO"
echo "=========================================="
echo "Últimos erros do sistema:"
journalctl -p err -n 5 --no-pager 2>/dev/null || tail -20 /var/log/syslog | grep -i error
echo ""

echo "=========================================="
echo "10. CONECTIVIDADE"
echo "=========================================="
echo "Testando conectividade externa:"
ping -c 2 8.8.8.8 > /dev/null 2>&1 && echo "✅ Internet OK" || echo "❌ Sem internet"
echo ""
echo "IP Público:"
curl -s ifconfig.me || echo "Não foi possível obter IP público"
echo ""

echo "=========================================="
echo "11. ESPAÇO EM DISCO"
echo "=========================================="
df -h
echo ""

echo "=========================================="
echo "12. ARQUIVOS DO PROJETO"
echo "=========================================="
if [ -d "/var/www/wow-dashboard" ]; then
    echo "✅ Diretório do projeto existe: /var/www/wow-dashboard"
    ls -lh /var/www/wow-dashboard/ | head -10
else
    echo "❌ Diretório /var/www/wow-dashboard não encontrado"
fi
echo ""

if [ -f "/var/www/wow-dashboard/server/index.js" ]; then
    echo "✅ Servidor backend encontrado"
else
    echo "❌ Servidor backend não encontrado"
fi
echo ""

echo "=========================================="
echo "DIAGNÓSTICO COMPLETO"
echo "=========================================="
echo ""
echo "Para mais detalhes, execute:"
echo "  sudo systemctl status mysql"
echo "  sudo systemctl status nginx"
echo "  pm2 logs"
echo "  tail -f /var/log/nginx/error.log"
echo ""

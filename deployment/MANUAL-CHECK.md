# Guia de Verificação Manual do Servidor

Execute estes comandos diretamente no terminal SSH conectado ao servidor Ubuntu (192.168.1.86):

## 1. Verificar Serviços Principais

```bash
# MySQL
sudo systemctl status mysql

# Nginx
sudo systemctl status nginx

# Ver todos os serviços ativos
systemctl list-units --type=service --state=running | grep -E 'mysql|nginx'
```

## 2. Verificar Processos do Servidor WoW

```bash
# Worldserver
ps aux | grep worldserver | grep -v grep

# Authserver
ps aux | grep authserver | grep -v grep

# Ver todos os processos relacionados
ps aux | grep -E 'world|auth' | grep -v grep
```

## 3. Verificar PM2 (Node.js)

```bash
# Status do PM2
pm2 status

# Logs em tempo real
pm2 logs --lines 50

# Informações detalhadas
pm2 info wow-api
```

## 4. Verificar Portas Abertas

```bash
# Ver todas as portas em uso
sudo netstat -tlnp | grep -E ':(80|443|3306|3724|8085|7878|4000)'

# Ou usando ss
sudo ss -tlnp | grep -E ':(80|443|3306|3724|8085|7878|4000)'

# Verificar firewall
sudo ufw status verbose
```

## 5. Verificar Banco de Dados

```bash
# Conectar ao MySQL
sudo mysql -u root -p

# Dentro do MySQL, execute:
SHOW DATABASES;
USE acore_auth;
SHOW TABLES;
SELECT COUNT(*) FROM account;
EXIT;
```

## 6. Verificar Logs

```bash
# Logs do Nginx
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log

# Logs do sistema
sudo journalctl -xe -n 50

# Logs do PM2
pm2 logs wow-api --lines 50 --nostream

# Logs do worldserver (se existir)
tail -50 ~/azerothcore/env/dist/bin/logs/Server.log 2>/dev/null
```

## 7. Verificar Conectividade

```bash
# IP local
hostname -I

# IP público
curl ifconfig.me

# Testar portas localmente
nc -zv localhost 80
nc -zv localhost 3306
nc -zv localhost 3724
nc -zv localhost 8085
nc -zv localhost 4000
```

## 8. Verificar Espaço em Disco

```bash
# Espaço geral
df -h

# Espaço do projeto
du -sh /var/www/wow-dashboard 2>/dev/null
du -sh ~/azerothcore 2>/dev/null
```

## 9. Verificar Memória e CPU

```bash
# Memória
free -h

# CPU e processos
top -bn1 | head -20

# Processos que mais consomem memória
ps aux --sort=-%mem | head -10
```

## 10. Teste Rápido da API

```bash
# Testar endpoint de health
curl http://localhost:4000/api/health

# Testar Nginx
curl http://localhost

# Ver configuração do Nginx
sudo nginx -t
```

## Scripts Automatizados

Se você transferiu os scripts de diagnóstico, execute:

```bash
# Verificação rápida
bash ~/wow-server-dashboard/deployment/check-status.sh

# Diagnóstico completo
bash ~/wow-server-dashboard/deployment/diagnostico.sh
```

## Comandos de Emergência

### Reiniciar Serviços

```bash
# Reiniciar MySQL
sudo systemctl restart mysql

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PM2
pm2 restart all

# Reiniciar Worldserver (se necessário)
pkill worldserver
cd ~/azerothcore/env/dist/bin
./worldserver &
```

### Ver Erros Recentes

```bash
# Erros do sistema
sudo journalctl -p err -n 20

# Erros do Nginx
sudo tail -100 /var/log/nginx/error.log | grep error

# Erros do MySQL
sudo tail -100 /var/log/mysql/error.log
```

## Checklist Rápido

Execute este comando único para ver tudo:

```bash
echo "=== MYSQL ===" && sudo systemctl is-active mysql && \
echo "=== NGINX ===" && sudo systemctl is-active nginx && \
echo "=== PM2 ===" && pm2 list && \
echo "=== PORTAS ===" && sudo netstat -tlnp | grep -E ':(80|443|3306|3724|8085|4000)' && \
echo "=== DISCO ===" && df -h / | tail -1 && \
echo "=== MEMORIA ===" && free -h | grep Mem
```

## Resultado Esperado

Se tudo estiver funcionando, você deve ver:

- ✅ MySQL: active (running)
- ✅ Nginx: active (running)
- ✅ PM2: 1+ processos online
- ✅ Portas 80, 443, 3306, 3724, 8085 abertas
- ✅ Worldserver e Authserver rodando
- ✅ Disco com espaço disponível
- ✅ API respondendo em localhost:4000

---

**Dica:** Copie e cole os comandos diretamente no terminal SSH!

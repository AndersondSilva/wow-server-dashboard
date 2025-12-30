# COMANDOS PARA CORRIGIR OS PROBLEMAS

Execute estes comandos no terminal SSH (anderson@ubuntu-server):

## 🔴 PROBLEMA 1: MySQL está PARADO

```bash
# Iniciar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar status
sudo systemctl status mysql

# Se falhar, ver logs
sudo journalctl -u mysql -n 50 --no-pager
```

## 🔴 PROBLEMA 2: Worldserver não está rodando

Primeiro, encontre onde está o worldserver:

```bash
# Procurar worldserver
find ~ -name worldserver -type f 2>/dev/null
find /opt -name worldserver -type f 2>/dev/null
```

Depois de encontrar, inicie (substitua o caminho):

```bash
# Exemplo se estiver em ~/azerothcore
cd ~/azerothcore/env/dist/bin
screen -dmS worldserver ./worldserver

# Ou se estiver em /opt
cd /opt/azerothcore/env/dist/bin
screen -dmS worldserver ./worldserver

# Verificar se iniciou
ps aux | grep worldserver | grep -v grep
```

## 🔴 PROBLEMA 3: PM2 não instalado

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

## ⚠️ PROBLEMA 4: Portas WoW não abertas no Firewall

```bash
# Abrir portas necessárias
sudo ufw allow 3724/tcp comment 'WoW Auth'
sudo ufw allow 8085/tcp comment 'WoW World'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw reload

# Verificar
sudo ufw status numbered
```

## 🔧 VERIFICAÇÃO COMPLETA APÓS CORREÇÕES

Execute este comando para verificar tudo novamente:

```bash
echo "=== MYSQL ===" && sudo systemctl is-active mysql && \
echo "=== NGINX ===" && sudo systemctl is-active nginx && \
echo "=== AUTHSERVER ===" && (pgrep -f authserver > /dev/null && echo "Rodando" || echo "Parado") && \
echo "=== WORLDSERVER ===" && (pgrep -f worldserver > /dev/null && echo "Rodando" || echo "Parado") && \
echo "=== PORTAS ===" && sudo netstat -tlnp | grep -E ':(80|443|3306|3724|8085|4000)'
```

## 📍 LOCALIZAR DIRETÓRIOS IMPORTANTES

```bash
# Encontrar AzerothCore
find ~ -type d -name "azerothcore" 2>/dev/null
find /opt -type d -name "azerothcore" 2>/dev/null

# Encontrar projeto wow-dashboard
find ~ -type d -name "wow-server-dashboard" 2>/dev/null
find ~ -type d -name "wow-dashboard" 2>/dev/null

# Ver estrutura do home
ls -la ~
```

## 🚀 INICIAR TUDO DE UMA VEZ

```bash
# MySQL
sudo systemctl start mysql && echo "MySQL iniciado"

# Nginx
sudo systemctl start nginx && echo "Nginx iniciado"

# Firewall
sudo ufw allow 3724/tcp && sudo ufw allow 8085/tcp && sudo ufw allow 443/tcp && sudo ufw reload && echo "Firewall configurado"

# PM2 (se já tiver o projeto)
# pm2 start ~/caminho/para/server/index.js --name wow-api
```

## 📊 VERIFICAR LOGS DE ERRO

```bash
# MySQL
sudo tail -50 /var/log/mysql/error.log

# Nginx
sudo tail -50 /var/log/nginx/error.log

# Sistema
sudo journalctl -p err -n 20 --no-pager

# Worldserver (se existir)
tail -50 ~/azerothcore/env/dist/bin/logs/Server.log 2>/dev/null
```

## 🔍 DIAGNÓSTICO DO MYSQL

Se o MySQL não iniciar:

```bash
# Ver erro específico
sudo systemctl status mysql -l

# Ver logs detalhados
sudo journalctl -u mysql -n 100 --no-pager

# Verificar configuração
sudo mysqld --verbose --help | grep -A 1 'Default options'

# Tentar iniciar em modo seguro
sudo mysqld_safe --skip-grant-tables &
```

---

**IMPORTANTE:** Execute os comandos na ordem e me envie o resultado de cada etapa!

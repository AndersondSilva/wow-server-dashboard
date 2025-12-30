# WoW Server Dashboard - Guia de Deploy para Produção

## 📋 Pré-requisitos

- Ubuntu Server 20.04+ instalado no notebook Asus (IP: 192.168.1.86)
- Acesso SSH ao servidor
- Servidor WoW (AzerothCore) já instalado e funcionando
- MySQL com bancos `acore_auth` e `characters`
- Domínio próprio (opcional, mas recomendado) ou usar IP público

## 🔐 Segurança Implementada

### Proteções Ativas:
- ✅ **Helmet.js** - Headers de segurança HTTP
- ✅ **Rate Limiting** - Proteção contra força bruta e DDoS
- ✅ **CORS** configurável
- ✅ **Fail2Ban** - Bloqueio automático de IPs maliciosos
- ✅ **UFW Firewall** - Apenas portas necessárias abertas
- ✅ **HTTPS/SSL** com Let's Encrypt
- ✅ **Logging completo** de acessos e erros
- ✅ **Validação de entrada** em todas as rotas
- ✅ **JWT** para autenticação segura
- ✅ **Bcrypt** para hash de senhas

## 🚀 Passo a Passo de Deploy

### 1. Preparar o Servidor Ubuntu

Conecte-se ao servidor via SSH:

```bash
ssh usuario@192.168.1.86
```

Clone o repositório no servidor:

```bash
cd /home/usuario
git clone <seu-repositorio> wow-server-dashboard
cd wow-server-dashboard
```

### 2. Executar Setup Inicial

Torne os scripts executáveis e execute o setup:

```bash
chmod +x deployment/*.sh
sudo ./deployment/setup-server.sh
```

O script irá:
- Instalar Node.js 20, Nginx, UFW, Fail2Ban, Certbot
- Configurar firewall (portas: SSH, HTTP/HTTPS, 8085, 3724, 7878)
- Configurar Nginx com rate limiting e compressão
- Configurar HTTPS (se você fornecer um domínio)
- Otimizar MySQL

### 3. Configurar Segurança do MySQL

Execute o script de segurança do banco:

```bash
sudo ./deployment/secure-mysql.sh
```

Isso irá:
- Criar usuário `wowuser` com permissões limitadas
- Remover usuários anônimos
- Remover acesso root remoto
- Remover banco de teste

**IMPORTANTE:** Salve a senha gerada!

### 4. Configurar Variáveis de Ambiente

Crie o arquivo `.env` no diretório `server/`:

```bash
cd server
cp .env.example .env
nano .env
```

Configure as variáveis:

```env
PORT=4000
DB_HOST=localhost
DB_USER=wowuser
DB_PASS=senha_gerada_no_passo_3
DB_CHAR=characters
DB_AUTH=acore_auth
CORS_ORIGIN=https://seu-dominio.com
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_EMAILS=seu_email@dominio.com
NODE_ENV=production
```

**Gerar JWT_SECRET seguro:**
```bash
openssl rand -base64 32
```

### 5. Fazer Deploy da Aplicação

Execute o script de deploy:

```bash
cd /home/usuario/wow-server-dashboard
./deployment/deploy.sh
```

O script irá:
- Instalar dependências (frontend e backend)
- Buildar o frontend
- Copiar arquivos para `/var/www/wow-dashboard`
- Configurar PM2 para gerenciar o processo Node.js
- Iniciar o servidor automaticamente

### 6. Configurar Backup Automático

Configure o cron para backup diário:

```bash
sudo crontab -e
```

Adicione a linha (backup às 3h da manhã):

```cron
0 3 * * * DB_PASS=sua_senha_mysql /home/usuario/wow-server-dashboard/deployment/backup-db.sh
```

### 7. Configurar Acesso Externo (Internet)

#### Opção A: Usar IP Público Direto

1. Configure port forwarding no seu roteador:
   - Porta 80 → 192.168.1.86:80
   - Porta 443 → 192.168.1.86:443
   - Porta 8085 → 192.168.1.86:8085 (worldserver)
   - Porta 3724 → 192.168.1.86:3724 (authserver)

2. Descubra seu IP público:
```bash
curl ifconfig.me
```

3. Seus amigos acessarão: `http://SEU_IP_PUBLICO`

#### Opção B: Usar Domínio (Recomendado)

1. Registre um domínio (ex: Namecheap, GoDaddy, Hostinger)

2. Configure DNS apontando para seu IP público:
   - Tipo A: `@` → SEU_IP_PUBLICO
   - Tipo A: `www` → SEU_IP_PUBLICO

3. Configure HTTPS:
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

4. Atualize o `.env`:
```env
CORS_ORIGIN=https://seu-dominio.com
```

5. Reinicie o servidor:
```bash
pm2 restart wow-api
```

#### Opção C: Usar Cloudflare Tunnel (Sem Port Forwarding)

Se não puder fazer port forwarding:

1. Crie conta no Cloudflare
2. Instale cloudflared:
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

3. Configure o tunnel:
```bash
cloudflared tunnel login
cloudflared tunnel create wow-server
cloudflared tunnel route dns wow-server seu-dominio.com
```

4. Crie arquivo de configuração:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/usuario/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: seu-dominio.com
    service: http://localhost:80
  - service: http_status:404
```

5. Execute o tunnel:
```bash
cloudflared tunnel run wow-server
```

### 8. Configurar Cliente WoW dos Jogadores

Seus amigos precisarão editar o arquivo `realmlist.wtf`:

```
set realmlist SEU_IP_PUBLICO
# ou
set realmlist seu-dominio.com
```

## 📊 Monitoramento e Manutenção

### Verificar Status do Servidor

```bash
pm2 status
pm2 logs wow-api
```

### Ver Logs

```bash
tail -f /var/www/wow-dashboard/server/logs/error.log
tail -f /var/www/wow-dashboard/server/logs/access.log
tail -f /var/log/nginx/access.log
```

### Reiniciar Serviços

```bash
pm2 restart wow-api
sudo systemctl restart nginx
sudo systemctl restart mysql
```

### Atualizar Aplicação

```bash
cd /home/usuario/wow-server-dashboard
git pull
./deployment/deploy.sh
```

### Restaurar Backup

```bash
gunzip /var/backups/wow-server/acore_auth_YYYYMMDD_HHMMSS.sql.gz
mysql -u wowuser -p acore_auth < /var/backups/wow-server/acore_auth_YYYYMMDD_HHMMSS.sql
```

## 🔧 Comandos Úteis

### PM2
```bash
pm2 status              # Ver status
pm2 logs wow-api        # Ver logs em tempo real
pm2 restart wow-api     # Reiniciar
pm2 stop wow-api        # Parar
pm2 start wow-api       # Iniciar
pm2 monit               # Monitor interativo
```

### Nginx
```bash
sudo nginx -t                    # Testar configuração
sudo systemctl restart nginx     # Reiniciar
sudo systemctl status nginx      # Ver status
```

### Firewall
```bash
sudo ufw status                  # Ver status
sudo ufw allow 8080/tcp          # Abrir porta
sudo ufw deny 8080/tcp           # Fechar porta
```

### Fail2Ban
```bash
sudo fail2ban-client status      # Ver status
sudo fail2ban-client status sshd # Ver IPs banidos
sudo fail2ban-client unban IP    # Desbanir IP
```

## 🛡️ Checklist de Segurança

- [ ] Firewall UFW ativo
- [ ] Fail2Ban configurado
- [ ] HTTPS/SSL ativo
- [ ] Senhas fortes no MySQL
- [ ] JWT_SECRET aleatório e seguro
- [ ] CORS_ORIGIN configurado (não usar `*` em produção)
- [ ] Backup automático configurado
- [ ] Logs sendo gerados
- [ ] Rate limiting ativo
- [ ] Usuário MySQL com permissões limitadas

## 📱 Acesso dos Jogadores

### Criar Conta

1. Acessar: `https://seu-dominio.com`
2. Clicar em "Registrar"
3. Preencher dados e criar conta
4. A conta será criada automaticamente no servidor WoW

### Configurar Cliente

1. Baixar cliente WoW 3.3.5a
2. Editar `realmlist.wtf`:
   ```
   set realmlist seu-dominio.com
   ```
3. Fazer login com as credenciais criadas

## 🆘 Troubleshooting

### Erro de Conexão com MySQL
```bash
sudo systemctl status mysql
sudo mysql -u wowuser -p
```

### Site não carrega
```bash
sudo systemctl status nginx
sudo nginx -t
pm2 logs wow-api
```

### Porta bloqueada
```bash
sudo ufw status
sudo netstat -tulpn | grep PORTA
```

### SSL não funciona
```bash
sudo certbot renew --dry-run
sudo certbot certificates
```

## 📞 Suporte

Para problemas, verifique os logs:
- `/var/www/wow-dashboard/server/logs/error.log`
- `/var/log/nginx/error.log`
- `pm2 logs wow-api`

## 🔄 Atualizações Automáticas de SSL

O Certbot configura renovação automática. Verifique:

```bash
sudo systemctl status certbot.timer
```

## 🎯 Próximos Passos

1. Configurar monitoramento com Grafana/Prometheus (opcional)
2. Configurar CDN para assets estáticos (opcional)
3. Implementar sistema de notificações (Discord/Telegram)
4. Adicionar analytics (Google Analytics, Plausible)

---

**Desenvolvido com foco em segurança e desempenho** 🛡️⚡

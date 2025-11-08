# Deploy no Ubuntu 24.04 (mesmo servidor do WoW)

Este guia coloca o site (frontend) e a API (backend) no seu Ubuntu 24.04 junto com o servidor WoW.

## Pré-requisitos
- Ubuntu 24.04 com WoW server (TrinityCore/AzerothCore/MaNGOS) já configurado.
- Acesso ao MySQL/MariaDB do core (usuário/senha e DBs `auth`/`characters`).
- Node.js 20+ e npm instalados.
- Nginx instalado para servir o site e fazer proxy para a API.
- (Opcional) domínio configurado apontando para o servidor.

## 1) Clonar e preparar o projeto
```bash
cd /opt
sudo git clone <seu-repo> wow-server-dashboard
sudo chown -R $USER:$USER wow-server-dashboard
cd wow-server-dashboard
```

### Frontend
```bash
npm ci
npm run build
```
Os arquivos estáticos estarão em `dist/`.

### Backend (API)
Crie o arquivo `.env` dentro de `server/` baseado em `server/.env.example`:
```bash
cd server
cp .env.example .env
nano .env
# Ajuste DB_HOST, DB_USER, DB_PASS e DB_CHAR conforme seu MySQL
```

Instale dependências (no diretório `server/`):
```bash
npm init -y
npm install express cors mysql2
```

Teste localmente:
```bash
node index.js
# Deve exibir: WoW API listening on port 4000
curl http://localhost:4000/api/health
```

## 2) Nginx (site e proxy da API)
Crie um arquivo de site:
```bash
sudo nano /etc/nginx/sites-available/wow-dashboard
```
Conteúdo (ajuste domínio ou use IP):
```
server {
    listen 80;
    server_name <seu-dominio-ou-ip>;

    root /opt/wow-server-dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative e reinicie:
```bash
sudo ln -s /etc/nginx/sites-available/wow-dashboard /etc/nginx/sites-enabled/wow-dashboard
sudo nginx -t
sudo systemctl reload nginx
```

## 3) Systemd para a API
Crie um serviço systemd:
```bash
sudo nano /etc/systemd/system/wow-api.service
```
Conteúdo:
```
[Unit]
Description=WoW Dashboard API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/wow-server-dashboard/server
EnvironmentFile=/opt/wow-server-dashboard/server/.env
ExecStart=/usr/bin/node /opt/wow-server-dashboard/server/index.js
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

Habilite e inicie:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wow-api
sudo systemctl start wow-api
sudo systemctl status wow-api
```

## 4) Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# SOAP opcional (se habilitar admin remoto no worldserver)
sudo ufw allow 7878/tcp
```

## 5) HTTPS (opcional, recomendado)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d <seu-dominio>
```

## 6) Frontend consumindo API
No arquivo `.env.local` do frontend, defina:
```
VITE_API_URL=http://<seu-dominio-ou-ip>
```
Atualize os serviços do frontend para usar endpoints:
- `GET /api/ranking/top?limit=10`
- `GET /api/players/online`

## 7) SOAP/RA (opcional, comandos admin)
Habilite SOAP no `worldserver.conf` do seu core:
```
SOAP.Enabled = 1
SOAP.IP = 0.0.0.0
SOAP.Port = 7878
SOAP.Username = admin_api
SOAP.Password = <senha-forte>
```

Valide com curl:
```bash
curl -u admin_api:<senha> http://127.0.0.1:7878/ -H "Content-Type: text/xml" -d '<?xml version="1.0"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><executeCommand><command>.server info</command></executeCommand></SOAP-ENV:Body></SOAP-ENV:Envelope>'
```

Integre um endpoint admin (ex.: broadcast) na API com autenticação.

## 8) Manutenção
- Logs: `journalctl -u wow-api -f` e `/var/log/nginx/access.log`.
- Atualizações: pull e `npm run build`, reinicie o serviço da API.
- Segurança: nunca exponha o MySQL diretamente; mantenha o backend no mesmo host.

---

Se quiser, posso adaptar o backend para seu core específico (queries e colunas) e já atualizar o frontend para consumir `/api/` automaticamente.


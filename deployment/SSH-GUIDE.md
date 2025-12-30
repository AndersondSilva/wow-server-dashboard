# Guia Rápido - Acesso SSH ao Servidor Ubuntu

## 🔌 Conectar ao Servidor Ubuntu

No terminal do seu projeto Windows, conecte-se ao servidor:

```bash
ssh usuario@192.168.1.86
```

Substitua `usuario` pelo nome de usuário do Ubuntu Server.

## 📦 Transferir Arquivos para o Servidor

### Opção 1: Usando SCP (do Windows para Ubuntu)

```bash
scp -r deployment usuario@192.168.1.86:/home/usuario/
scp -r server usuario@192.168.1.86:/home/usuario/wow-server-dashboard/
```

### Opção 2: Usando Git (Recomendado)

No servidor Ubuntu:

```bash
cd /home/usuario
git clone <url-do-seu-repositorio> wow-server-dashboard
cd wow-server-dashboard
```

## 🚀 Executar Deploy no Servidor

Após conectar via SSH:

```bash
cd /home/usuario/wow-server-dashboard

chmod +x deployment/*.sh

sudo ./deployment/setup-server.sh

sudo ./deployment/secure-mysql.sh

cd server
cp .env.example .env
nano .env

cd ..
./deployment/deploy.sh
```

## 📝 Comandos SSH Úteis

```bash
ssh usuario@192.168.1.86                    # Conectar
scp arquivo.txt usuario@192.168.1.86:~/     # Copiar arquivo
ssh usuario@192.168.1.86 "comando"          # Executar comando remoto
exit                                         # Desconectar
```

## 🔐 Configurar Chave SSH (Opcional, mais seguro)

No Windows:

```bash
ssh-keygen -t ed25519 -C "seu_email@example.com"

ssh-copy-id usuario@192.168.1.86
```

Agora você pode conectar sem senha!

## 📊 Monitorar Servidor Remotamente

```bash
ssh usuario@192.168.1.86 "pm2 status"
ssh usuario@192.168.1.86 "pm2 logs wow-api --lines 50"
ssh usuario@192.168.1.86 "sudo systemctl status nginx"
```

## 🔄 Atualizar Aplicação Remotamente

```bash
ssh usuario@192.168.1.86 << 'EOF'
cd /home/usuario/wow-server-dashboard
git pull
./deployment/deploy.sh
EOF
```

---

Consulte `deployment/README.md` para documentação completa.

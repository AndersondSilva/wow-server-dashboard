# Guia de Deploy - WoW Server Dashboard + AzerothCore

Este guia cobre o deploy completo do servidor WoW e do Dashboard em um servidor Ubuntu limpo, utilizando Docker e Tailscale.

## Pré-requisitos
- Um servidor VPS com Ubuntu 22.04 ou 24.04 limpo.
- Acesso SSH ao servidor.
- Uma conta GitHub (para hospedar este código).

## Passo 1: Preparar o Repositório (Local)

1. **Commitar as alterações:**
   Certifique-se de que todos os arquivos (Dockerfiles, docker-compose.yml, script de setup) estão no repositório.
   ```bash
   git add .
   git commit -m "Preparando deploy com Docker e AzerothCore"
   git push origin main
   ```

## Passo 2: Configurar o Servidor (VPS)

1. **Acesse o servidor via SSH:**
   ```bash
   ssh root@SEU_IP_DO_SERVIDOR
   ```

2. **Baixe o código:**
   Se o repositório for público:
   ```bash
   git clone https://github.com/SEU_USUARIO/SEU_REPO.git wow-dashboard
   cd wow-dashboard
   ```
   Se for privado, configure uma chave SSH ou use HTTPS com token.

3. **Execute o script de setup:**
   Este script instalará Docker, Docker Compose e Tailscale.
   ```bash
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

4. **Configure o Tailscale:**
   Após rodar o script, ele pedirá para rodar `sudo tailscale up`. Faça isso e autentique-se no link fornecido.

## Passo 3: Baixar os Arquivos de Dados do WoW (Importante!)

O servidor AzerothCore precisa das pastas `data` (maps, vmaps, mmaps) para funcionar. Sem elas, o `ac-worldserver` vai fechar imediatamente.

1. Baixe os dados (dentro da pasta `wow-dashboard`):
   ```bash
   # Exemplo usando curl (verifique a versão mais recente compatível com AC)
   # O jeito mais fácil é usar o script do AC se estivesse clonado, mas via docker precisamos baixar:
   
   cd data/azerothcore
   wget https://github.com/azerothcore/azerothcore-wotlk/releases/download/v1.0.1/data.zip
   unzip data.zip
   # Mova as pastas maps, vmaps, mmaps para dentro de 'data' se necessário
   ```
   *Nota: Verifique a documentação oficial do AzerothCore para o link mais atual dos Data Files.*

## Passo 4: Configuração de Ambiente

1. Crie o arquivo `.env` de produção:
   ```bash
   cp .env.example .env
   nano .env
   ```
2. Edite as variáveis:
   - `VITE_GOOGLE_CLIENT_ID`: Seu ID do Google.
   - `JWT_SECRET`: Uma senha forte e aleatória.

## Passo 5: Iniciar Tudo

1. Suba os containers:
   ```bash
   docker compose up -d --build
   ```

2. Verifique os logs:
   ```bash
   docker compose logs -f
   ```

## Passo 6: Configurar Domínios (Nginx Proxy Manager)

1. Acesse `http://SEU_IP_TAILSCALE:81` (ou IP público se a porta 81 estiver aberta).
2. Login padrão: `admin@example.com` / `changeme`.
3. Configure os Proxy Hosts:
   - **Dashboard:** aponte para `wow-dashboard-frontend` porta `80`.
   - **API (Opcional se precisar expor):** aponte para `wow-dashboard-backend` porta `3000`.
   - Use a aba "SSL" para gerar certificados Let's Encrypt automaticamente.

## Gerenciamento

- **Parar servidor:** `docker compose down`
- **Ver status:** `docker compose ps`
- **Atualizar:** `git pull && docker compose up -d --build`

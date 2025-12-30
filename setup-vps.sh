#!/bin/bash

# ==============================================================================
# WoW Server Dashboard - Setup Script (Ubuntu 22.04/24.04)
# ==============================================================================

set -e # Exit on error

echo ">>> Iniciando setup do servidor..."

# 1. Atualizar sistema
echo ">>> Atualizando pacotes do sistema..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip

# 2. Instalar Docker e Docker Compose
if ! command -v docker &> /dev/null; then
    echo ">>> Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo ">>> Docker instalado."
else
    echo ">>> Docker já está instalado."
fi

# 3. Instalar Tailscale
if ! command -v tailscale &> /dev/null; then
    echo ">>> Instalando Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    echo ">>> Tailscale instalado. Por favor, rode 'sudo tailscale up' manualmente após este script para autenticar."
else
    echo ">>> Tailscale já está instalado."
fi

# 4. Preparar diretórios de dados
echo ">>> Criando estrutura de pastas para dados..."
mkdir -p data/mongo
mkdir -p data/mysql
mkdir -p data/npm/data
mkdir -p data/npm/letsencrypt
mkdir -p data/azerothcore/etc
mkdir -p data/azerothcore/data
mkdir -p data/azerothcore/logs

# 5. Permissões (Evitar problemas com Docker)
echo ">>> Ajustando permissões..."
# Ajuste conforme necessário, mas 777 é seguro para dev/test rápido, 
# idealmente use usuários específicos se souber os UIDs
sudo chmod -R 777 data

# 6. Aviso sobre Mapas (WoW Data)
echo "=============================================================================="
echo "ATENÇÃO: Servidor WoW precisa dos arquivos de mapas (maps, vmaps, mmaps)."
echo "Você deve baixá-los e colocá-los em: ./data/azerothcore/data"
echo "Ou o servidor não iniciará o mundo (worldserver)."
echo "=============================================================================="

echo ">>> Setup concluído!"
echo "Para iniciar tudo, rode:"
echo "  docker compose up -d"
echo ""
echo "Acesse o painel do Nginx Proxy Manager em: http://SEU_IP:81"
echo "Login padrão: admin@example.com / changeme"

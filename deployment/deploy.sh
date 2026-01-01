#!/bin/bash

# Script de Deploy para Docker Compose (Produção)

echo "=========================================="
echo "Atualizando Servidor WoW Dashboard"
echo "=========================================="

# 1. Atualizar código fonte
echo "--> Baixando atualizações do Git..."
git pull

# 2. Reconstruir e reiniciar containers
echo "--> Reconstruindo containers (Frontend e Backend)..."
# O --build força a reconstrução das imagens para pegar as mudanças do código
docker-compose up -d --build

# 3. Limpeza opcional de imagens antigas para economizar espaço
echo "--> Limpando imagens antigas..."
docker image prune -f

echo ""
echo "=========================================="
echo "Atualização concluída!"
echo "Acesse: http://192.168.1.86"
echo "=========================================="

#!/bin/bash

# Script para baixar os mapas do AzerothCore (WoW 3.3.5a)
# Fonte: https://github.com/wowgaming/client-data/releases

# Versão do Client Data a ser baixada (v19 é a recomendada atualmente para AC)
VERSION="v19"
# Nome do arquivo único que contém tudo (conforme documentação recente)
FILE="data.zip"

echo ">>> Iniciando download dos mapas (Versão $VERSION)..."

# Criar diretório data se não existir
if [ ! -d "data" ]; then
    mkdir -p data
fi

cd data

# URL de download
URL="https://github.com/wowgaming/client-data/releases/download/$VERSION/$FILE"

echo ">>> Baixando $FILE de $URL..."

# Baixar o arquivo
if curl -L -O --fail "$URL"; then
    echo ">>> Download concluído com sucesso!"
    
    echo ">>> Extraindo arquivos..."
    # Tentar unzip primeiro
    if command -v unzip >/dev/null 2>&1; then
        unzip -o $FILE
    elif command -v 7z >/dev/null 2>&1; then
        7z x -y $FILE
    else
        echo ">>> ERRO: Nem 'unzip' nem '7z' encontrados. Por favor instale um deles (sudo apt install unzip ou sudo apt install p7zip-full)."
        exit 1
    fi
    
    # Remover o zip após extração
    rm $FILE
    
    echo ">>> Extração concluída!"
    
    # Verificar se as pastas foram criadas corretamente
    if [ -d "dbc" ] && [ -d "maps" ] && [ -d "vmaps" ] && [ -d "mmaps" ]; then
        echo ">>> Verificação: Todas as pastas (dbc, maps, vmaps, mmaps) estão presentes."
    else
        echo ">>> AVISO: Algumas pastas podem estar faltando. Verifique o conteúdo extraído."
        ls -F
    fi
    
else
    echo ">>> ERRO: Falha ao baixar $FILE da versão $VERSION."
    echo ">>> URL tentada: $URL"
    echo ">>> Verifique sua conexão ou se a versão ainda existe."
    exit 1
fi

cd ..

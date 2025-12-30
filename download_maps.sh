#!/bin/bash

# Script para baixar os mapas do AzerothCore (WoW 3.3.5a)
# Fonte: https://github.com/wowgaming/client-data/releases

DATA_DIR="./data/azerothcore/data"
VERSION="v16" # Versão estável dos dados

echo ">>> Iniciando download dos mapas (Versão $VERSION)..."
echo ">>> Destino: $DATA_DIR"

mkdir -p $DATA_DIR

# Função para baixar e extrair
download_and_extract() {
    FILE=$1
    URL="https://github.com/wowgaming/client-data/releases/download/$VERSION/$FILE"
    
    echo ">>> Baixando $FILE..."
    # Usando -L para seguir redirects e -f para falhar em erros HTTP (404, etc)
    if curl -L -f -o "$DATA_DIR/$FILE" "$URL"; then
        echo ">>> Extraindo $FILE..."
        # Verifica se o arquivo baixado é um zip válido antes de tentar extrair
        if unzip -t "$DATA_DIR/$FILE" > /dev/null 2>&1; then
            unzip -o -q "$DATA_DIR/$FILE" -d "$DATA_DIR"
            rm "$DATA_DIR/$FILE"
            echo ">>> $FILE instalado com sucesso."
        else
            echo "ERROR: O arquivo baixado $FILE não é um ZIP válido. O link pode estar quebrado ou o download falhou."
            rm "$DATA_DIR/$FILE"
        fi
    else
        echo "ERROR: Falha ao baixar $FILE. URL: $URL"
    fi
}

# Baixar arquivos essenciais
download_and_extract "dbc.zip"
download_and_extract "maps.zip"
download_and_extract "vmaps.zip"
download_and_extract "mmaps.zip"
# download_and_extract "cameras.zip" # Opcional

echo ">>> Download concluído! Verifique se os arquivos estão em $DATA_DIR"
echo ">>> Agora reinicie o servidor: docker compose restart ac-worldserver"

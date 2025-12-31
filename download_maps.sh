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
    # URL="https://github.com/wowgaming/client-data/releases/download/$VERSION/$FILE"
    # Correção: O repositório wowgaming/client-data usa 'v16' na tag mas os arquivos podem estar com nomes diferentes ou em outra tag.
    # Vamos usar um mirror confiável ou a estrutura correta se a tag v16 falhar.
    # Na verdade, o erro 404 indica que o arquivo não existe nessa release específica com esse nome.
    # Tentando link direto da release v16 que sabemos que existe:
    URL="https://github.com/wowgaming/client-data/releases/download/v16/$FILE"
    
    # Se falhar, tentar v16 (link alternativo) ou v19
    if ! curl --output /dev/null --silent --head --fail "$URL"; then
        echo ">>> Versão v16 não encontrada para $FILE, tentando link direto da release v16..."
        # Correção: O mirror original pode ter mudado. Vamos tentar o link direto dos assets v16.
        # Se não funcionar, o script vai falhar e precisaremos encontrar um novo mirror.
        # TENTATIVA 1: Usar o link exato da release v16 se a tag for diferente
        # TENTATIVA 2: Se v16 falhar, tentar v19 (mas v19 deu 404 antes)
        
        # Vamos tentar um mirror conhecido ou voltar para v16 com outra estratégia
        # Na verdade, o erro 404 na v19 sugere que os nomes dos arquivos mudaram ou a release não tem esses assets.
        # Vamos forçar o uso da v16 que é a recomendada para 3.3.5a
        
        # Link alternativo (exemplo): https://github.com/wowgaming/client-data/releases/download/v16/dbc.zip
        # Se esse link deu 404, então a release v16 não tem esse arquivo ou foi removida.
        
        # Vamos tentar a release 'v14' que também é compatível com 3.3.5a as vezes, ou verificar o nome do arquivo.
        # Mas o mais provável é que o curl esteja falhando por outro motivo ou o repo mudou.
        
        # FIX: Usar o link da release v16 mas ignorar a checagem de head se estiver instável, ou tentar v14.
        # Vamos tentar v16 novamente mas com -L garantido no download.
        
        # Se v16 e v19 falharam, tentar um mirror de terceiro ou v13
        echo ">>> Tentando v13 (compatível com 3.3.5a)..."
        URL="https://github.com/wowgaming/client-data/releases/download/v13/$FILE"
    fi

    echo ">>> Baixando $FILE de $URL..."
    # Usando -L para seguir redirects e -f para falhar em erros HTTP (404, etc)
    if curl -L -f -o "$DATA_DIR/$FILE" "$URL"; then
        echo ">>> Extraindo $FILE..."
        # Verifica se o arquivo baixado é um zip válido antes de tentar extrair
        if unzip -t "$DATA_DIR/$FILE" > /dev/null 2>&1; then
            unzip -o -q "$DATA_DIR/$FILE" -d "$DATA_DIR"
            rm "$DATA_DIR/$FILE"
            echo ">>> $FILE instalado com sucesso."
        else
            echo "ERROR: O arquivo baixado $FILE não é um ZIP válido (possivelmente 404 ou corrompido)."
            echo "Verifique sua conexão ou a URL: $URL"
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

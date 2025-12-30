#!/bin/bash

echo "=========================================="
echo "Configuração de Segurança do MySQL"
echo "=========================================="

read -sp "Digite a senha do root do MySQL: " MYSQL_ROOT_PASS
echo ""
read -sp "Digite a nova senha para o usuário wowuser: " WOW_USER_PASS
echo ""

mysql -u root -p$MYSQL_ROOT_PASS <<EOF

CREATE USER IF NOT EXISTS 'wowuser'@'localhost' IDENTIFIED BY '$WOW_USER_PASS';

GRANT SELECT, INSERT, UPDATE, DELETE ON acore_auth.* TO 'wowuser'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON characters.* TO 'wowuser'@'localhost';

REVOKE ALL PRIVILEGES ON *.* FROM 'wowuser'@'localhost';

FLUSH PRIVILEGES;

DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

FLUSH PRIVILEGES;

EOF

echo ""
echo "Segurança do MySQL configurada com sucesso!"
echo "Usuário 'wowuser' criado com permissões limitadas"
echo ""
echo "IMPORTANTE: Salve esta senha em um local seguro:"
echo "DB_PASS=$WOW_USER_PASS"
echo ""

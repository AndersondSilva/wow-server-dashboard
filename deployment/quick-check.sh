echo "=== VERIFICACAO RAPIDA DO SERVIDOR WOW ===" && echo "" && echo "=== MYSQL ===" && sudo systemctl is-active mysql && echo "" && echo "=== NGINX ===" && sudo systemctl is-active nginx && echo "" && echo "=== PM2 ===" && pm2 list 2>/dev/null || echo "PM2 nao instalado ou sem processos" && echo "" && echo "=== WORLDSERVER ===" && ps aux | grep worldserver | grep -v grep || echo "Worldserver nao encontrado" && echo "" && echo "=== AUTHSERVER ===" && ps aux | grep authserver | grep -v grep || echo "Authserver nao encontrado" && echo "" && echo "=== PORTAS ABERTAS ===" && sudo netstat -tlnp 2>/dev/null | grep -E ':(80|443|3306|3724|8085|4000)' || sudo ss -tlnp | grep -E ':(80|443|3306|3724|8085|4000)' && echo "" && echo "=== DISCO ===" && df -h / | tail -1 && echo "" && echo "=== MEMORIA ===" && free -h | grep Mem && echo "" && echo "=== IP LOCAL ===" && hostname -I && echo "" && echo "=== FIREWALL ===" && sudo ufw status | head -5 && echo "" && echo "=== VERIFICACAO COMPLETA ==="echo "=== VERIFICACAO RAPIDA DO SERVIDOR WOW ===" && \
echo "" && \
echo "=== MYSQL ===" && \
sudo systemctl is-active mysql && \
echo "" && \
echo "=== NGINX ===" && \
sudo systemctl is-active nginx && \
echo "" && \
echo "=== PM2 ===" && \
pm2 list 2>/dev/null || echo "PM2 nao instalado ou sem processos" && \
echo "" && \
echo "=== WORLDSERVER ===" && \
ps aux | grep worldserver | grep -v grep || echo "Worldserver nao encontrado" && \
echo "" && \
echo "=== AUTHSERVER ===" && \
ps aux | grep authserver | grep -v grep || echo "Authserver nao encontrado" && \
echo "" && \
echo "=== PORTAS ABERTAS ===" && \
sudo netstat -tlnp 2>/dev/null | grep -E ':(80|443|3306|3724|8085|4000)' || sudo ss -tlnp | grep -E ':(80|443|3306|3724|8085|4000)' && \
echo "" && \
echo "=== DISCO ===" && \
df -h / | tail -1 && \
echo "" && \
echo "=== MEMORIA ===" && \
free -h | grep Mem && \
echo "" && \
echo "=== IP LOCAL ===" && \
hostname -I && \
echo "" && \
echo "=== FIREWALL ===" && \
sudo ufw status | head -5 && \
echo "" && \
echo "=== VERIFICACAO COMPLETA ==="

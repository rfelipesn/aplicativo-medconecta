#!/bin/sh
set -e

PORT="${PORT:-8080}"
echo "Starting nginx on port $PORT..."

# Usa sed para substituir ${PORT} no template
sed "s|\${PORT}|$PORT|g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Inicia nginx
exec nginx -g 'daemon off;'

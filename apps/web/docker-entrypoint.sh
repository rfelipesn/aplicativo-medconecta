#!/bin/sh
set -e

# Substitui ${PORT} no template (preserva outras variáveis do nginx como $uri)
export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Inicia o nginx
exec nginx -g 'daemon off;'

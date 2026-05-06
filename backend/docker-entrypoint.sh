#!/bin/sh
set -e

echo "Verificando variaveis de ambiente..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: DATABASE_URL nao definida!"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "ERRO: JWT_SECRET nao definida!"
  exit 1
fi

echo "Rodando migracoes do banco..."
npx prisma migrate deploy

echo "Criando diretorios..."
mkdir -p storage/media tmp/uploads

echo "Iniciando servidor..."
exec node dist/server/index.js

#!/bin/sh

echo "Verificando variaveis de ambiente..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: DATABASE_URL nao definida!"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "ERRO: JWT_SECRET nao definida!"
  exit 1
fi

echo "Resolvendo migracoes com falha (se houver)..."
npx prisma migrate resolve --rolled-back 20260506000002_client_isolation_and_note_sharing 2>/dev/null || true

echo "Rodando migracoes do banco..."
npx prisma migrate deploy || echo "Aviso: falha em alguma migracao, continuando..."

echo "Criando diretorios..."
mkdir -p storage/media tmp/uploads

echo "Iniciando servidor..."
exec node dist/server/index.js

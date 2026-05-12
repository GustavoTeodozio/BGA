#!/bin/sh

if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: DATABASE_URL nao definida!"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "ERRO: JWT_SECRET nao definida!"
  exit 1
fi

echo "Resolvendo migracoes travadas..."
npx prisma migrate resolve --rolled-back 20260506000002_client_isolation_and_note_sharing 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260506000003_create_missing_tables 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260507000000_contractmonths_to_string 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260508000000_employee_module 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260508000001_user_preferences 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260511000000_project_created_by 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260512000000_sale_installments 2>/dev/null || true
npx prisma migrate resolve --rolled-back 20260512000001_sale_first_payment_date 2>/dev/null || true

echo "Rodando migracoes..."
npx prisma migrate deploy || {
  echo "migrate deploy falhou, tentando db push como fallback..."
  npx prisma db push --accept-data-loss
}

mkdir -p storage/media tmp/uploads

echo "Iniciando servidor..."
exec node dist/server/index.js

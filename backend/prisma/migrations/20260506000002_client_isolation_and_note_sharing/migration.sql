-- Adiciona campo createdById em ClientProfile (qual vendedor cadastrou o cliente)
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "ClientProfile" ADD CONSTRAINT IF NOT EXISTS "ClientProfile_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Adiciona campo sharedWithIds em Note (compartilhamento entre usuarios)
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "sharedWithIds" TEXT[] NOT NULL DEFAULT '{}';

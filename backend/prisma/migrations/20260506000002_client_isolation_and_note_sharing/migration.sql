-- Adiciona campo createdById em ClientProfile (qual vendedor cadastrou o cliente)
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

DO $$ BEGIN
  ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Adiciona campo sharedWithIds em Note (compartilhamento entre usuarios)
-- Note pode nao existir ainda, entao so adiciona se a tabela existir
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Note') THEN
    ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "sharedWithIds" TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

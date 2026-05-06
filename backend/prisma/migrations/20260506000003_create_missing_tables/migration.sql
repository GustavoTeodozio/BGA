-- Enums adicionais

DO $$ BEGIN CREATE TYPE "ActivityStatus" AS ENUM ('PENDENTE', 'CONCLUIDO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Note ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Note" (
    "id"            TEXT NOT NULL,
    "tenantId"      TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "content"       TEXT NOT NULL DEFAULT '',
    "color"         TEXT NOT NULL DEFAULT '#ffffff',
    "tags"          TEXT,
    "isPinned"      BOOLEAN NOT NULL DEFAULT false,
    "sharedWithIds" TEXT[] NOT NULL DEFAULT '{}',
    "createdById"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Note_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Note_tenantId_idx" ON "Note"("tenantId");
CREATE INDEX IF NOT EXISTS "Note_createdById_idx" ON "Note"("createdById");

-- ── Budget ───────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "BudgetStatus" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'FECHADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Budget" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "clientName"  TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "companyName" TEXT,
    "description" TEXT,
    "items"       TEXT,
    "totalValue"  DECIMAL(65,30),
    "status"      "BudgetStatus" NOT NULL DEFAULT 'PENDENTE',
    "notes"       TEXT,
    "createdById" TEXT NOT NULL,
    "saleId"      TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Budget_saleId_key" UNIQUE ("saleId"),
    CONSTRAINT "Budget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Budget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Budget_tenantId_status_idx" ON "Budget"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Budget_createdById_idx" ON "Budget"("createdById");

-- ── Sale ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "SaleStatus" AS ENUM ('EM_ANDAMENTO', 'FECHADA', 'PERDIDA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Sale" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "clientName"  TEXT NOT NULL,
    "companyName" TEXT,
    "value"       DECIMAL(65,30) NOT NULL,
    "status"      "SaleStatus" NOT NULL DEFAULT 'FECHADA',
    "description" TEXT,
    "budgetId"    TEXT,
    "closedById"  TEXT NOT NULL,
    "closedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Sale_budgetId_key" UNIQUE ("budgetId"),
    CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sale_tenantId_idx" ON "Sale"("tenantId");
CREATE INDEX IF NOT EXISTS "Sale_closedById_idx" ON "Sale"("closedById");

-- Agora que Sale existe, adicionar FK de Budget -> Sale
DO $$ BEGIN
  ALTER TABLE "Budget" ADD CONSTRAINT "Budget_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Project ──────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "ProjectStatus" AS ENUM ('BRIEFING', 'EM_PRODUCAO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'FINALIZADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Project" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "clientName"  TEXT,
    "description" TEXT,
    "status"      "ProjectStatus" NOT NULL DEFAULT 'BRIEFING',
    "designerId"  TEXT NOT NULL,
    "deadline"    TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Project_tenantId_status_idx" ON "Project"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Project_designerId_idx" ON "Project"("designerId");

CREATE TABLE IF NOT EXISTS "ProjectFile" (
    "id"         TEXT NOT NULL,
    "projectId"  TEXT NOT NULL,
    "fileName"   TEXT NOT NULL,
    "fileUrl"    TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize"   INTEGER,
    "mimeType"   TEXT,
    "version"    INTEGER NOT NULL DEFAULT 1,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");

-- ── CrmConfig ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CrmConfig" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "stages"    JSONB NOT NULL,
    "actTypes"  JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CrmConfig_tenantId_key" UNIQUE ("tenantId")
);

-- ── Opportunity ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Opportunity" (
    "id"             TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "clientName"     TEXT NOT NULL,
    "clientEmail"    TEXT,
    "clientPhone"    TEXT,
    "companyName"    TEXT,
    "value"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "probability"    INTEGER NOT NULL DEFAULT 50,
    "stage"          TEXT NOT NULL DEFAULT 'LEAD_NOVO',
    "source"         TEXT,
    "notes"          TEXT,
    "expectedClose"  TIMESTAMP(3),
    "closedAt"       TIMESTAMP(3),
    "lostReason"     TEXT,
    "assignedToId"   TEXT,
    "assignedToName" TEXT,
    "clientTenantId" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Opportunity_tenantId_stage_idx" ON "Opportunity"("tenantId", "stage");
CREATE INDEX IF NOT EXISTS "Opportunity_assignedToId_idx" ON "Opportunity"("assignedToId");
CREATE INDEX IF NOT EXISTS "Opportunity_clientTenantId_idx" ON "Opportunity"("clientTenantId");

-- ── Activity ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Activity" (
    "id"             TEXT NOT NULL,
    "opportunityId"  TEXT NOT NULL,
    "type"           TEXT NOT NULL DEFAULT 'OUTRO',
    "title"          TEXT NOT NULL,
    "notes"          TEXT,
    "dueDate"        TIMESTAMP(3),
    "doneAt"         TIMESTAMP(3),
    "status"         "ActivityStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdById"    TEXT,
    "createdByName"  TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Activity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Activity_opportunityId_idx" ON "Activity"("opportunityId");
CREATE INDEX IF NOT EXISTS "Activity_dueDate_idx" ON "Activity"("dueDate");

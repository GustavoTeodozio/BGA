-- Criar enums que estao faltando no banco

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDEDOR', 'PROJETISTA', 'CLIENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BudgetStatus" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'FECHADO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SaleStatus" AS ENUM ('EM_ANDAMENTO', 'FECHADA', 'PERDIDA');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('BRIEFING', 'EM_PRODUCAO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'FINALIZADO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'ARTICLE', 'LINK', 'LIVE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'XLSX', 'CSV');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('PERFORMANCE', 'MEDIA', 'TRAINING', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FbAssetType" AS ENUM ('BUSINESS_MANAGER', 'AD_ACCOUNT', 'PIXEL', 'CATALOG');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BudgetStrategy" AS ENUM ('DAILY', 'LIFETIME');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ResultSource" AS ENUM ('MANUAL', 'FACEBOOK_API', 'CRM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClientPlan" AS ENUM ('START', 'MASTER', 'PREMIUM', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

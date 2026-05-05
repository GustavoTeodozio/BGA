-- CreateTable: Stand Progress Tracker

CREATE TABLE "StandUpdate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StandUpdatePhoto" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL DEFAULT '',
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandUpdatePhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StandUpdateComment" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'cliente',
    "content" TEXT NOT NULL,
    "isApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandUpdateComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StandUpdate_tenantId_idx" ON "StandUpdate"("tenantId");
CREATE INDEX "StandUpdate_clientId_idx" ON "StandUpdate"("clientId");
CREATE INDEX "StandUpdatePhoto_updateId_idx" ON "StandUpdatePhoto"("updateId");
CREATE INDEX "StandUpdateComment_updateId_idx" ON "StandUpdateComment"("updateId");

ALTER TABLE "StandUpdate" ADD CONSTRAINT "StandUpdate_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StandUpdate" ADD CONSTRAINT "StandUpdate_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StandUpdate" ADD CONSTRAINT "StandUpdate_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StandUpdatePhoto" ADD CONSTRAINT "StandUpdatePhoto_updateId_fkey"
    FOREIGN KEY ("updateId") REFERENCES "StandUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StandUpdateComment" ADD CONSTRAINT "StandUpdateComment_updateId_fkey"
    FOREIGN KEY ("updateId") REFERENCES "StandUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

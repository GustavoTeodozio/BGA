-- AlterTable: change contractMonths from Int to String to support free-text event names
ALTER TABLE "ClientProfile" ALTER COLUMN "contractMonths" TYPE TEXT USING "contractMonths"::TEXT;

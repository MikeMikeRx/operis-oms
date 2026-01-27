-- AlterTable: Add passwordHash column
-- First add as nullable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Update existing rows with placeholder (for dev/test environments)
UPDATE "User" SET "passwordHash" = 'PLACEHOLDER_MUST_RESET' WHERE "passwordHash" IS NULL;

-- Make it required
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- AlterTable
ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN "banExpires" TIMESTAMP(3),
ADD COLUMN "banReason" TEXT,
ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- A database that already has accounts needs one administrator: the oldest
-- account gets the role.
UPDATE "user"
SET "role" = 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM "user" WHERE "role" = 'admin'
  )
  AND "id" = (
    SELECT "id" FROM "user" ORDER BY "createdAt" ASC LIMIT 1
  );

-- AlterTable
ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN "banExpires" TIMESTAMP(3),
ADD COLUMN "banReason" TEXT,
ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Marcos Magni's account is the first app administrator.
UPDATE "user"
SET "role" = 'admin'
WHERE "email" = 'javier.magni@gmail.com';

-- A database without that account still needs one administrator.
UPDATE "user"
SET "role" = 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM "user" WHERE "role" = 'admin'
  )
  AND "id" = (
    SELECT "id" FROM "user" ORDER BY "createdAt" ASC LIMIT 1
  );

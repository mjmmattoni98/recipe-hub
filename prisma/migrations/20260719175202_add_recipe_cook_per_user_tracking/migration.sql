-- CreateTable
CREATE TABLE "RecipeCook" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeCook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeCook_userId_idx" ON "RecipeCook"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCook_recipeId_userId_key" ON "RecipeCook"("recipeId", "userId");

-- AddForeignKey
ALTER TABLE "RecipeCook" ADD CONSTRAINT "RecipeCook_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCook" ADD CONSTRAINT "RecipeCook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: attribute every recipe currently marked cooked=true to
-- every existing user, since the old boolean had no per-user attribution.
INSERT INTO "RecipeCook" ("id", "recipeId", "userId", "cookedAt")
SELECT gen_random_uuid(), r."id", u."id", CURRENT_TIMESTAMP
FROM "Recipe" r
CROSS JOIN "user" u
WHERE r."cooked" = true
ON CONFLICT ("recipeId", "userId") DO NOTHING;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "cooked";

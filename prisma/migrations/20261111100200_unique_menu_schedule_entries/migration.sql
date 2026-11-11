-- DataMigration: the unique index below cannot be built while the same recipe
-- is scheduled twice for a family, date and meal. Keep the earliest entry
-- (ties broken by id) and drop the rest.
DELETE FROM "MenuSchedule" m
USING (
    SELECT "id",
        ROW_NUMBER() OVER (
            PARTITION BY "familyId", "date", "mealType", "recipeId"
            ORDER BY "createdAt" ASC, "id" ASC
        ) AS rn
    FROM "MenuSchedule"
) ranked
WHERE m."id" = ranked."id" AND ranked.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "MenuSchedule_familyId_date_mealType_recipeId_key" ON "MenuSchedule"("familyId", "date", "mealType", "recipeId");

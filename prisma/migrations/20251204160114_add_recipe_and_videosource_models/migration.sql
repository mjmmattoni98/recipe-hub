-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateEnum
CREATE TYPE "VideoPlatform" AS ENUM ('YouTube', 'Instagram', 'TikTok');

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "difficulty" "RecipeDifficulty" NOT NULL,
    "cookTime" INTEGER NOT NULL,
    "prepTime" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "ingredients" TEXT[],
    "instructions" TEXT[],
    "image" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSource" (
    "id" TEXT NOT NULL,
    "platform" "VideoPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "VideoSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoSource_recipeId_key" ON "VideoSource"("recipeId");

-- AddForeignKey
ALTER TABLE "VideoSource" ADD CONSTRAINT "VideoSource_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

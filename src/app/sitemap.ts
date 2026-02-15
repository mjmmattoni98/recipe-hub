import { siteConfig } from "@/lib/seo";
import { db } from "@/server/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipes = await db.recipe.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteConfig.siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.siteUrl}/sign-in`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const recipeRoutes: MetadataRoute.Sitemap = recipes.map((recipe) => ({
    url: `${siteConfig.siteUrl}/recipes/${recipe.id}`,
    lastModified: recipe.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...recipeRoutes];
}

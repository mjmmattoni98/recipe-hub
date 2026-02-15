import { HomePageClient } from "@/components/home/HomePageClient";
import { absoluteUrl, websiteJsonLd } from "@/lib/seo";
import { getServerSession } from "@/server/auth/session";
import { api } from "@/trpc/server";
import { type Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Discover Recipes",
  description:
    "Explore a curated recipe collection with filters for cuisine, difficulty, ingredients, and cooking status.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: "Discover Recipes | Recipe Hub",
    description:
      "Explore a curated recipe collection with filters for cuisine, difficulty, ingredients, and cooking status.",
  },
};

export default async function HomePage() {
  await connection();
  const [recipes, session] = await Promise.all([
    api.recipe.getAll(),
    getServerSession(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomePageClient
        initialRecipes={recipes}
        isLoggedIn={Boolean(session?.user)}
      />
    </>
  );
}

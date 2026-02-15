import { NewRecipeClient } from "@/components/recipes/NewRecipeClient";
import { absoluteUrl } from "@/lib/seo";
import { requireServerSession } from "@/server/auth/require-session";
import { type Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Create Recipe",
  description: "Create a new recipe in your recipe collection.",
  alternates: {
    canonical: "/new-recipe",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/new-recipe"),
    title: "Create Recipe | Recipe Hub",
    description: "Create a new recipe in your recipe collection.",
  },
};

export default async function NewRecipePage() {
  await connection();
  await requireServerSession("/new-recipe");

  return <NewRecipeClient />;
}

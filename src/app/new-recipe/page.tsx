import { NewRecipeClient } from "@/components/recipes/NewRecipeClient";
import { absoluteUrl } from "@/lib/seo";
import { requireServerSession } from "@/server/auth/require-session";
import { type Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Crear Receta",
  description: "Crea una nueva receta en tu colección.",
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
    title: "Crear Receta | Recipe Hub",
    description: "Crea una nueva receta en tu colección.",
  },
};

export default async function NewRecipePage() {
  await connection();
  await requireServerSession("/new-recipe");

  return <NewRecipeClient />;
}

import { HomePageClient } from "@/components/home/HomePageClient";
import { absoluteUrl, websiteJsonLd } from "@/lib/seo";
import { getServerSession } from "@/server/auth/session";
import { api, HydrateClient } from "@/trpc/server";
import { type Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Descubre Recetas",
  description:
    "Explora una colección de recetas seleccionadas con filtros por tipo de cocina, dificultad, ingredientes y estado de cocción.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: "Descubre Recetas | Recipe Hub",
    description:
      "Explora una colección de recetas seleccionadas con filtros por tipo de cocina, dificultad, ingredientes y estado de cocción.",
  },
};

export default async function HomePage() {
  await connection();
  const session = await getServerSession();

  void api.recipe.getFilterFacets.prefetch();

  return (
    <HydrateClient>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomePageClient isLoggedIn={Boolean(session?.user)} />
    </HydrateClient>
  );
}

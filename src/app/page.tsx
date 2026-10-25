import { HomePageClient } from "@/components/home/HomePageClient";
import { isAppAdmin, roleFromUnknown } from "@/lib/admin-role";
import {
  parseRecipeFilters,
  recipeListInput,
  searchParamsFromRecord,
} from "@/lib/recipe-filters";
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

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({
  searchParams,
}: Readonly<HomePageProps>) {
  await connection();
  const [session, params] = await Promise.all([
    getServerSession(),
    searchParams,
  ]);
  const isLoggedIn = Boolean(session?.user);

  // Awaited (not fire-and-forget) so the first page of recipes is in the
  // server-rendered HTML and the card images start loading with the page.
  // The input must match what HomePageClient derives from the same URL.
  const filters = parseRecipeFilters(
    searchParamsFromRecord(params),
    isLoggedIn,
  );
  await Promise.all([
    api.recipe.getAll.prefetchInfinite(recipeListInput(filters)),
    api.recipe.getFilterFacets.prefetch(),
  ]);

  return (
    <HydrateClient>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomePageClient
        isLoggedIn={isLoggedIn}
        isAdmin={isAppAdmin(roleFromUnknown(session?.user))}
        userName={session?.user.name || null}
      />
    </HydrateClient>
  );
}

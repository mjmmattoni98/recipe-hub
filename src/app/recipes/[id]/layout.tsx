import { notFound } from "next/navigation";
import { getRecipe } from "./get-recipe";

type RecipeLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

// The existence check lives here rather than in the page because the page
// sits inside loading.tsx: once that skeleton starts streaming, the response
// is committed to a 200. Checking above the boundary gives a real 404.
export default async function RecipeLayout({
  children,
  params,
}: Readonly<RecipeLayoutProps>) {
  const { id } = await params;

  if (!(await getRecipe(id))) {
    notFound();
  }

  return children;
}

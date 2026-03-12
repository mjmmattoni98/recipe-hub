import { getServerSession } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { MenuPageClient } from "./MenuPageClient";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Menú Semanal - Recipe Hub",
  description: "Organiza el menú de comidas para toda tu familia.",
};

export default async function MenuPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Menú Semanal</h1>
        <p className="text-muted-foreground mt-2">
          Organiza las comidas de tu familia fácilmente. Selecciona un día para planificar y el historial automático mantendrá 30 días limpios.
        </p>
      </div>
      
      <MenuPageClient />
    </main>
  );
}

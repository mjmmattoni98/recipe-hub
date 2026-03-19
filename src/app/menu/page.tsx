import { getServerSession } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { MenuPageClient } from "./MenuPageClient";
import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="bg-background min-h-screen">
      <div className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <h1 className="font-display text-foreground text-xl font-bold">
            Menú Semanal
          </h1>
        </div>
      </div>

      <main className="container mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-muted-foreground mt-2">
            Organiza las comidas de tu familia fácilmente. Selecciona un día para planificar y el historial automático mantendrá 30 días limpios.
          </p>
        </div>
        
        <MenuPageClient />
      </main>
    </div>
  );
}

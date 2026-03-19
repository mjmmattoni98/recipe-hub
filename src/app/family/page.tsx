import { getServerSession } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { FamilyPageClient } from "./FamilyPageClient";
import { type Metadata } from "next";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Gestión de Familia - Recipe Hub",
  description: "Administra los miembros de tu familia",
};

export default async function FamilyPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <BackButton className="bg-background/80 hover:bg-background" />
          <h1 className="font-display text-foreground text-xl font-bold">
            Gestión de Familia
          </h1>
        </div>
      </div>

      <main className="container mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-muted-foreground mt-2">
            Administra las configuraciones y los miembros de tus grupos familiares.
          </p>
        </div>
        
        <FamilyPageClient currentUserId={session.user.id} />
      </main>
    </div>
  );
}

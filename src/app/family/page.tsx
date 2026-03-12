import { getServerSession } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { FamilyPageClient } from "./FamilyPageClient";
import { type Metadata } from "next";

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
    <main className="container mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Familia</h1>
        <p className="text-muted-foreground mt-2">
          Administra las configuraciones y los miembros de tus grupos familiares.
        </p>
      </div>
      
      <FamilyPageClient currentUserId={session.user.id} />
    </main>
  );
}

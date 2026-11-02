import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireServerSession } from "@/server/auth/require-session";
import { type Metadata } from "next";
import { MenuPageClient } from "./MenuPageClient";

export const metadata: Metadata = {
  title: "Menú semanal",
  description: "Organiza el menú de comidas para toda tu familia.",
  robots: { index: false, follow: false },
};

export default async function MenuPage() {
  await requireServerSession("/menu");

  return (
    <AppShell>
      <main id="main-content">
        <PageHeader
          eyebrow="Planificación"
          title={
            <>
              Menú de la <em className="text-primary">semana</em>
            </>
          }
          description="Elige un día y apunta qué se come. Lo planificado se borra solo pasados 30 días."
        />
        <MenuPageClient />
      </main>
    </AppShell>
  );
}

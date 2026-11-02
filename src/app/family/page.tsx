import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireServerSession } from "@/server/auth/require-session";
import { type Metadata } from "next";
import { FamilyPageClient } from "./FamilyPageClient";

export const metadata: Metadata = {
  title: "Familia",
  description: "Administra los miembros de tu familia",
  robots: { index: false, follow: false },
};

export default async function FamilyPage() {
  const session = await requireServerSession("/family");

  return (
    <AppShell>
      <main id="main-content">
        <PageHeader
          eyebrow="Tu gente"
          title="Familia"
          description="Las familias comparten el menú semanal. Crea una y añade a quien cocine contigo."
        />
        <FamilyPageClient currentUserId={session.user.id} />
      </main>
    </AppShell>
  );
}

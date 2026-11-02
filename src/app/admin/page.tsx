import { AdminUsers } from "@/components/admin/AdminUsers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { isAppAdmin, roleFromUnknown } from "@/lib/admin-role";
import { absoluteUrl } from "@/lib/seo";
import { requireServerSession } from "@/server/auth/require-session";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cuentas",
  description: "Crea y administra las cuentas de Recipe Hub.",
  alternates: {
    canonical: "/admin",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/admin"),
    title: "Cuentas | Recipe Hub",
    description: "Crea y administra las cuentas de Recipe Hub.",
  },
};

export default async function AdminPage() {
  const session = await requireServerSession("/admin");

  if (!isAppAdmin(roleFromUnknown(session.user))) {
    redirect("/");
  }

  return (
    <AppShell>
      <main id="main-content">
        <PageHeader
          eyebrow="Administración"
          title="Cuentas"
          description="Crea cuentas, cambia el nombre o la contraseña y elige quién puede administrar Recipe Hub. El registro público sigue cerrado."
        />
        <div className="page">
          <AdminUsers currentUserId={session.user.id} />
        </div>
      </main>
    </AppShell>
  );
}

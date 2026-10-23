import { AdminUsers } from "@/components/admin/AdminUsers";
import { BackButton } from "@/components/BackButton";
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
    <div className="bg-background min-h-screen">
      <div className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <BackButton className="bg-background/80 hover:bg-background" />
          <h1 className="font-display text-foreground text-xl font-bold">
            Cuentas
          </h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 sm:px-6">
        <AdminUsers currentUserId={session.user.id} />
      </main>
    </div>
  );
}

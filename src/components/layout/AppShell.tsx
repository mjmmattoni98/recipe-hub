import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SiteHeader, type ShellUser } from "@/components/layout/SiteHeader";
import { isAppAdmin, roleFromUnknown } from "@/lib/admin-role";
import { cn } from "@/lib/utils";
import { getServerSession } from "@/server/auth/session";
import type { ReactNode } from "react";

// Every signed-in screen (and the public recipe pages) share this frame: the
// header on top, a tab bar on phones, and a quiet footer. The session lookup
// is cached per request, so pages that also read it don't pay twice.
export async function AppShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession();
  const user: ShellUser | null = session?.user
    ? {
        name: session.user.name || session.user.email,
        isAdmin: isAppAdmin(roleFromUnknown(session.user)),
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader user={user} />
      <div className="flex-1">{children}</div>
      <footer
        className={cn(
          "text-muted-foreground mt-20 border-t",
          user ? "pb-24 md:pb-0" : null,
        )}
      >
        <div className="page flex flex-col gap-1 py-8 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-display text-foreground text-lg">
            Recipe <span className="text-primary italic">Hub</span>
          </p>
          <p className="eyebrow">Cocinado en casa</p>
        </div>
      </footer>
      {user ? <MobileTabBar /> : null}
    </div>
  );
}

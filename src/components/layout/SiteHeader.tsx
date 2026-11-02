"use client";

import { AccountMenu } from "@/components/layout/AccountMenu";
import {
  isNavItemActive,
  NEW_RECIPE_NAV,
  PRIMARY_NAV,
} from "@/components/layout/nav-items";
import { Wordmark } from "@/components/layout/Wordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ShellUser = {
  name: string;
  isAdmin: boolean;
};

export function SiteHeader({ user }: Readonly<{ user: ShellUser | null }>) {
  const pathname = usePathname();

  return (
    <header className="bg-background/85 supports-backdrop-filter:bg-background/70 sticky top-0 z-40 border-b backdrop-blur-lg">
      <div className="page flex h-14 items-center gap-8 md:h-16">
        <Wordmark />

        {user ? (
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {PRIMARY_NAV.map((item) => {
                const active = isNavItemActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground relative rounded-md px-3 py-2 text-sm font-medium transition-colors aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-[13px] aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-current md:aria-[current=page]:after:-bottom-[17px]"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link href={NEW_RECIPE_NAV.href}>
                  <NEW_RECIPE_NAV.icon aria-hidden="true" />
                  {NEW_RECIPE_NAV.label}
                </Link>
              </Button>
              <AccountMenu name={user.name} isAdmin={user.isAdmin} />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">Entrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

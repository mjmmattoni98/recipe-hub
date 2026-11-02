"use client";

import {
  FAMILY_NAV,
  isNavItemActive,
  MENU_NAV,
  NEW_RECIPE_NAV,
  RECIPES_NAV,
  type NavItem,
} from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: NavItem[] = [
  RECIPES_NAV,
  MENU_NAV,
  { ...NEW_RECIPE_NAV, label: "Nueva" },
  FAMILY_NAV,
];

// Phones get the main sections under the thumb instead of in the header
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="bg-background/90 supports-backdrop-filter:bg-background/75 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {TABS.map((item) => {
          const active = isNavItemActive(item, pathname);
          const isCreate = item.href === NEW_RECIPE_NAV.href;

          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground aria-[current=page]:text-foreground flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    isCreate
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-accent text-accent-foreground"
                        : null,
                  )}
                >
                  <item.icon className="size-[18px]" aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

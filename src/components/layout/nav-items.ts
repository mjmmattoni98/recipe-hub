import {
  BookOpen,
  CalendarDays,
  Plus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const RECIPES_NAV: NavItem = {
  href: "/",
  label: "Recetas",
  icon: BookOpen,
};
export const MENU_NAV: NavItem = {
  href: "/menu",
  label: "Menú",
  icon: CalendarDays,
};
export const FAMILY_NAV: NavItem = {
  href: "/family",
  label: "Familia",
  icon: UsersRound,
};
export const NEW_RECIPE_NAV: NavItem = {
  href: "/new-recipe",
  label: "Nueva receta",
  icon: Plus,
};

export const PRIMARY_NAV = [RECIPES_NAV, MENU_NAV, FAMILY_NAV];

// A recipe page (or its editor) still belongs to the "Recetas" section
export function isNavItemActive(item: NavItem, pathname: string) {
  if (item.href === "/") {
    return pathname === "/" || pathname.startsWith("/recipes/");
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

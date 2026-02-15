import { env } from "@/env";

const FALLBACK_SITE_URL = "http://localhost:3000";

const normalizedSiteUrl = (env.BETTER_AUTH_URL ?? FALLBACK_SITE_URL).replace(
  /\/+$/,
  "",
);

export const siteConfig = {
  name: "Recipe Hub",
  shortName: "RecipeHub",
  description:
    "Discover, organize, and cook recipes with filters for cuisine, difficulty, and ingredients.",
  siteUrl: normalizedSiteUrl,
  defaultImagePath: "/favicon.ico",
};

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.siteUrl}${normalizedPath}`;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
  };
}

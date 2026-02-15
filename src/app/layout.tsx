import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { absoluteUrl, siteConfig } from "@/lib/seo";
import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { type Metadata, type Viewport } from "next";
import { DM_Sans, Fraunces, Geist } from "next/font/google";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | Discover Recipes`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl(siteConfig.defaultImagePath),
        width: 64,
        height: 64,
        alt: `${siteConfig.name} icon`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fef7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1a17" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <a
              href="#main-content"
              className="focus:bg-background focus:text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:px-3 focus:py-2 focus:ring-2 focus:outline-none"
            >
              Skip to content
            </a>
            <SpeedInsights />
            {children}
            <Analytics />
            <Toaster />
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

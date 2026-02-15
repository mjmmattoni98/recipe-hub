import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { type Metadata } from "next";
import { DM_Sans, Fraunces, Geist } from "next/font/google";

export const metadata: Metadata = {
  title: "RecipeHub",
  description: "Discover delicious recipes from around the world",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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

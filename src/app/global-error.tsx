"use client";

import "@/styles/globals.css";
import { Button } from "@/components/ui/button";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { useEffect } from "react";

// This page replaces the root layout, so it sets up its own fonts and theme.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

function savedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

export default function GlobalError({
  error,
  retry,
}: Readonly<{ error: unknown; retry: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // There is no ThemeProvider here: apply the visitor's saved choice (the key
  // next-themes uses), or the system preference.
  useEffect(() => {
    const theme = savedTheme();
    const dark =
      theme === "dark" ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const digest =
    error instanceof Error
      ? (error as Error & { digest?: string }).digest
      : undefined;

  return (
    <html
      lang="es"
      className={`${instrumentSerif.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <title>Error inesperado | Recipe Hub</title>
      </head>
      <body>
        <main className="page flex min-h-dvh flex-col py-6 sm:py-10">
          {/* Plain links on purpose: a full page load is the reliable way out
              when the root layout has crashed. */}
          {/* oxlint-disable-next-line next/no-html-link-for-pages */}
          <a
            href="/"
            className="font-display text-foreground shrink-0 text-[1.6rem] leading-none tracking-tight"
          >
            Recipe <span className="text-primary italic">Hub</span>
          </a>
          <div className="flex flex-1 flex-col justify-center py-16">
            <p className="eyebrow text-muted-foreground">Error inesperado</p>
            <h1 className="font-display mt-4 max-w-3xl text-6xl leading-[0.92] tracking-tight text-balance md:text-8xl">
              Algo se ha quemado en la <em className="text-primary">cocina</em>.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-lg text-lg text-pretty">
              No hemos podido cargar la aplicación. Prueba de nuevo y, si el
              problema sigue, vuelve a las recetas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => retry()}>
                Intentar de nuevo
              </Button>
              <Button asChild size="lg" variant="outline">
                {/* oxlint-disable-next-line next/no-html-link-for-pages */}
                <a href="/">Volver a las recetas</a>
              </Button>
            </div>
            {digest ? (
              <p className="eyebrow text-muted-foreground mt-10">
                Código: {digest}
              </p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}

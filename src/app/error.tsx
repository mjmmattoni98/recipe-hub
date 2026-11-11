"use client";

import { Wordmark } from "@/components/layout/Wordmark";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: Readonly<{ error: unknown; retry: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Server errors arrive with a generic message and a digest that matches the
  // server log, so that is the only thing worth showing.
  const digest =
    error instanceof Error
      ? (error as Error & { digest?: string }).digest
      : undefined;

  return (
    <main
      id="main-content"
      className="page flex min-h-dvh flex-col py-6 sm:py-10"
    >
      <Wordmark />
      <div className="flex flex-1 flex-col justify-center py-16">
        <p className="eyebrow text-muted-foreground">Error inesperado</p>
        <h1 className="font-display mt-4 max-w-3xl text-6xl leading-[0.92] tracking-tight text-balance md:text-8xl">
          Algo se ha quemado en la <em className="text-primary">cocina</em>.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-lg text-lg text-pretty">
          No hemos podido cargar esta página. Prueba de nuevo y, si el problema
          sigue, vuelve a las recetas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => retry()}>
            Intentar de nuevo
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Volver a las recetas</Link>
          </Button>
        </div>
        {digest ? (
          <p className="eyebrow text-muted-foreground mt-10">
            Código: {digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}

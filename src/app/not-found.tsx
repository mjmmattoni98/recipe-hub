import { Wordmark } from "@/components/layout/Wordmark";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="page flex min-h-dvh flex-col py-6 sm:py-10"
    >
      <Wordmark />
      <div className="flex flex-1 flex-col justify-center py-16">
        <p className="eyebrow text-muted-foreground">Error 404</p>
        <h1 className="font-display mt-4 max-w-3xl text-6xl leading-[0.92] tracking-tight text-balance md:text-8xl">
          Esta receta no está en el <em className="text-primary">recetario</em>.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-lg text-lg text-pretty">
          Puede que la hayan borrado o que el enlace esté mal copiado.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/">Volver a las recetas</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

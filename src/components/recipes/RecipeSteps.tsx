"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";

// Tapping a step marks it done, so a glance at the counter shows where you
// left off.
export function RecipeSteps({
  instructions,
}: Readonly<{ instructions: string[] }>) {
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());

  const toggle = (index: number) => {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section aria-labelledby="steps-heading">
      <div className="flex items-baseline justify-between gap-4 border-b pb-4">
        <h2
          id="steps-heading"
          className="font-display text-foreground text-4xl tracking-tight md:text-5xl"
        >
          Preparación
        </h2>
        <p className="eyebrow text-muted-foreground">
          {done.size > 0
            ? `${done.size} de ${instructions.length} hechos`
            : `${instructions.length} ${instructions.length === 1 ? "paso" : "pasos"}`}
        </p>
      </div>

      <ol>
        {instructions.map((instruction, index) => {
          const isDone = done.has(index);

          return (
            <li key={index} className="border-b">
              <button
                type="button"
                aria-pressed={isDone}
                onClick={() => toggle(index)}
                className="group focus-visible:ring-ring/50 grid w-full cursor-pointer grid-cols-[2.75rem_1fr] gap-4 rounded-sm py-6 text-left outline-none focus-visible:ring-[3px] md:grid-cols-[4rem_1fr] md:py-7"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "font-display text-4xl leading-none tabular-nums transition-colors md:text-5xl",
                    isDone ? "text-muted-foreground/50" : "text-primary",
                  )}
                >
                  {isDone ? (
                    <span className="bg-highlight text-highlight-foreground flex size-9 items-center justify-center rounded-full md:size-11">
                      <Check className="size-5" strokeWidth={2.5} />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-foreground pt-1 text-lg leading-relaxed text-pretty transition-opacity md:text-xl md:leading-relaxed",
                    isDone && "opacity-45",
                  )}
                >
                  <span className="sr-only">Paso {index + 1}: </span>
                  {instruction}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground mt-4 text-sm">
        Toca un paso para marcarlo como hecho.
      </p>
    </section>
  );
}

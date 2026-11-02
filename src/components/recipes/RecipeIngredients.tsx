"use client";

import { scaleIngredient } from "@/lib/scale-ingredient";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";

const MAX_SERVINGS = 99;

type RecipeIngredientsProps = {
  ingredients: string[];
  servings: number;
};

const servingsLabel = (count: number) =>
  `${count} ${count === 1 ? "ración" : "raciones"}`;

export function RecipeIngredients({
  ingredients,
  servings,
}: Readonly<RecipeIngredientsProps>) {
  const baseServings = Math.max(servings, 1);
  const [targetServings, setTargetServings] = useState(baseServings);
  // Ticking off ingredients while cooking; indexes because lines can repeat
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());

  const factor = targetServings / baseServings;

  const toggleChecked = (index: number) => {
    setChecked((current) => {
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
    <section
      aria-labelledby="ingredients-heading"
      className="bg-card rounded-lg border p-6 md:p-7"
    >
      <h2
        id="ingredients-heading"
        className="font-display text-foreground text-4xl tracking-tight"
      >
        Ingredientes
      </h2>

      <div className="mt-5 flex items-center justify-between gap-3 border-y py-3">
        <span className="eyebrow text-muted-foreground">Raciones</span>
        <div
          role="group"
          aria-label="Raciones"
          className="flex items-center gap-1"
        >
          <button
            type="button"
            className="hover:bg-secondary flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Menos raciones"
            disabled={targetServings <= 1}
            onClick={() => setTargetServings((count) => count - 1)}
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span
            className="min-w-24 text-center font-mono text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {servingsLabel(targetServings)}
          </span>
          <button
            type="button"
            className="hover:bg-secondary flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Más raciones"
            disabled={targetServings >= MAX_SERVINGS}
            onClick={() => setTargetServings((count) => count + 1)}
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {factor === 1 ? null : (
        <p className="text-muted-foreground mt-3 text-xs">
          Cantidades ajustadas desde {servingsLabel(baseServings)}.{" "}
          <button
            type="button"
            onClick={() => setTargetServings(baseServings)}
            className="text-foreground cursor-pointer underline underline-offset-2"
          >
            Restablecer
          </button>
        </p>
      )}

      <ul className="mt-2">
        {ingredients.map((ingredient, index) => {
          const isChecked = checked.has(index);

          return (
            <li
              key={`ingredient-${index}`}
              className="border-b border-dashed last:border-b-0"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggleChecked(index)}
                className="group focus-visible:ring-ring/50 flex w-full cursor-pointer items-start gap-3 rounded-sm py-3 text-left outline-none focus-visible:ring-[3px]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                    isChecked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input group-hover:border-foreground/50",
                  )}
                >
                  {isChecked ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "leading-snug first-letter:uppercase",
                    isChecked && "text-muted-foreground line-through",
                  )}
                >
                  {scaleIngredient(ingredient, factor)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

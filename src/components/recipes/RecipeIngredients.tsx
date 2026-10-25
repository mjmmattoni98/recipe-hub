"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { scaleIngredient } from "@/lib/scale-ingredient";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
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
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-foreground text-2xl font-semibold">
          Ingredientes
        </h2>
        <div
          role="group"
          aria-label="Raciones"
          className="border-border flex items-center gap-1 rounded-full border p-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer rounded-full"
            aria-label="Menos raciones"
            disabled={targetServings <= 1}
            onClick={() => setTargetServings((count) => count - 1)}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span
            className="font-body min-w-24 text-center text-sm font-semibold"
            aria-live="polite"
          >
            {servingsLabel(targetServings)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer rounded-full"
            aria-label="Más raciones"
            disabled={targetServings >= MAX_SERVINGS}
            onClick={() => setTargetServings((count) => count + 1)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {factor === 1 ? null : (
        <p className="text-muted-foreground font-body mb-3 text-xs">
          Cantidades ajustadas desde {servingsLabel(baseServings)}.{" "}
          <button
            type="button"
            onClick={() => setTargetServings(baseServings)}
            className="text-primary cursor-pointer underline underline-offset-2"
          >
            Restablecer
          </button>
        </p>
      )}

      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => {
          const id = `ingredient-${index}`;
          const isChecked = checked.has(index);

          return (
            <li key={id}>
              <label
                htmlFor={id}
                className="font-body text-foreground hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              >
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={() => toggleChecked(index)}
                  className="h-5 w-5 rounded-full"
                />
                <span
                  className={cn(
                    "first-letter:uppercase",
                    isChecked && "text-muted-foreground line-through",
                  )}
                >
                  {scaleIngredient(ingredient, factor)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

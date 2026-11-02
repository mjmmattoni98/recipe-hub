import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { renderFieldErrors, type RecipeFormApi } from "./form-utils";
import { ListAddButton } from "./ListAddButton";

export function IngredientsField({ form }: Readonly<{ form: RecipeFormApi }>) {
  return (
    <form.Field name="ingredients" mode="array">
      {(field) => (
        <div className="space-y-2">
          <ol className="space-y-2">
            {field.state.value.map((_, index) => (
              <li key={index} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="text-muted-foreground w-6 shrink-0 text-right font-mono text-xs tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <form.Field name={`ingredients[${index}]`}>
                  {(subField) => (
                    <Input
                      value={subField.state.value}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="200 g de harina"
                      aria-label={`Ingrediente ${index + 1}`}
                    />
                  )}
                </form.Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => field.removeValue(index)}
                  disabled={field.state.value.length === 1}
                  aria-label={`Eliminar ingrediente ${index + 1}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
          <div className="pr-12 pl-8">
            <ListAddButton
              label="Añadir ingrediente"
              onClick={() => field.pushValue("")}
            />
          </div>
          {renderFieldErrors(field.state.meta.errors)}
        </div>
      )}
    </form.Field>
  );
}

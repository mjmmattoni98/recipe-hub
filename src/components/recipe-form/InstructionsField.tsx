import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { renderFieldErrors, type RecipeFormApi } from "./form-utils";
import { ListAddButton } from "./ListAddButton";

export function InstructionsField({ form }: Readonly<{ form: RecipeFormApi }>) {
  return (
    <form.Field name="instructions" mode="array">
      {(field) => (
        <div className="space-y-3">
          <ol className="space-y-3">
            {field.state.value.map((_, index) => (
              <li key={index} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="text-muted-foreground w-6 shrink-0 pt-3 text-right font-mono text-xs tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <form.Field name={`instructions[${index}]`}>
                  {(subField) => (
                    <Textarea
                      value={subField.state.value}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="Describe este paso…"
                      aria-label={`Paso ${index + 1}`}
                      className="min-h-20"
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
                  aria-label={`Eliminar paso ${index + 1}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
          <div className="pr-12 pl-8">
            <ListAddButton
              label="Añadir paso"
              onClick={() => field.pushValue("")}
            />
          </div>
          {renderFieldErrors(field.state.meta.errors)}
        </div>
      )}
    </form.Field>
  );
}

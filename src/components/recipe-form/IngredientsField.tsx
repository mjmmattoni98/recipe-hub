import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { renderFieldErrors, type RecipeFormApi } from "./form-utils";

export function IngredientsField({ form }: Readonly<{ form: RecipeFormApi }>) {
  return (
    <form.Field name="ingredients" mode="array">
      {(field) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Ingredientes</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.pushValue("")}
            >
              <Plus className="mr-2 h-4 w-4" /> Añadir Ingrediente
            </Button>
          </div>
          {field.state.value.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <form.Field name={`ingredients[${index}]`}>
                {(subField) => (
                  <Input
                    value={subField.state.value}
                    onBlur={subField.handleBlur}
                    onChange={(e) => subField.handleChange(e.target.value)}
                    placeholder={`Ingrediente ${index + 1}`}
                  />
                )}
              </form.Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => field.removeValue(index)}
                disabled={field.state.value.length === 1}
                aria-label={`Eliminar ingrediente ${index + 1}`}
              >
                <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
              </Button>
            </div>
          ))}
          {renderFieldErrors(field.state.meta.errors)}
        </div>
      )}
    </form.Field>
  );
}

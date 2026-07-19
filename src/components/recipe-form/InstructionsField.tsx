import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { renderFieldErrors, type RecipeFormApi } from "./form-utils";

export function InstructionsField({ form }: Readonly<{ form: RecipeFormApi }>) {
  return (
    <form.Field name="instructions" mode="array">
      {(field) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Instrucciones</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.pushValue("")}
            >
              <Plus className="mr-2 h-4 w-4" /> Añadir Paso
            </Button>
          </div>
          {field.state.value.map((_, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground mt-2 w-6 text-sm font-medium">
                {index + 1}.
              </span>
              <form.Field name={`instructions[${index}]`}>
                {(subField) => (
                  <Textarea
                    value={subField.state.value}
                    onBlur={subField.handleBlur}
                    onChange={(e) => subField.handleChange(e.target.value)}
                    placeholder={`Paso ${index + 1}`}
                    className="min-h-20"
                  />
                )}
              </form.Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => field.removeValue(index)}
                disabled={field.state.value.length === 1}
                aria-label={`Eliminar paso ${index + 1}`}
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

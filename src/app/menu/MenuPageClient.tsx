"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { addDays, format, startOfWeek, subDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "BREAKFAST", label: "Desayuno" },
  { id: "LUNCH", label: "Almuerzo" },
  { id: "DINNER", label: "Cena" },
  { id: "SNACK", label: "Snack" },
];

export function MenuPageClient() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const utils = api.useUtils();
  const { data: families, isLoading: loadingFamilies } = api.family.getMyFamilies.useQuery();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

  // Need to safely select the first family if available
  const activeFamilyId = selectedFamilyId || families?.[0]?.id;

  const weekEnd = addDays(currentWeekStart, 6);

  const { data: mSchedules, isLoading: loadingMenu } = api.menu.getWeeklyMenu.useQuery(
    {
      familyId: activeFamilyId!,
      startDate: currentWeekStart,
      endDate: weekEnd, // We'll load 7 days at a time
    },
    { enabled: !!activeFamilyId }
  );

  const { data: recipes } = api.recipe.getAll.useQuery();

  const scheduleRecipe = api.menu.scheduleRecipe.useMutation({
    onSuccess: () => {
      toast.success("Receta añadida al menú");
      utils.menu.getWeeklyMenu.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeSchedule = api.menu.removeScheduledRecipe.useMutation({
    onSuccess: () => {
      toast.success("Receta eliminada del menú");
      utils.menu.getWeeklyMenu.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Generate 7 days for the view
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  if (loadingFamilies) {
    return <div>Cargando menú...</div>;
  }

  if (!families || families.length === 0) {
    return (
      <div className="text-center p-12 border rounded-xl bg-muted/30 text-muted-foreground">
        Aún no perteneces a ninguna familia. Crea una primero para empezar a planificar.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {families.length > 1 && (
        <div className="flex items-center gap-4">
          <span className="font-medium text-sm">Seleccionar familia:</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-xs"
            value={activeFamilyId}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
          >
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-2">
        <Button
          variant="ghost"
          onClick={() => setCurrentWeekStart((prev) => subDays(prev, 7))}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <span className="font-semibold px-4 capitalize">
          {format(currentWeekStart, "dd MMM", { locale: es })} -{" "}
          {format(weekEnd, "dd MMM", { locale: es })}
        </span>
        <Button
          variant="ghost"
          onClick={() => setCurrentWeekStart((prev) => addDays(prev, 7))}
        >
          Siguiente <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Calendar / Week Grid */}
        <div className="space-y-4">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const daySchedules = mSchedules?.filter((s) => isSameDay(new Date(s.date), day)) || [];

            return (
              <Card 
                key={day.toISOString()} 
                className={`cursor-pointer transition-colors hover:border-primary/50 ${isSelected ? 'border-primary ring-1 ring-primary' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <CardHeader className="py-4">
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span className="capitalize">{format(day, "EEEE, dd 'de' MMMM", { locale: es })}</span>
                    {daySchedules.length > 0 && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        {daySchedules.length} comidas
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                {daySchedules.length > 0 && (
                  <CardContent className="pb-4 pt-0">
                    <div className="flex flex-col gap-2">
                      {MEAL_TYPES.map((meal) => {
                        const mealSchedules = daySchedules.filter((s) => s.mealType === meal.id);
                        if (mealSchedules.length === 0) return null;

                        return (
                          <div key={meal.id} className="text-sm">
                            <span className="font-medium text-muted-foreground uppercase text-xs w-20 inline-block">
                              {meal.label}
                            </span>
                            <div className="flex flex-col gap-1 mt-1">
                              {mealSchedules.map((s) => (
                                <div key={s.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                  <div className="flex-1 truncate">
                                    {s.recipe.title}
                                  </div>
                                  <span className="text-xs opacity-50 px-2 border-r">{s.recipe.difficulty}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSchedule.mutate({ id: s.id });
                                    }}
                                    className="text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors"
                                    disabled={removeSchedule.isPending}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          {loadingMenu && (
            <div className="py-8 text-center text-muted-foreground animate-pulse">
              Cargando el menú de esta semana...
            </div>
          )}
        </div>

        {/* Edit Panel for Selected Date */}
        <div className="sticky top-24 h-fit hidden lg:block">
          <Card>
            <CardHeader className="bg-primary/5 border-b rounded-t-xl pb-4">
              <CardTitle className="text-lg">
                <span className="text-muted-foreground text-sm font-normal block mb-1">Añadir comida para</span>
                <span className="capitalize">{format(selectedDate, "EEEE, dd MMM", { locale: es })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                {MEAL_TYPES.map((meal) => (
                  <div key={meal.id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                    <p className="font-medium text-sm">{meal.label}</p>
                    <div className="flex gap-2">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ellipsis overflow-hidden"
                        id={`recipe-select-${meal.id}`}
                        defaultValue=""
                      >
                        <option value="" disabled>Elegir receta...</option>
                        {recipes?.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="icon"
                        variant="secondary"
                        disabled={scheduleRecipe.isPending}
                        onClick={() => {
                          const select = document.getElementById(`recipe-select-${meal.id}`) as HTMLSelectElement;
                          if (!select.value || !activeFamilyId) return;
                          
                          scheduleRecipe.mutate({
                            familyId: activeFamilyId,
                            date: selectedDate,
                            mealType: meal.id,
                            recipeId: select.value,
                          });
                          select.value = "";
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

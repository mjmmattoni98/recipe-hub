"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { addDays, format, isSameDay, startOfWeek, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "BREAKFAST", label: "Desayuno" },
  { id: "LUNCH", label: "Almuerzo" },
  { id: "DINNER", label: "Cena" },
  { id: "SNACK", label: "Snack" },
];

function RecipeCombobox({
  recipes,
  disabled,
  onAdd,
}: Readonly<{
  recipes: any[];
  disabled: boolean;
  onAdd: (recipeId: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const selectedRecipe = recipes?.find((r) => r.id === value);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-2 px-3 hover:bg-muted font-normal cursor-pointer"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedRecipe ? (
                <>
                  <div className="relative h-6 w-6 rounded-md overflow-hidden shrink-0 border border-border/50">
                    <Image
                      src={selectedRecipe.image}
                      alt={selectedRecipe.title}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="truncate">{selectedRecipe.title}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Elegir receta...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar receta..." />
            <CommandList>
              <CommandEmpty>No se encontraron recetas.</CommandEmpty>
              <CommandGroup>
                {recipes?.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.id}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    keywords={[r.title]}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === r.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="relative h-8 w-8 rounded-md overflow-hidden shrink-0 mr-3 border border-border/50">
                      <Image
                        src={r.image}
                        alt={r.title}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <span className="truncate pr-2">{r.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        size="icon"
        variant="secondary"
        className="shrink-0 h-[42px] w-[42px] cursor-pointer"
        disabled={disabled || !value}
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function MenuPageClient() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const utils = api.useUtils();
  const { data: families, isLoading: loadingFamilies } =
    api.family.getMyFamilies.useQuery();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

  // Need to safely select the first family if available
  const activeFamilyId = selectedFamilyId || families?.[0]?.id;

  const weekEnd = addDays(currentWeekStart, 6);

  const { data: mSchedules, isLoading: loadingMenu } =
    api.menu.getWeeklyMenu.useQuery(
      {
        familyId: activeFamilyId!,
        startDate: currentWeekStart,
        endDate: weekEnd, // We'll load 7 days at a time
      },
      { enabled: !!activeFamilyId },
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
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i),
  );

  if (loadingFamilies) {
    return <div>Cargando menú...</div>;
  }

  if (!families || families.length === 0) {
    return (
      <div className="text-center p-12 border rounded-xl bg-muted/30 text-muted-foreground">
        Aún no perteneces a ninguna familia. Crea una primero para empezar a
        planificar.
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
            const daySchedules =
              mSchedules?.filter((s) => isSameDay(new Date(s.date), day)) || [];

            return (
              <Card
                key={day.toISOString()}
                className={`cursor-pointer transition-colors hover:border-primary/50 ${isSelected ? "border-primary ring-1 ring-primary" : ""} ${isToday ? "bg-primary/5" : ""}`}
                onClick={() => setSelectedDate(day)}
              >
                <CardHeader className="py-4">
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span className="capitalize">
                      {format(day, "EEEE, dd 'de' MMMM", { locale: es })}
                    </span>
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
                        const mealSchedules = daySchedules.filter(
                          (s) => s.mealType === meal.id,
                        );
                        if (mealSchedules.length === 0) return null;

                        return (
                          <div key={meal.id} className="text-sm">
                            <span className="font-medium text-muted-foreground uppercase text-xs w-20 inline-block">
                              {meal.label}
                            </span>
                            <div className="flex flex-col gap-1 mt-1">
                              {mealSchedules.map((s) => (
                                <Link
                                  href={`/recipes/${s.recipeId}`}
                                  key={s.id}
                                  className="block group"
                                >
                                  <div className="flex items-center gap-3 bg-muted hover:bg-muted/80 p-2 rounded-lg border transition-colors cursor-pointer">
                                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border/50 shrink-0">
                                      <Image
                                        src={s.recipe.image}
                                        alt={s.recipe.title}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate pr-2 text-foreground">
                                        {s.recipe.title}
                                      </p>
                                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                        <span>{s.recipe.difficulty}</span>
                                        <span>•</span>
                                        <span>
                                          {(s.recipe as any).prepTime +
                                            (s.recipe as any).cookTime}{" "}
                                          min
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeSchedule.mutate({ id: s.id });
                                      }}
                                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0"
                                      disabled={removeSchedule.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </Link>
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
                <span className="text-muted-foreground text-sm font-normal block mb-1">
                  Añadir comida para
                </span>
                <span className="capitalize">
                  {format(selectedDate, "EEEE, dd MMM", { locale: es })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                {MEAL_TYPES.map((meal) => (
                  <div
                    key={meal.id}
                    className="space-y-2 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-sm">{meal.label}</p>
                    <RecipeCombobox
                      recipes={recipes || []}
                      disabled={scheduleRecipe.isPending || !activeFamilyId}
                      onAdd={(recipeId) => {
                        if (!activeFamilyId) return;

                        // Set hours to 12 PM to avoid timezone offsets causing the date to shift to the previous day in UTC
                        const safeDate = new Date(selectedDate);
                        safeDate.setHours(12, 0, 0, 0);

                        scheduleRecipe.mutate({
                          familyId: activeFamilyId,
                          date: safeDate,
                          mealType: meal.id,
                          recipeId: recipeId,
                        });
                      }}
                    />
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

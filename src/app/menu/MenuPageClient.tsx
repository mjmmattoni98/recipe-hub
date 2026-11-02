"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { DIFFICULTY_LABELS } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import {
  addDays,
  format,
  isSameDay,
  isWithinInterval,
  startOfWeek,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
type RecipeOption = RouterOutputs["recipe"]["getOptions"][number];
type Schedule = RouterOutputs["menu"]["getWeeklyMenu"][number];

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "BREAKFAST", label: "Desayuno" },
  { id: "LUNCH", label: "Almuerzo" },
  { id: "DINNER", label: "Cena" },
  { id: "SNACK", label: "Snack" },
];

const weekStartOf = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

// Picking a recipe adds it straight away: one tap instead of pick-then-confirm
function AddRecipePicker({
  recipes,
  disabled,
  mealLabel,
  onAdd,
}: Readonly<{
  recipes: RecipeOption[];
  disabled: boolean;
  mealLabel: string;
  onAdd: (recipeId: string) => void;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Añadir receta a ${mealLabel.toLowerCase()}`}
          className="border-input text-muted-foreground hover:text-foreground hover:border-foreground/40 focus-visible:ring-ring/50 flex h-11 w-full cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir receta
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar receta…" />
          <CommandList>
            <CommandEmpty>No hay recetas con ese nombre.</CommandEmpty>
            <CommandGroup>
              {recipes.map((recipe) => (
                <CommandItem
                  key={recipe.id}
                  value={recipe.id}
                  keywords={[recipe.title]}
                  onSelect={() => {
                    onAdd(recipe.id);
                    setOpen(false);
                  }}
                  className="gap-3"
                >
                  <span className="bg-muted relative size-9 shrink-0 overflow-hidden rounded-sm">
                    <Image
                      src={recipe.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </span>
                  <span className="truncate">{recipe.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ScheduledRecipe({
  schedule,
  onRemove,
  removing,
}: Readonly<{
  schedule: Schedule;
  onRemove: () => void;
  removing: boolean;
}>) {
  return (
    // The title link stretches over the row so the remove button can be its
    // sibling, not nested inside it
    <li className="group bg-card hover:border-foreground/25 has-[a:focus-visible]:ring-ring/50 relative flex items-center gap-3 rounded-md border p-2 pr-1 transition-colors has-[a:focus-visible]:ring-[3px]">
      <span className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-sm">
        <Image
          src={schedule.recipe.image}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-foreground truncate text-xl leading-tight">
          <Link
            href={`/recipes/${schedule.recipeId}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {schedule.recipe.title}
          </Link>
        </p>
        <p className="eyebrow text-muted-foreground mt-1">
          {schedule.recipe.prepTime + schedule.recipe.cookTime} min ·{" "}
          {DIFFICULTY_LABELS[schedule.recipe.difficulty]}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label={`Quitar ${schedule.recipe.title} del menú`}
        className="text-muted-foreground hover:text-destructive relative z-10 shrink-0 rounded-full"
        disabled={removing}
      >
        <X aria-hidden="true" />
      </Button>
    </li>
  );
}

function MenuSkeleton() {
  return (
    <div className="page space-y-8">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md lg:h-40" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

export function MenuPageClient() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    weekStartOf(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const utils = api.useUtils();
  const { data: families, isLoading: loadingFamilies } =
    api.family.getMyFamilies.useQuery();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

  const activeFamilyId = selectedFamilyId || families?.[0]?.id;
  const weekEnd = addDays(currentWeekStart, 6);

  const { data: schedules, isLoading: loadingMenu } =
    api.menu.getWeeklyMenu.useQuery(
      {
        familyId: activeFamilyId ?? "",
        startDate: format(currentWeekStart, "yyyy-MM-dd"),
        endDate: format(weekEnd, "yyyy-MM-dd"),
      },
      { enabled: Boolean(activeFamilyId) },
    );

  // Only what the picker shows, and every recipe rather than the first page
  const { data: recipes } = api.recipe.getOptions.useQuery();

  const schedulesByDay = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {};
    for (const schedule of schedules ?? []) {
      // `date` is a UTC-midnight instant for the stored calendar day; use UTC
      // components so the key doesn't shift across the local day boundary.
      const dateKey = new Date(schedule.date).toISOString().slice(0, 10);
      grouped[dateKey] ??= [];
      grouped[dateKey].push(schedule);
    }
    return grouped;
  }, [schedules]);

  const scheduleRecipe = api.menu.scheduleRecipe.useMutation({
    onSuccess: () => {
      toast.success("Receta añadida al menú");
      void utils.menu.getWeeklyMenu.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeSchedule = api.menu.removeScheduledRecipe.useMutation({
    onSuccess: () => {
      toast.success("Receta quitada del menú");
      void utils.menu.getWeeklyMenu.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const goToWeek = (weekStart: Date) => {
    setCurrentWeekStart(weekStart);
    // Keep the selected weekday when paging, so "Wednesday" stays Wednesday
    const offset = Math.round(
      (selectedDate.getTime() - currentWeekStart.getTime()) / 86_400_000,
    );
    setSelectedDate(addDays(weekStart, Math.min(Math.max(offset, 0), 6)));
  };

  const today = new Date();
  const isCurrentWeek = isWithinInterval(today, {
    start: currentWeekStart,
    end: addDays(weekEnd, 1),
  });
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i),
  );
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedSchedules = schedulesByDay[selectedKey] ?? [];

  if (loadingFamilies) {
    return <MenuSkeleton />;
  }

  if (!families || families.length === 0) {
    return (
      <div className="page">
        <div className="mx-auto max-w-md rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-display text-4xl tracking-tight">
            Primero, una familia.
          </p>
          <p className="text-muted-foreground mt-3 text-pretty">
            El menú se comparte con tu familia. Crea una (o pide que te añadan)
            para empezar a planificar.
          </p>
          <Button asChild className="mt-6">
            <Link href="/family">Ir a Familia</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Semana anterior"
            onClick={() => goToWeek(subDays(currentWeekStart, 7))}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Semana siguiente"
            onClick={() => goToWeek(addDays(currentWeekStart, 7))}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <p
            className="font-display ml-3 text-2xl tracking-tight first-letter:uppercase md:text-3xl"
            aria-live="polite"
          >
            {format(currentWeekStart, "d MMM", { locale: es })} –{" "}
            {format(weekEnd, "d MMM yyyy", { locale: es })}
          </p>
          {isCurrentWeek ? null : (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => {
                setCurrentWeekStart(weekStartOf(today));
                setSelectedDate(today);
              }}
            >
              Hoy
            </Button>
          )}
        </div>

        {families.length > 1 ? (
          <label className="flex items-center gap-3">
            <span className="eyebrow text-muted-foreground">Familia</span>
            <NativeSelect
              value={activeFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="min-w-44"
            >
              {families.map((family) => (
                <NativeSelectOption key={family.id} value={family.id}>
                  {family.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        ) : null}
      </div>

      {/* The week at a glance; each day is also how you pick what to edit */}
      <ol
        className={cn(
          "grid grid-cols-7 gap-1.5 transition-opacity sm:gap-2",
          loadingMenu && "opacity-50",
        )}
        aria-label="Días de la semana"
      >
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const daySchedules = schedulesByDay[dateKey] ?? [];
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const count = daySchedules.length;

          return (
            <li key={dateKey} className="min-w-0">
              <button
                type="button"
                onClick={() => setSelectedDate(day)}
                aria-pressed={isSelected}
                aria-label={`${format(day, "EEEE d 'de' MMMM", { locale: es })}${isToday ? ", hoy" : ""}: ${count} ${count === 1 ? "comida" : "comidas"}`}
                className={cn(
                  "focus-visible:ring-ring/50 flex h-full w-full cursor-pointer flex-col rounded-md border p-2 text-left transition-colors outline-none focus-visible:ring-[3px] sm:p-3 lg:min-h-40",
                  isSelected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card hover:border-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "eyebrow flex items-center gap-1.5",
                    isSelected ? "text-background/70" : "text-muted-foreground",
                  )}
                >
                  {format(day, "EEE", { locale: es }).replace(".", "")}
                  {isToday ? (
                    <span className="bg-highlight size-1.5 rounded-full" />
                  ) : null}
                </span>
                <span className="font-display mt-1 text-3xl leading-none tabular-nums sm:text-4xl">
                  {format(day, "d")}
                </span>

                {/* Phones: one dot per meal. Wider screens: the titles. */}
                <span
                  aria-hidden="true"
                  className="mt-3 flex flex-wrap gap-1 lg:hidden"
                >
                  {daySchedules.slice(0, 4).map((schedule) => (
                    <span
                      key={schedule.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        isSelected ? "bg-background" : "bg-primary",
                      )}
                    />
                  ))}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-4 hidden min-w-0 space-y-1.5 lg:block"
                >
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <span
                      key={schedule.id}
                      className={cn(
                        "block truncate border-l-2 pl-2 text-xs leading-tight",
                        isSelected
                          ? "border-background/50"
                          : "border-primary/60",
                      )}
                    >
                      {schedule.recipe.title}
                    </span>
                  ))}
                  {count > 3 ? (
                    <span
                      className={cn(
                        "block pl-2.5 font-mono text-[11px]",
                        isSelected
                          ? "text-background/70"
                          : "text-muted-foreground",
                      )}
                    >
                      +{count - 3} más
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section
        aria-labelledby="day-heading"
        className="bg-card rounded-lg border"
      >
        <div className="flex items-baseline justify-between gap-4 border-b px-5 py-5 md:px-8 md:py-6">
          <h2
            id="day-heading"
            className="font-display text-3xl tracking-tight first-letter:uppercase md:text-4xl"
          >
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          <p className="eyebrow text-muted-foreground shrink-0">
            {selectedSchedules.length}{" "}
            {selectedSchedules.length === 1 ? "comida" : "comidas"}
          </p>
        </div>

        <div className="divide-y">
          {MEAL_TYPES.map((meal) => {
            const mealSchedules = selectedSchedules.filter(
              (schedule) => schedule.mealType === meal.id,
            );

            return (
              <div
                key={meal.id}
                className="grid gap-3 px-5 py-5 md:grid-cols-[10rem_1fr] md:gap-6 md:px-8"
              >
                <h3 className="eyebrow text-muted-foreground md:pt-3">
                  {meal.label}
                </h3>
                <div className="space-y-2">
                  {mealSchedules.length > 0 ? (
                    <ul className="space-y-2">
                      {mealSchedules.map((schedule) => (
                        <ScheduledRecipe
                          key={schedule.id}
                          schedule={schedule}
                          removing={removeSchedule.isPending}
                          onRemove={() =>
                            removeSchedule.mutate({ id: schedule.id })
                          }
                        />
                      ))}
                    </ul>
                  ) : null}
                  <AddRecipePicker
                    recipes={recipes ?? []}
                    mealLabel={meal.label}
                    disabled={scheduleRecipe.isPending || !activeFamilyId}
                    onAdd={(recipeId) => {
                      if (!activeFamilyId) return;
                      scheduleRecipe.mutate({
                        familyId: activeFamilyId,
                        date: selectedKey,
                        mealType: meal.id,
                        recipeId,
                      });
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

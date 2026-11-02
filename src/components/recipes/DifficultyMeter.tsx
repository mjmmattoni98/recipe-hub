import { DIFFICULTY_LABELS, type RecipeDifficulty } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";

const LEVEL: Record<RecipeDifficulty, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

// Three little bars, like a signal meter: quicker to scan than a colour code
export function DifficultyMeter({
  difficulty,
  className,
}: Readonly<{ difficulty: RecipeDifficulty; className?: string }>) {
  const level = LEVEL[difficulty];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden="true" className="flex items-end gap-[2px]">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn(
              "w-[3px] rounded-full bg-current",
              bar === 1 ? "h-1.5" : bar === 2 ? "h-2" : "h-2.5",
              bar > level && "opacity-25",
            )}
          />
        ))}
      </span>
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}

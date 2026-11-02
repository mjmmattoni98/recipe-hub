import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function FilterChip({
  label,
  isActive,
  onClick,
}: Readonly<FilterChipProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-sm transition-colors outline-none first-letter:uppercase focus-visible:ring-[3px]",
        isActive
          ? "bg-foreground text-background border-foreground"
          : "border-input text-foreground/80 hover:border-foreground/40 hover:text-foreground bg-card",
      )}
    >
      {label}
    </button>
  );
}

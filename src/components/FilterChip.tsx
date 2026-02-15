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
      className={cn("filter-chip", isActive && "active")}
    >
      {label}
    </button>
  );
}

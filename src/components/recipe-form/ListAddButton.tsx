import { Plus } from "lucide-react";

export function ListAddButton({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-input text-muted-foreground hover:text-foreground hover:border-foreground/40 focus-visible:ring-ring/50 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-sm transition-colors outline-none focus-visible:ring-[3px]"
    >
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

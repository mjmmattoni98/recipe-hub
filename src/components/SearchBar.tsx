import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
        suppressHydrationWarning
      />
      <Input
        type="text"
        placeholder="Search recipes by title..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border-border/50 font-body placeholder:text-muted-foreground focus-visible:ring-primary/30 h-12 rounded-full pr-10 pl-12 text-base"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
        >
          <X className="h-4 w-4" suppressHydrationWarning />
        </button>
      )}
    </div>
  );
}

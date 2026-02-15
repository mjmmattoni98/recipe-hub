import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Readonly<SearchBarProps>) {
  return (
    <div className="group relative w-full max-w-lg">
      <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 transition-colors duration-300" />
      <Input
        type="text"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border-border/60 font-body placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 h-14 rounded-2xl pr-12 pl-14 text-base shadow-lg transition-shadow duration-300 focus-visible:shadow-xl focus-visible:ring-2"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

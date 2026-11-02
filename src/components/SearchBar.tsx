"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function SearchBar({ value, onChange }: Readonly<SearchBarProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the search box, as on most sites with one main search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="group relative w-full">
      <Search
        className="text-muted-foreground group-focus-within:text-foreground pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 transition-colors"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        placeholder="Buscar por nombre, ingrediente o etiqueta…"
        aria-label="Buscar recetas"
        name="search"
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-card border-input placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-ring/40 h-12 w-full rounded-md border pr-12 pl-11 text-base transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Limpiar búsqueda"
          className="text-muted-foreground hover:text-foreground hover:bg-secondary absolute top-1/2 right-3 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 hidden h-6 -translate-y-1/2 items-center rounded border px-2 font-mono text-xs md:flex"
        >
          /
        </kbd>
      )}
    </div>
  );
}

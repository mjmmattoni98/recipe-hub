import { cn } from "@/lib/utils";
import Link from "next/link";

export function Wordmark({
  className,
  accentClassName = "text-primary",
}: Readonly<{ className?: string; accentClassName?: string }>) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-foreground shrink-0 text-[1.6rem] leading-none tracking-tight",
        className,
      )}
    >
      Recipe <span className={cn("italic", accentClassName)}>Hub</span>
    </Link>
  );
}

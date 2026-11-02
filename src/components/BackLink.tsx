"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Goes back when there is somewhere to go back to (which keeps the home
// page's filters, since they live in the URL), and otherwise follows the
// link — e.g. when the page was opened from a shared URL.
export function BackLink({
  fallbackHref = "/",
  label = "Volver",
  className,
}: Readonly<{ fallbackHref?: string; label?: string; className?: string }>) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className={cn(
        "eyebrow text-muted-foreground hover:text-foreground group inline-flex items-center gap-2 transition-colors",
        className,
      )}
    >
      <ArrowLeft
        className="size-3.5 transition-transform group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}

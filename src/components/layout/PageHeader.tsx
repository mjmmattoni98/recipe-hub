import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  // Sits above the eyebrow, e.g. a back link
  lead?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  lead,
  className,
}: Readonly<PageHeaderProps>) {
  return (
    <div className={cn("page pt-8 pb-8 md:pt-14 md:pb-10", className)}>
      {lead ? <div className="mb-6">{lead}</div> : null}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="eyebrow text-muted-foreground mb-3">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-foreground text-[2.75rem] leading-[0.95] tracking-tight text-balance md:text-7xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground mt-4 max-w-2xl text-base text-pretty md:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

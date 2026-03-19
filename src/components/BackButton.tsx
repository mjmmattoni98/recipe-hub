"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({ 
  className, 
  variant = "ghost" 
}: { 
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn("rounded-full cursor-pointer", className)}
      aria-label="Volver atrás"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}

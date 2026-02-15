import { Button } from "@/components/ui/button";
import { ChefHat, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <div className="from-primary/5 via-secondary/30 to-background absolute inset-0 bg-linear-to-br" />

      <div className="relative text-center">
        <div className="bg-muted mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
          <ChefHat className="text-muted-foreground h-10 w-10" />
        </div>
        <h1 className="font-display text-foreground mb-2 text-7xl font-bold">
          404
        </h1>
        <p className="font-body text-muted-foreground mb-8 text-lg">
          This recipe seems to have gone missing from the kitchen.
        </p>
        <Link href="/">
          <Button className="gap-2 rounded-full" size="lg">
            <Home className="h-4 w-4" />
            Back to Recipes
          </Button>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useToggleCooked } from "@/components/recipes/use-toggle-cooked";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

type CookingToolsProps = {
  recipeId: string;
  isLoggedIn: boolean;
  initialCooked: boolean;
};

const subscribeNever = () => () => {};

function CookedToggle({
  recipeId,
  initialCooked,
}: Readonly<{ recipeId: string; initialCooked: boolean }>) {
  const [cooked, setCooked] = useState(initialCooked);
  const toggleCooked = useToggleCooked();

  const handleClick = () => {
    const next = !cooked;
    setCooked(next);
    toggleCooked.mutate(
      { id: recipeId, cooked: next },
      { onError: () => setCooked(!next) },
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      aria-label={
        cooked ? "Cocinada (marcar como pendiente)" : "Marcar como cocinada"
      }
      className={cn(
        "cursor-pointer gap-2 rounded-full",
        cooked &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
      )}
    >
      <CheckCircle className="h-4 w-4" aria-hidden="true" />
      {cooked ? "Cocinada" : "Marcar como cocinada"}
    </Button>
  );
}

// Stops the phone from dimming while the recipe is open on the counter
function KeepScreenOn() {
  const [enabled, setEnabled] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const request = async () => {
      if (sentinelRef.current && !sentinelRef.current.released) return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        if (!cancelled) {
          setEnabled(false);
          toast.error("No se pudo mantener la pantalla encendida");
        }
      }
    };

    // The browser drops the lock whenever the tab is hidden, so take it again
    // when the user comes back.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [enabled]);

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="keep-screen-on"
        checked={enabled}
        onCheckedChange={setEnabled}
        className="cursor-pointer"
      />
      <Label htmlFor="keep-screen-on" className="font-body cursor-pointer">
        Mantener la pantalla encendida
      </Label>
    </div>
  );
}

export function CookingTools({
  recipeId,
  isLoggedIn,
  initialCooked,
}: Readonly<CookingToolsProps>) {
  // Not every browser has the Screen Wake Lock API; false on the server
  const supportsWakeLock = useSyncExternalStore(
    subscribeNever,
    () => "wakeLock" in navigator,
    () => false,
  );

  if (!isLoggedIn && !supportsWakeLock) return null;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
      {isLoggedIn ? (
        <CookedToggle recipeId={recipeId} initialCooked={initialCooked} />
      ) : null}
      {supportsWakeLock ? <KeepScreenOn /> : null}
    </div>
  );
}

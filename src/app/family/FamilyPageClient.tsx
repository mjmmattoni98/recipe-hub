"use client";

import { initialsOf } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type RouterOutputs } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

type Family = RouterOutputs["family"]["getMyFamilies"][number];
type AppUser = RouterOutputs["family"]["getAllUsers"][number];

function AddMemberForm({
  family,
  candidates,
}: Readonly<{ family: Family; candidates: AppUser[] }>) {
  const utils = api.useUtils();
  const [userId, setUserId] = useState("");

  const addMember = api.family.addMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro añadido");
      setUserId("");
      void utils.family.getMyFamilies.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectId = `add-member-${family.id}`;

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!userId) return;
        addMember.mutate({ familyId: family.id, userId });
      }}
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor={selectId} className="eyebrow text-muted-foreground">
          Añadir a alguien
        </Label>
        <NativeSelect
          id={selectId}
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          disabled={addMember.isPending}
          className="w-full"
        >
          <NativeSelectOption value="" disabled>
            Elige una persona…
          </NativeSelectOption>
          {candidates.map((user) => (
            <NativeSelectOption key={user.id} value={user.id}>
              {user.name || "Usuario sin nombre"}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={addMember.isPending || !userId}>
        {addMember.isPending ? "Añadiendo…" : "Añadir"}
      </Button>
    </form>
  );
}

function FamilyCard({
  family,
  currentUserId,
  users,
}: Readonly<{ family: Family; currentUserId: string; users: AppUser[] }>) {
  const isAdmin = family.members.some(
    (member) => member.userId === currentUserId && member.role === "ADMIN",
  );
  const candidates = users.filter(
    (user) => !family.members.some((member) => member.userId === user.id),
  );

  return (
    <section
      aria-labelledby={`family-${family.id}`}
      className="bg-card rounded-lg border"
    >
      <div className="flex items-baseline justify-between gap-4 border-b px-5 py-5 md:px-6">
        <h2
          id={`family-${family.id}`}
          className="font-display truncate text-3xl tracking-tight"
        >
          {family.name}
        </h2>
        <p className="eyebrow text-muted-foreground shrink-0">
          {family.members.length}{" "}
          {family.members.length === 1 ? "miembro" : "miembros"}
        </p>
      </div>

      <ul className="divide-y">
        {family.members.map((member) => {
          const name = member.user.name || member.user.email;
          return (
            <li
              key={member.id}
              className="flex items-center gap-3 px-5 py-3 md:px-6"
            >
              <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold">
                {initialsOf(name) || "?"}
              </span>
              <p className="min-w-0 flex-1 truncate font-medium">
                {name}
                {member.userId === currentUserId ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (tú)
                  </span>
                ) : null}
              </p>
              <span className="eyebrow text-muted-foreground">
                {member.role === "ADMIN" ? "Admin" : "Miembro"}
              </span>
            </li>
          );
        })}
      </ul>

      {isAdmin && candidates.length > 0 ? (
        <div className="bg-muted/40 border-t px-5 py-5 md:px-6">
          <AddMemberForm family={family} candidates={candidates} />
        </div>
      ) : null}
    </section>
  );
}

export function FamilyPageClient({
  currentUserId,
}: Readonly<{ currentUserId: string }>) {
  const [newFamilyName, setNewFamilyName] = useState("");

  const utils = api.useUtils();
  const { data: families, isLoading } = api.family.getMyFamilies.useQuery();
  const { data: users } = api.family.getAllUsers.useQuery();

  const createFamily = api.family.createFamily.useMutation({
    onSuccess: () => {
      toast.success("Familia creada");
      setNewFamilyName("");
      void utils.family.getMyFamilies.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="page grid gap-10 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : families && families.length > 0 ? (
          families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              currentUserId={currentUserId}
              users={users ?? []}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="font-display text-4xl tracking-tight">
              Aún sin familia.
            </p>
            <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-pretty">
              Crea una con el formulario y luego añade a quien quieras. También
              pueden añadirte desde otra familia.
            </p>
          </div>
        )}
      </div>

      <aside className="lg:col-span-4">
        <form
          className="lg:sticky lg:top-24"
          onSubmit={(event) => {
            event.preventDefault();
            const name = newFamilyName.trim();
            if (!name) return;
            createFamily.mutate({ name });
          }}
        >
          <h2 className="font-display text-2xl tracking-tight">
            Nueva familia
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Serás su administrador y podrás añadir miembros.
          </p>
          <Label htmlFor="new-family-name" className="sr-only">
            Nombre de la familia
          </Label>
          <Input
            id="new-family-name"
            className="mt-4"
            placeholder="Los García, Casa de la playa…"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            disabled={createFamily.isPending}
          />
          <Button
            type="submit"
            className="mt-3 w-full"
            disabled={createFamily.isPending || !newFamilyName.trim()}
          >
            {createFamily.isPending ? "Creando…" : "Crear familia"}
          </Button>
        </form>
      </aside>
    </div>
  );
}

"use client";

import { canManageFamily, decideMemberRemoval } from "@/lib/family-permissions";
import { initialsOf } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type RouterOutputs } from "@/trpc/react";
import { Ellipsis, LogOut, Pencil, Trash2, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Family = RouterOutputs["family"]["getMyFamilies"][number];
type AppUser = RouterOutputs["family"]["getAllUsers"][number];
type Member = Family["members"][number];

type FamilyAction =
  | { type: "rename" }
  | { type: "delete" }
  | { type: "leave" }
  | { type: "remove" };

function memberName(member: Member) {
  return member.user.name || member.user.email;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  onConfirm,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  onConfirm: () => void;
}>) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-3xl font-normal tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RenameFamilyForm({
  family,
  pending,
  onCancel,
  onSubmit,
}: Readonly<{
  family: Family;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}>) {
  const [name, setName] = useState(family.name);
  const trimmed = name.trim();
  const inputId = `rename-family-${family.id}`;

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!trimmed) return;
        if (trimmed === family.name) {
          onCancel();
          return;
        }
        onSubmit(trimmed);
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-display text-3xl font-normal tracking-tight">
          Cambiar nombre
        </DialogTitle>
        <DialogDescription>
          El nuevo nombre lo verán todos los miembros de la familia.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor={inputId} className="eyebrow text-muted-foreground">
          Nombre de la familia
        </Label>
        <Input
          id={inputId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !trimmed}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

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
  const utils = api.useUtils();
  const [action, setAction] = useState<FamilyAction | null>(null);
  const close = () => setAction(null);

  const currentRole = family.members.find(
    (member) => member.userId === currentUserId,
  )?.role;
  const isAdmin = canManageFamily(currentRole);
  const candidates = users.filter(
    (user) => !family.members.some((member) => member.userId === user.id),
  );
  const memberships = family.members.map(({ userId, role }) => ({
    userId,
    role,
  }));
  const canRemoveUser = (userId: string) =>
    decideMemberRemoval({
      members: memberships,
      actorId: currentUserId,
      targetId: userId,
    }).allowed;
  const canLeave = canRemoveUser(currentUserId);

  // The menu page reads the families list and each family's schedule.
  const refresh = () => {
    void utils.family.getMyFamilies.invalidate();
    void utils.menu.invalidate();
  };

  const renameFamily = api.family.renameFamily.useMutation({
    onSuccess: () => {
      toast.success("Familia renombrada");
      refresh();
    },
    onError: (e) => toast.error(e.message),
    onSettled: close,
  });

  const deleteFamily = api.family.deleteFamily.useMutation({
    onSuccess: () => {
      toast.success("Familia eliminada");
      refresh();
    },
    onError: (e) => toast.error(e.message),
    onSettled: close,
  });

  const removeMember = api.family.removeMember.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(
        variables.userId === currentUserId
          ? "Has salido de la familia"
          : "Miembro eliminado de la familia",
      );
      refresh();
    },
    onError: (e) => toast.error(e.message),
    onSettled: close,
  });

  // Kept after the dialog closes so its text doesn't vanish mid-animation.
  const [removing, setRemoving] = useState<Member | null>(null);

  return (
    <section
      aria-labelledby={`family-${family.id}`}
      className="bg-card rounded-lg border"
    >
      <div className="flex items-center justify-between gap-4 border-b px-5 py-5 md:px-6">
        <h2
          id={`family-${family.id}`}
          className="font-display truncate text-3xl tracking-tight"
        >
          {family.name}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <p className="eyebrow text-muted-foreground">
            {family.members.length}{" "}
            {family.members.length === 1 ? "miembro" : "miembros"}
          </p>
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Opciones de ${family.name}`}
                >
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => setAction({ type: "rename" })}
                >
                  <Pencil aria-hidden="true" />
                  Cambiar nombre
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setAction({ type: "delete" })}
                >
                  <Trash2 aria-hidden="true" />
                  Eliminar familia
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <ul className="divide-y">
        {family.members.map((member) => {
          const name = memberName(member);
          const isSelf = member.userId === currentUserId;
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
                {isSelf ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (tú)
                  </span>
                ) : null}
              </p>
              <span className="eyebrow text-muted-foreground">
                {member.role === "ADMIN" ? "Admin" : "Miembro"}
              </span>
              {!isSelf && canRemoveUser(member.userId) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive -mr-2"
                  aria-label={`Quitar a ${name} de ${family.name}`}
                  onClick={() => {
                    setRemoving(member);
                    setAction({ type: "remove" });
                  }}
                >
                  <UserMinus aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isAdmin && candidates.length > 0 ? (
        <div className="bg-muted/40 border-t px-5 py-5 md:px-6">
          <AddMemberForm family={family} candidates={candidates} />
        </div>
      ) : null}

      {!isAdmin && canLeave ? (
        <div className="flex justify-end border-t px-5 py-4 md:px-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAction({ type: "leave" })}
          >
            <LogOut aria-hidden="true" />
            Salir de la familia
          </Button>
        </div>
      ) : null}

      <Dialog
        open={action?.type === "rename"}
        onOpenChange={(open) => {
          if (!open && !renameFamily.isPending) close();
        }}
      >
        <DialogContent>
          <RenameFamilyForm
            family={family}
            pending={renameFamily.isPending}
            onCancel={close}
            onSubmit={(name) =>
              renameFamily.mutate({ familyId: family.id, name })
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={action?.type === "delete"}
        onOpenChange={(open) => !open && close()}
        title="Eliminar familia"
        description={`Se eliminará «${family.name}» con todos sus miembros y el menú que tenéis planificado. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar familia"
        pendingLabel="Eliminando…"
        pending={deleteFamily.isPending}
        onConfirm={() => deleteFamily.mutate({ familyId: family.id })}
      />

      <ConfirmDialog
        open={action?.type === "leave"}
        onOpenChange={(open) => !open && close()}
        title="Salir de la familia"
        description={`Dejarás de ver el menú de «${family.name}». Para volver, un administrador tendrá que añadirte de nuevo.`}
        confirmLabel="Salir"
        pendingLabel="Saliendo…"
        pending={removeMember.isPending}
        onConfirm={() =>
          removeMember.mutate({ familyId: family.id, userId: currentUserId })
        }
      />

      <ConfirmDialog
        open={action?.type === "remove"}
        onOpenChange={(open) => !open && close()}
        title="Quitar de la familia"
        description={
          removing
            ? `${memberName(removing)} dejará de ver el menú de «${family.name}». Podrás volver a añadir a esta persona más tarde.`
            : ""
        }
        confirmLabel="Quitar"
        pendingLabel="Quitando…"
        pending={removeMember.isPending}
        onConfirm={() => {
          if (removing) {
            removeMember.mutate({
              familyId: family.id,
              userId: removing.userId,
            });
          }
        }}
      />
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

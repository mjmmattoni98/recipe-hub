"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isAppAdmin, MIN_PASSWORD_LENGTH } from "@/lib/admin-role";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { Shield, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean;
  createdAt: Date | string;
};

type AccountRole = "user" | "admin";

type PendingAction =
  | { type: "create" }
  | { type: "rename" | "password" | "role" | "delete"; userId: string };

const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "El nombre es demasiado largo"),
  email: z.email("Introduce un correo válido"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["user", "admin"]),
});

const renameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "El nombre es demasiado largo"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        "La contraseña debe tener al menos 8 caracteres",
      ),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese correo.",
  YOU_CANNOT_REMOVE_YOURSELF: "No puedes eliminar tu propia cuenta.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  "User already exists.": "Ya existe una cuenta con ese correo.",
  "User already exists. Use another email.":
    "Ya existe una cuenta con ese correo.",
  "You cannot remove yourself": "No puedes eliminar tu propia cuenta.",
  "Password too short": "La contraseña debe tener al menos 8 caracteres.",
  "Password too long": "La contraseña es demasiado larga.",
};

function translateAuthError(
  error: {
    message?: string;
    code?: string;
  } | null,
): string {
  if (!error) return "No se pudo completar la acción.";

  const translatedCode = error.code
    ? AUTH_ERROR_MESSAGES[error.code]
    : undefined;
  if (translatedCode) return translatedCode;

  const translatedMessage = error.message
    ? AUTH_ERROR_MESSAGES[error.message]
    : undefined;
  if (translatedMessage) return translatedMessage;

  return error.message || "No se pudo completar la acción.";
}

function toManagedUser(user: {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date | string;
}): ManagedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? null,
    banned: Boolean(user.banned),
    createdAt: user.createdAt,
  };
}

function formatCreatedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const selectClassName =
  "border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

export function AdminUsers({
  currentUserId,
}: Readonly<{ currentUserId: string }>) {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [renameTarget, setRenameTarget] = useState<ManagedUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<ManagedUser | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const loadUsers = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (mode === "initial") setIsLoading(true);

      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: 200,
          sortBy: "name",
          sortDirection: "asc",
        },
      });

      if (error) {
        const message = translateAuthError(error);
        if (mode === "initial") setLoadError(message);
        else toast.error(message);
        setIsLoading(false);
        return;
      }

      setUsers((data?.users ?? []).map(toManagedUser));
      setLoadError(null);
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    void loadUsers("initial");
  }, [loadUsers]);

  const activeAdminCount = users.filter(
    (user) => isAppAdmin(user.role) && !user.banned,
  ).length;

  const createAccount = async (value: z.infer<typeof createAccountSchema>) => {
    setPending({ type: "create" });
    const { error } = await authClient.admin.createUser({
      name: value.name,
      email: value.email,
      password: value.password,
      role: value.role,
    });
    setPending(null);

    if (error) {
      toast.error(translateAuthError(error));
      return;
    }

    toast.success("Cuenta creada");
    setCreateOpen(false);
    setCreateFormKey((key) => key + 1);
    await loadUsers();
  };

  const renameAccount = async (user: ManagedUser, name: string) => {
    setPending({ type: "rename", userId: user.id });
    const { error } = await authClient.admin.updateUser({
      userId: user.id,
      data: { name },
    });
    setPending(null);

    if (error) {
      toast.error(translateAuthError(error));
      return;
    }

    toast.success("Nombre actualizado");
    setRenameTarget(null);
    await loadUsers();
  };

  const setPassword = async (user: ManagedUser, newPassword: string) => {
    setPending({ type: "password", userId: user.id });
    const { error } = await authClient.admin.setUserPassword({
      userId: user.id,
      newPassword,
    });
    setPending(null);

    if (error) {
      toast.error(translateAuthError(error));
      return;
    }

    toast.success("Contraseña actualizada");
    setPasswordTarget(null);
    await loadUsers();
  };

  const changeRole = async (user: ManagedUser, role: AccountRole) => {
    setUsers((current) =>
      current.map((item) => (item.id === user.id ? { ...item, role } : item)),
    );
    setPending({ type: "role", userId: user.id });
    const { error } = await authClient.admin.setRole({
      userId: user.id,
      role,
    });
    setPending(null);

    if (error) {
      toast.error(translateAuthError(error));
      await loadUsers();
      return;
    }

    toast.success(
      role === "admin" ? "Ahora es administrador" : "Ya no es administrador",
    );

    if (user.id === currentUserId && role !== "admin") {
      router.push("/");
      router.refresh();
      return;
    }

    await loadUsers();
  };

  const deleteAccount = async (user: ManagedUser) => {
    setPending({ type: "delete", userId: user.id });
    const { error } = await authClient.admin.removeUser({
      userId: user.id,
    });
    setPending(null);

    if (error) {
      toast.error(translateAuthError(error));
      return;
    }

    toast.success("Cuenta eliminada");
    setDeleteTarget(null);
    await loadUsers();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-muted-foreground max-w-2xl">
          Crea cuentas, cambia el nombre o la contraseña y elige quién puede
          administrar Recipe Hub. El registro público sigue cerrado.
        </p>
        <Button
          type="button"
          className="cursor-pointer gap-2 rounded-full"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Nueva cuenta
        </Button>
      </div>

      <section
        className="bg-card rounded-2xl border"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Personas</h2>
          {isLoading ? null : (
            <span className="text-muted-foreground text-sm">
              {users.length === 1 ? "1 cuenta" : `${users.length} cuentas`}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : loadError ? (
          <div className="space-y-4 px-5 py-10 text-center">
            <p className="text-muted-foreground text-sm">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-full"
              onClick={() => void loadUsers("initial")}
            >
              Reintentar
            </Button>
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground px-5 py-10 text-center text-sm">
            Todavía no hay cuentas.
          </p>
        ) : (
          <ul className="divide-y">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isAdmin = isAppAdmin(user.role);
              const isLastAdmin =
                isAdmin && !user.banned && activeAdminCount <= 1;
              const createdLabel = formatCreatedAt(user.createdAt);
              const rowPending =
                pending !== null &&
                pending.type !== "create" &&
                pending.userId === user.id;

              return (
                <li
                  key={user.id}
                  className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {initials(user.name) || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{user.name}</p>
                        {isSelf ? <Badge variant="outline">Tú</Badge> : null}
                        {isAdmin ? (
                          <Badge>
                            <Shield className="h-3 w-3" aria-hidden="true" />
                            Administrador
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Usuario</Badge>
                        )}
                        {user.banned ? (
                          <Badge variant="destructive">Bloqueada</Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        {user.email}
                        {createdLabel ? ` · desde ${createdLabel}` : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${user.id}`}>
                      Rol de {user.name}
                    </label>
                    <select
                      id={`role-${user.id}`}
                      className={selectClassName}
                      value={isAdmin ? "admin" : "user"}
                      disabled={isLastAdmin || rowPending}
                      title={
                        isLastAdmin
                          ? "Tiene que quedar al menos un administrador."
                          : undefined
                      }
                      onChange={(event) => {
                        const role = event.target.value;
                        if (role !== "admin" && role !== "user") return;
                        if ((role === "admin") === isAdmin) return;
                        void changeRole(user, role);
                      }}
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      disabled={rowPending}
                      onClick={() => setRenameTarget(user)}
                    >
                      Nombre
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      disabled={rowPending}
                      onClick={() => setPasswordTarget(user)}
                    >
                      Contraseña
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="cursor-pointer"
                      disabled={isSelf || isLastAdmin || rowPending}
                      title={
                        isSelf
                          ? "No puedes eliminar tu propia cuenta."
                          : undefined
                      }
                      onClick={() => setDeleteTarget(user)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CreateAccountDialog
        key={createFormKey}
        open={createOpen}
        pending={pending?.type === "create"}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateFormKey((key) => key + 1);
        }}
        onCreate={createAccount}
      />
      <RenameAccountDialog
        user={renameTarget}
        pending={
          pending?.type === "rename" && pending.userId === renameTarget?.id
        }
        onClose={() => setRenameTarget(null)}
        onSave={renameAccount}
      />
      <PasswordDialog
        user={passwordTarget}
        pending={
          pending?.type === "password" && pending.userId === passwordTarget?.id
        }
        onClose={() => setPasswordTarget(null)}
        onSave={setPassword}
      />
      <DeleteAccountDialog
        user={deleteTarget}
        pending={
          pending?.type === "delete" && pending.userId === deleteTarget?.id
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteAccount}
      />
    </div>
  );
}

function CreateAccountDialog({
  open,
  pending,
  onOpenChange,
  onCreate,
}: Readonly<{
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (value: z.infer<typeof createAccountSchema>) => Promise<void>;
}>) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user" as AccountRole,
    },
    validators: {
      onSubmit: createAccountSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = createAccountSchema.safeParse(value);
      if (!parsed.success) return;
      await onCreate(parsed.data);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Nueva cuenta</DialogTitle>
          <DialogDescription>
            La persona podrá iniciar sesión con este correo y esta contraseña.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="create-name">Nombre</FieldLabel>
                  <Input
                    id="create-name"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    className="h-11 rounded-xl"
                    autoComplete="off"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="create-email">
                    Correo electrónico
                  </FieldLabel>
                  <Input
                    id="create-email"
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    className="h-11 rounded-xl"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="create-password">Contraseña</FieldLabel>
                  <Input
                    id="create-password"
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    className="h-11 rounded-xl"
                    autoComplete="new-password"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="role">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="create-role">Rol</FieldLabel>
                <select
                  id="create-role"
                  name={field.name}
                  className={`${selectClassName} h-11 w-full rounded-xl`}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    const role = event.target.value;
                    if (role === "admin" || role === "user") {
                      field.handleChange(role);
                    }
                  }}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </Field>
            )}
          </form.Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={pending || isSubmitting}
                >
                  {pending || isSubmitting ? "Creando…" : "Crear cuenta"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameAccountDialog({
  user,
  pending,
  onClose,
  onSave,
}: Readonly<{
  user: ManagedUser | null;
  pending: boolean;
  onClose: () => void;
  onSave: (user: ManagedUser, name: string) => Promise<void>;
}>) {
  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Cambiar nombre</DialogTitle>
          <DialogDescription>
            {user ? `El correo ${user.email} no cambia.` : null}
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <RenameAccountForm
            key={user.id}
            user={user}
            pending={pending}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RenameAccountForm({
  user,
  pending,
  onClose,
  onSave,
}: Readonly<{
  user: ManagedUser;
  pending: boolean;
  onClose: () => void;
  onSave: (user: ManagedUser, name: string) => Promise<void>;
}>) {
  const form = useForm({
    defaultValues: {
      name: user.name,
    },
    validators: {
      onSubmit: renameSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = renameSchema.safeParse(value);
      if (!parsed.success) return;
      await onSave(user, parsed.data.name);
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="rename-name">Nombre</FieldLabel>
              <Input
                id="rename-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                className="h-11 rounded-xl"
                autoComplete="off"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PasswordDialog({
  user,
  pending,
  onClose,
  onSave,
}: Readonly<{
  user: ManagedUser | null;
  pending: boolean;
  onClose: () => void;
  onSave: (user: ManagedUser, password: string) => Promise<void>;
}>) {
  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Nueva contraseña</DialogTitle>
          <DialogDescription>
            {user
              ? `Sustituye la contraseña de ${user.name}. La sesión actual no se cierra.`
              : null}
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <PasswordForm
            key={user.id}
            user={user}
            pending={pending}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PasswordForm({
  user,
  pending,
  onClose,
  onSave,
}: Readonly<{
  user: ManagedUser;
  pending: boolean;
  onClose: () => void;
  onSave: (user: ManagedUser, password: string) => Promise<void>;
}>) {
  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = passwordSchema.safeParse(value);
      if (!parsed.success) return;
      await onSave(user, parsed.data.password);
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="password">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="new-password">Contraseña</FieldLabel>
              <Input
                id="new-password"
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                className="h-11 rounded-xl"
                autoComplete="new-password"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>
      <form.Field name="confirmPassword">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="confirm-password">
                Confirmar contraseña
              </FieldLabel>
              <Input
                id="confirm-password"
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                className="h-11 rounded-xl"
                autoComplete="new-password"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={pending}>
          {pending ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteAccountDialog({
  user,
  pending,
  onClose,
  onConfirm,
}: Readonly<{
  user: ManagedUser | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (user: ManagedUser) => Promise<void>;
}>) {
  return (
    <AlertDialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            Eliminar cuenta
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user
              ? `Se eliminará la cuenta de ${user.name} (${user.email}), junto con sus sesiones y su acceso. Esta acción no se puede deshacer.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer"
            disabled={pending || !user}
            onClick={() => {
              if (user) void onConfirm(user);
            }}
          >
            {pending ? "Eliminando…" : "Eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

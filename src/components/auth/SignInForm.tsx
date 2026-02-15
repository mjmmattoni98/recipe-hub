"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { ChefHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type SignInFormProps = {
  callbackUrl: string;
};

export function SignInForm({ callbackUrl }: Readonly<SignInFormProps>) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          callbackURL: callbackUrl,
        },
        {
          onSuccess: () => {
            router.push(callbackUrl);
            router.refresh();
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        },
      );
    },
  });

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center p-4"
    >
      <div className="from-primary/6 via-secondary/40 to-background absolute inset-0 bg-linear-to-br" />
      <div className="bg-primary/8 absolute top-0 -right-20 h-80 w-80 rounded-full blur-3xl" />
      <div className="bg-accent/10 absolute -bottom-20 -left-20 h-72 w-72 rounded-full blur-3xl" />

      <div className="animate-in fade-in slide-in-from-bottom-6 relative w-full max-w-md duration-500">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="bg-primary flex h-11 w-11 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105">
              <ChefHat
                className="text-primary-foreground h-6 w-6"
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-foreground text-2xl font-bold tracking-tight">
              RecipeHub
            </span>
          </Link>
        </div>

        <Card
          className="rounded-2xl border-none"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <CardHeader className="pb-2 text-center">
            <CardTitle className="font-display text-2xl font-bold">
              Bienvenido de nuevo
            </CardTitle>
            <CardDescription className="font-body">
              Inicia sesión para gestionar tu colección de recetas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-5"
            >
              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Correo electrónico
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        className="h-12 rounded-xl"
                        placeholder="tu@ejemplo.com…"
                        autoComplete="email"
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
                      <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        className="h-12 rounded-xl"
                        placeholder="Introduce tu contraseña…"
                        autoComplete="current-password"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="h-12 w-full cursor-pointer rounded-xl text-base font-semibold"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? "Iniciando sesión…" : "Iniciar Sesión"}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

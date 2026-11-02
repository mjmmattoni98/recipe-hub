"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { Wordmark } from "@/components/layout/Wordmark";
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
    <main id="main-content" className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Always the dark "ink" panel, whatever the theme */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r bg-[oklch(0.2_0.012_60)] p-12 text-[oklch(0.95_0.01_85)] lg:flex">
        <Wordmark
          className="text-3xl text-inherit"
          accentClassName="text-[oklch(0.85_0.14_84)]"
        />
        <div>
          <p className="eyebrow opacity-60">Recetario familiar</p>
          <p className="font-display mt-4 max-w-xl text-7xl leading-[0.95] tracking-tight text-balance">
            Lo que se cocina en casa,{" "}
            <em className="text-[oklch(0.85_0.14_84)]">apuntado</em> para la
            próxima vez.
          </p>
        </div>
        <p className="eyebrow opacity-50">
          Solo con invitación · Pide una cuenta a quien administre
        </p>
      </section>

      <section className="flex flex-col p-6 sm:p-10">
        <Wordmark className="lg:hidden" />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="eyebrow text-muted-foreground">Bienvenido de nuevo</p>
          <h1 className="font-display mt-3 text-5xl leading-none tracking-tight">
            Entrar
          </h1>
          <p className="text-muted-foreground mt-3">
            Accede para guardar recetas, planificar el menú y comentar.
          </p>
          <div className="mt-8">
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
                        className="h-12"
                        placeholder="tu@ejemplo.com"
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
                        className="h-12"
                        placeholder="••••••••"
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
                    className="h-12 w-full text-base"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? "Entrando…" : "Entrar"}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { AssistantAnswer } from "@/components/recipes/AssistantAnswer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SUGGESTIONS = [
  "¿Cómo lo adapto a 2 raciones?",
  "¿Qué puedo sustituir si me falta algo?",
  "¿Qué preparo primero?",
];

export function RecipeAssistant({ recipeId }: Readonly<{ recipeId: string }>) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const ask = api.ai.askAboutRecipe.useMutation({
    onSuccess: (result) => {
      setAnswer(result.answer);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submit = (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();
    if (trimmed.length < 3 || ask.isPending) {
      return;
    }

    setQuestion(trimmed);
    ask.mutate({ recipeId, question: trimmed });
  };

  return (
    <section
      className="bg-card rounded-lg border p-6 md:p-8"
      aria-labelledby="recipe-assistant-heading"
    >
      <p className="eyebrow text-muted-foreground flex items-center gap-2">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Asistente
      </p>
      <h2
        id="recipe-assistant-heading"
        className="font-display text-foreground mt-2 text-3xl tracking-tight md:text-4xl"
      >
        ¿Alguna duda con esta receta?
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Responde un modelo gratuito de OpenRouter. Revisa la respuesta antes de
        cocinar.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => submit(suggestion)}
            disabled={ask.isPending}
            className="border-input hover:border-foreground/40 hover:text-foreground text-foreground/80 h-8 cursor-pointer rounded-full border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
      >
        <Label htmlFor="recipe-question" className="sr-only">
          Tu pregunta
        </Label>
        <div className="relative">
          <Input
            id="recipe-question"
            name="question"
            value={question}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="¿Puedo hacerla sin horno?"
            className="bg-background h-12 pr-14"
          />
          <Button
            type="submit"
            size="icon-sm"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
            disabled={ask.isPending || question.trim().length < 3}
            aria-label={ask.isPending ? "Pensando…" : "Preguntar"}
          >
            {ask.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp aria-hidden="true" />
            )}
          </Button>
        </div>
      </form>
      {ask.isPending ? (
        <p
          className="eyebrow text-muted-foreground mt-5 animate-pulse"
          aria-live="polite"
        >
          Pensando…
        </p>
      ) : null}
      {!ask.isPending && answer ? <AssistantAnswer answer={answer} /> : null}
    </section>
  );
}

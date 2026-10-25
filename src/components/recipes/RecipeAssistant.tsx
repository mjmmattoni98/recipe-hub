"use client";

import { AssistantAnswer } from "@/components/recipes/AssistantAnswer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { Loader2, Wand2 } from "lucide-react";
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
      className="border-border mt-10 border-t pt-6"
      aria-labelledby="recipe-assistant-heading"
    >
      <h2
        id="recipe-assistant-heading"
        className="font-display text-foreground mb-2 flex items-center gap-2 text-2xl font-semibold"
      >
        <Wand2 className="h-5 w-5" aria-hidden="true" />
        Pregunta sobre esta receta
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Respuestas con un modelo gratuito de OpenRouter. Revísalas antes de
        cocinar.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => submit(suggestion)}
            disabled={ask.isPending}
          >
            {suggestion}
          </Button>
        ))}
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="recipe-question">Tu pregunta</Label>
          <Input
            id="recipe-question"
            name="question"
            value={question}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="¿Puedo hacerla sin horno?"
          />
        </div>
        <Button
          type="submit"
          disabled={ask.isPending || question.trim().length < 3}
        >
          {ask.isPending ? (
            <span className="animate-spin" aria-hidden="true">
              <Loader2 />
            </span>
          ) : null}
          {ask.isPending ? "Pensando…" : "Preguntar"}
        </Button>
      </form>
      {ask.isPending ? (
        <p className="text-muted-foreground mt-4 text-sm" aria-live="polite">
          Pensando…
        </p>
      ) : null}
      {!ask.isPending && answer ? <AssistantAnswer answer={answer} /> : null}
    </section>
  );
}

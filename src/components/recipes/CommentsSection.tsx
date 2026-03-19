"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function CommentsSection({
  recipeId,
  isLoggedIn,
}: {
  recipeId: string;
  isLoggedIn: boolean;
}) {
  const [newComment, setNewComment] = useState("");
  const utils = api.useUtils();

  const { data: comments, isLoading } = api.comment.getCommentsByRecipeId.useQuery({
    recipeId,
  });

  const addComment = api.comment.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comentario publicado");
      setNewComment("");
      utils.comment.getCommentsByRecipeId.invalidate({ recipeId });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment.mutate({
      recipeId,
      content: newComment.trim(),
    });
  };

  return (
    <div className="mt-12 space-y-8 border-t pt-8" id="comments">
      <div className="flex items-center gap-2 text-2xl font-bold font-display text-foreground">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h3>Comentarios</h3>
        <span className="bg-secondary text-secondary-foreground ml-2 rounded-full px-3 py-1 text-sm font-medium">
          {comments?.length ?? 0}
        </span>
      </div>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="¿Qué opinas sobre esta receta o qué modificaciones hiciste?"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={addComment.isPending}
            className="min-h-[100px] resize-y"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={addComment.isPending || !newComment.trim()}
              className="cursor-pointer"
            >
              {addComment.isPending ? "Publicando..." : "Publicar Comentario"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border bg-muted/50 p-6 text-center text-muted-foreground">
          Inicia sesión para dejar un comentario.
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando comentarios...
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border">
                    {comment.user.image ? (
                      <img
                        src={comment.user.image}
                        alt={comment.user.name ?? "User avatar"}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {comment.user.name ?? "Usuario anónimo"}
                      </p>
                      <time
                        dateTime={comment.createdAt.toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {formatDistanceToNow(comment.createdAt, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </time>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card/50">
            Aún no hay comentarios. {isLoggedIn && "¡Sé el primero en opinar!"}
          </div>
        )}
      </div>
    </div>
  );
}

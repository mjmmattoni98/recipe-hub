"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initialsOf } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";

type Comment = RouterOutputs["comment"]["getCommentsByRecipeId"][number];

function CommentCard({
  comment,
  isOwnComment,
  recipeId,
}: Readonly<{
  comment: Comment;
  isOwnComment: boolean;
  recipeId: string;
}>) {
  const utils = api.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateComment = api.comment.updateComment.useMutation({
    onSuccess: () => {
      toast.success("Comentario actualizado");
      setIsEditing(false);
      utils.comment.getCommentsByRecipeId.invalidate({ recipeId });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteComment = api.comment.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("Comentario eliminado");
      setIsDeleteDialogOpen(false);
      utils.comment.getCommentsByRecipeId.invalidate({ recipeId });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <li className="border-b py-6 first:pt-2">
      <div className="flex items-start gap-4">
        <Avatar className="size-9">
          {comment.user.image ? (
            <AvatarImage
              src={comment.user.image}
              alt={comment.user.name ?? "User avatar"}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-accent text-accent-foreground font-mono text-xs font-semibold">
            {initialsOf(comment.user.name ?? "") || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {comment.user.name ?? "Usuario anónimo"}
            </p>
            <div className="flex items-center gap-3">
              <time
                dateTime={comment.createdAt.toISOString()}
                className="eyebrow text-muted-foreground"
              >
                {formatDistanceToNow(comment.createdAt, {
                  addSuffix: true,
                  locale: es,
                })}
              </time>
              {isOwnComment && !isEditing ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-7"
                    aria-label="Editar comentario"
                    onClick={() => {
                      setEditContent(comment.content);
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive size-7"
                        aria-label="Eliminar comentario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar comentario</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará el comentario de forma
                          permanente. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteComment.isPending}>
                          Cancelar
                        </AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            deleteComment.mutate({ id: comment.id })
                          }
                          disabled={deleteComment.isPending}
                        >
                          {deleteComment.isPending ? "Eliminando…" : "Eliminar"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2 pt-1">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={updateComment.isPending}
                className="min-h-[80px] resize-y"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setIsEditing(false)}
                  disabled={updateComment.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  disabled={updateComment.isPending || !editContent.trim()}
                  onClick={() =>
                    updateComment.mutate({
                      id: comment.id,
                      content: editContent.trim(),
                    })
                  }
                >
                  {updateComment.isPending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommentsSection({
  recipeId,
  isLoggedIn,
  currentUserId,
}: {
  recipeId: string;
  isLoggedIn: boolean;
  currentUserId?: string;
}) {
  const [newComment, setNewComment] = useState("");
  const utils = api.useUtils();

  const { data: comments, isLoading } =
    api.comment.getCommentsByRecipeId.useQuery({
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
    <section id="comments" aria-labelledby="comments-heading">
      <div className="flex items-baseline justify-between gap-4 border-b pb-4">
        <h2
          id="comments-heading"
          className="font-display text-foreground text-4xl tracking-tight md:text-5xl"
        >
          Comentarios
        </h2>
        <p className="eyebrow text-muted-foreground">
          {comments?.length ?? 0}{" "}
          {comments?.length === 1 ? "comentario" : "comentarios"}
        </p>
      </div>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="new-comment" className="sr-only">
            Tu comentario
          </label>
          <Textarea
            id="new-comment"
            placeholder="¿Qué tal salió? ¿Cambiaste algo?"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={addComment.isPending}
            className="min-h-24 resize-y"
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="submit"
              disabled={addComment.isPending || !newComment.trim()}
            >
              {addComment.isPending ? "Publicando…" : "Publicar comentario"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground mt-6 text-sm">
          <Link
            href="/sign-in"
            className="text-foreground underline underline-offset-4"
          >
            Inicia sesión
          </Link>{" "}
          para dejar un comentario.
        </p>
      )}

      {isLoading ? (
        <div className="mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex gap-4 border-b py-6">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <ul className="mt-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isOwnComment={comment.userId === currentUserId}
              recipeId={recipeId}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-6 text-sm">
          Aún no hay comentarios.{" "}
          {isLoggedIn ? "¡Sé el primero en contar qué tal salió!" : null}
        </p>
      )}
    </section>
  );
}

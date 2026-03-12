"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User } from "lucide-react";

export function FamilyPageClient({ currentUserId }: { currentUserId: string }) {
  const [newFamilyName, setNewFamilyName] = useState("");
  
  const utils = api.useUtils();
  const { data: families, isLoading } = api.family.getMyFamilies.useQuery();
  const { data: users } = api.family.getAllUsers.useQuery();

  const createFamily = api.family.createFamily.useMutation({
    onSuccess: () => {
      toast.success("Familia creada exitosamente");
      setNewFamilyName("");
      utils.family.getMyFamilies.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const addMember = api.family.addMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro agregado exitosamente");
      utils.family.getMyFamilies.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    createFamily.mutate({ name: newFamilyName });
  };

  const handleAddMember = (familyId: string, userId: string) => {
    if (!userId) return;
    addMember.mutate({ familyId, userId });
  };

  if (isLoading) {
    return <div>Cargando familias...</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Familia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFamily} className="flex flex-col gap-4">
              <Input
                placeholder="Nombre de la familia..."
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                disabled={createFamily.isPending}
              />
              <Button type="submit" disabled={createFamily.isPending || !newFamilyName.trim()}>
                {createFamily.isPending ? "Creando..." : "Crear Familia"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {families?.map((family) => {
          const isAdmin = family.members.some((m) => m.userId === currentUserId && m.role === "ADMIN");
          const availableUsers = users?.filter(
            (u) => !family.members.some((m) => m.userId === u.id)
          );

          return (
            <Card key={family.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{family.name}</span>
                  <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    {family.members.length} {family.members.length === 1 ? 'miembro' : 'miembros'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {family.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 border p-3 rounded-lg bg-card">
                      <div className="bg-muted p-2 rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                          {member.role === "ADMIN" ? "Administrador" : "Miembro"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && availableUsers && availableUsers.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Agregar nuevo miembro</p>
                    <div className="flex gap-2">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id={`user-select-${family.id}`}
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar usuario...</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email}
                          </option>
                        ))}
                      </select>
                      <Button 
                        disabled={addMember.isPending}
                        onClick={() => {
                          const select = document.getElementById(`user-select-${family.id}`) as HTMLSelectElement;
                          handleAddMember(family.id, select.value);
                          select.value = "";
                        }}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {families?.length === 0 && (
          <div className="text-center p-12 border rounded-xl bg-muted/30 text-muted-foreground">
            Aún no perteneces a ninguna familia. Crea una para comenzar.
          </div>
        )}
      </div>
    </div>
  );
}

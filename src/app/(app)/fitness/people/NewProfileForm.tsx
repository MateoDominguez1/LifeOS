"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManagedProfile } from "./actions";

export function NewProfileForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createManagedProfile({ name, relationship: relationship || undefined });
        setName("");
        setRelationship("");
        router.refresh();
      } catch {
        setError("No pudimos crear el perfil.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        required
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
      />
      <input
        type="text"
        placeholder="Relación (ej: Novia)"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
      />
      <button type="submit" disabled={isPending} className="rounded-lg bg-fitness px-4 py-2 font-display text-sm font-medium text-white disabled:opacity-60">
        {isPending ? "Creando..." : "Agregar"}
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </form>
  );
}

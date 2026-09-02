"use client";

import { useActionState, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createApiTokenAction,
  deleteApiTokenAction,
  type CreateApiTokenState,
} from "@/app/(app)/money/settings/actions";

export type ApiTokenData = { id: string; name: string; lastUsedAt: string | null };

const initialState: CreateApiTokenState = undefined;

export function ApiTokensCard({ tokens }: { tokens: ApiTokenData[] }) {
  const [state, formAction, pending] = useActionState(createApiTokenAction, initialState);
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    if (!state?.createdToken) return;
    try {
      await navigator.clipboard.writeText(state.createdToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sin acceso al portapapeles — el usuario puede copiar a mano
    }
  }

  return (
    <Card>
      <CardLabel>Tokens de API</CardLabel>
      <p className="mt-1 text-sm text-ink-soft">
        Para automatizaciones externas (ej. un Atajo de iOS) que registran gastos sin abrir la app.
      </p>

      {tokens.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">Todavía no creaste ningún token.</p>
      ) : (
        <div className="mt-4 flex flex-col divide-y divide-border-soft">
          {tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{token.name}</p>
                <p className="text-xs text-ink-faint">
                  {token.lastUsedAt
                    ? `Usado por última vez el ${new Date(token.lastUsedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`
                    : "Nunca usado"}
                </p>
              </div>
              <form action={deleteApiTokenAction.bind(null, token.id)}>
                <button type="submit" className="shrink-0 text-xs font-medium text-danger">
                  Revocar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {state?.createdToken && (
        <div className="mt-4 rounded-xl bg-warn-soft p-3">
          <p className="text-sm font-medium text-warn">Token creado — copialo ahora</p>
          <p className="mt-1 text-xs text-ink-soft">No vas a poder verlo de nuevo.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-surface px-2 py-1.5 text-xs">
              {state.createdToken.token}
            </code>
            <Button type="button" variant="secondary" onClick={copyToken} className="shrink-0">
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      )}

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border-soft pt-4">
        <div className="min-w-[160px] flex-1">
          <Input name="name" required placeholder="Ej. Atajo iPhone" />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Creando…" : "Crear token"}
        </Button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </Card>
  );
}

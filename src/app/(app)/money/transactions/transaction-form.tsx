"use client";

import { useActionState, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/money/format";
import { extractAmountFromOcrText } from "@/lib/money/receipts/extractAmountFromOcrText";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function TransactionForm({
  action,
  accounts,
  categories,
  defaults,
  transactionId,
  hasExistingReceipt = false,
  submitLabel = "Guardar movimiento",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
  defaults?: {
    type: "EXPENSE" | "INCOME";
    amount: number;
    description: string;
    categoryId: string;
    accountId: string;
    date: string;
    note: string;
  };
  /** Id del movimiento, solo en modo edición: para mostrar la foto ya cargada. */
  transactionId?: string;
  hasExistingReceipt?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<"EXPENSE" | "INCOME">(defaults?.type ?? "EXPENSE");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "detected">("idle");
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  function handleReceiptChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setReceiptPreview(null);
      return;
    }
    setRemoveReceipt(false);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);

    setOcrStatus("processing");
    setDetectedAmount(null);
    runOcrOnReceipt(file);
  }

  async function runOcrOnReceipt(file: File) {
    try {
      const { runReceiptOcr } = await import("@/lib/money/receipts/runReceiptOcr");
      const text = await runReceiptOcr(file);
      const amount = extractAmountFromOcrText(text);
      if (amount === null) {
        setOcrStatus("idle");
        return;
      }
      setDetectedAmount(amount);
      setOcrStatus("detected");
      if (amountInputRef.current && !amountInputRef.current.value) {
        amountInputRef.current.value = amount.toFixed(2);
      }
    } catch {
      // El OCR es solo una ayuda: si falla, el usuario sigue pudiendo cargar
      // el monto a mano sin que se rompa el formulario.
      setOcrStatus("idle");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 rounded-xl border py-2.5 font-display text-sm font-medium transition-colors",
              type === t
                ? t === "EXPENSE"
                  ? "border-fitness bg-fitness-soft text-fitness"
                  : "border-money bg-money-soft text-money"
                : "border-border text-ink-soft"
            )}
          >
            {t === "EXPENSE" ? "Gasto" : "Ingreso"}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          required
          placeholder="Ej. Supermercado"
          defaultValue={defaults?.description}
        />
      </div>
      <div>
        <Label htmlFor="amount">Monto</Label>
        <Input
          ref={amountInputRef}
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaults?.amount}
        />
      </div>
      <div>
        <Label htmlFor="accountId">Cuenta</Label>
        <Select id="accountId" name="accountId" required defaultValue={defaults?.accountId ?? ""}>
          <option value="" disabled>
            Elegí una cuenta
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      {type === "EXPENSE" && (
        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <Select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId ?? ""}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input id="note" name="note" defaultValue={defaults?.note} />
      </div>

      <div>
        <Label htmlFor="receipt">Foto del comprobante (opcional)</Label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/*"
          onChange={handleReceiptChange}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
        {ocrStatus === "processing" && <p className="mt-1 text-xs text-ink-faint">Leyendo el comprobante…</p>}
        {ocrStatus === "detected" && detectedAmount !== null && (
          <p className="mt-1 text-xs text-money">Detecté un total de {formatCurrency(detectedAmount)}</p>
        )}
        {receiptPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receiptPreview} alt="Vista previa del comprobante" className="mt-2 h-32 w-full rounded-xl border border-border object-cover" />
        ) : (
          hasExistingReceipt &&
          transactionId &&
          !removeReceipt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/receipts/${transactionId}`}
              alt="Comprobante actual"
              className="mt-2 h-32 w-full rounded-xl border border-border object-cover"
            />
          )
        )}
      </div>

      {hasExistingReceipt && (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="removeReceipt"
            checked={removeReceipt}
            onChange={(event) => setRemoveReceipt(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Quitar foto actual
        </label>
      )}

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}

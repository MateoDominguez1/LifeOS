"use client";

import { useActionState, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/money/format";
import { extractAmountFromOcrText } from "@/lib/money/receipts/extractAmountFromOcrText";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function TransactionForm({
  action,
  accounts,
  categories,
  defaults,
  transactionId,
  hasExistingReceipt = false,
  submitLabel,
  t,
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
  t: Dictionary;
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
        {(["EXPENSE", "INCOME"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={cn(
              "flex-1 rounded-xl border py-2.5 font-display text-sm font-medium transition-colors",
              type === option
                ? option === "EXPENSE"
                  ? "border-fitness bg-fitness-soft text-fitness"
                  : "border-money bg-money-soft text-money"
                : "border-border text-ink-soft"
            )}
          >
            {option === "EXPENSE" ? t.money.transactions.typeExpense : t.money.transactions.typeIncome}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div>
        <Label htmlFor="description">{t.money.transactions.descriptionLabel}</Label>
        <Input
          id="description"
          name="description"
          required
          placeholder={t.money.transactions.descriptionPlaceholder}
          defaultValue={defaults?.description}
        />
      </div>
      <div>
        <Label htmlFor="amount">{t.money.common.amount}</Label>
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
        <Label htmlFor="accountId">{t.money.common.account}</Label>
        <Select id="accountId" name="accountId" required defaultValue={defaults?.accountId ?? ""}>
          <option value="" disabled>
            {t.money.common.chooseAccount}
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
          <Label htmlFor="categoryId">{t.money.common.category}</Label>
          <Select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId ?? ""}>
            <option value="">{t.money.common.noCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="date">{t.money.common.date}</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      <div>
        <Label htmlFor="note">{t.money.common.noteOptional}</Label>
        <Input id="note" name="note" defaultValue={defaults?.note} />
      </div>

      <div>
        <Label htmlFor="receipt">{t.money.transactions.receiptLabel}</Label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/*"
          onChange={handleReceiptChange}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
        {ocrStatus === "processing" && <p className="mt-1 text-xs text-ink-faint">{t.money.transactions.receiptReading}</p>}
        {ocrStatus === "detected" && detectedAmount !== null && (
          <p className="mt-1 text-xs text-money">
            {t.money.transactions.receiptDetectedPrefix} {formatCurrency(detectedAmount)}
          </p>
        )}
        {receiptPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receiptPreview} alt={t.money.transactions.receiptPreviewAlt} className="mt-2 h-32 w-full rounded-xl border border-border object-cover" />
        ) : (
          hasExistingReceipt &&
          transactionId &&
          !removeReceipt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/receipts/${transactionId}`}
              alt={t.money.transactions.receiptCurrentAlt}
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
          {t.money.transactions.removeCurrentReceipt}
        </label>
      )}

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.common.saving : (submitLabel ?? t.money.transactions.createSubmit)}
      </Button>
    </form>
  );
}

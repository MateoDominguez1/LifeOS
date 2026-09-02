import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ImportantDateForm } from "../important-date-form";
import { createImportantDateAction } from "../actions";

export default function NewImportantDatePage() {
  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/money/important-dates"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Fechas importantes
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Nueva fecha importante</h1>
        <ImportantDateForm action={createImportantDateAction} />
      </Card>
    </div>
  );
}

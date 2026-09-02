import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { ImportantDateForm } from "../../important-date-form";
import { updateImportantDateAction } from "../../actions";

export default async function EditImportantDatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const date = await prisma.importantDate.findFirst({ where: { id, userId } });
  if (!date) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/money/important-dates"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Fechas importantes
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Editar fecha importante</h1>
        <ImportantDateForm
          action={updateImportantDateAction.bind(null, date.id)}
          defaults={{
            personName: date.personName,
            relationship: date.relationship ?? "",
            type: date.type,
            date: date.date.toISOString().slice(0, 10),
            note: date.note ?? "",
            reminderDaysBefore: date.reminderDaysBefore,
            isActive: date.isActive,
          }}
          submitLabel="Guardar cambios"
        />
      </Card>
    </div>
  );
}

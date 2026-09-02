import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    select: { receiptData: true, receiptMimeType: true, receiptFileName: true },
  });

  if (!transaction?.receiptData || !transaction.receiptMimeType) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  return new NextResponse(new Uint8Array(transaction.receiptData), {
    headers: {
      "Content-Type": transaction.receiptMimeType,
      "Content-Disposition": `inline; filename="${transaction.receiptFileName ?? "comprobante"}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

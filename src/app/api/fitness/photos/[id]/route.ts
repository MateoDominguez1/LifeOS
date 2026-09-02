import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { storage } from "@/lib/fitness/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.progressPhoto.findUnique({ where: { id } });
  if (!photo) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (photo.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const file = await storage.read(photo.storageKey);
  if (!file) {
    return new NextResponse("File missing", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, max-age=3600" },
  });
}

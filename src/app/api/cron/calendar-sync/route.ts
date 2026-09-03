import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { syncAllImportantDates } from "@/lib/calendar/importantDateSync";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const connections = await prisma.calendarConnection.findMany({ select: { userId: true } });

  let synced = 0;
  for (const connection of connections) {
    await syncAllImportantDates(connection.userId);
    synced += 1;
  }

  return NextResponse.json({ ok: true, usersSynced: synced });
}

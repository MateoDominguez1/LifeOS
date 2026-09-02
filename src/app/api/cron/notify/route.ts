import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserAlerts } from "@/lib/money/getUserAlerts";
import { sendPushToUser } from "@/lib/money/push";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const today = new Date();
  const usersWithSubscriptions = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    select: { id: true },
  });

  let notified = 0;

  for (const user of usersWithSubscriptions) {
    const alerts = await getUserAlerts(user.id, today);
    // No mandamos push por el mensaje de "vas bien": eso es para mirar en la
    // app, no para interrumpir con una notificación todos los días.
    const actionable = alerts.filter((alert) => alert.tone !== "success");

    for (const alert of actionable) {
      await sendPushToUser(user.id, {
        title: "LifeOS · Money",
        body: alert.message,
        url: "/money",
      });
      notified += 1;
    }
  }

  return NextResponse.json({ ok: true, usersChecked: usersWithSubscriptions.length, notificationsSent: notified });
}

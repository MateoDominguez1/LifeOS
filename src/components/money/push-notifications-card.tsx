"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deletePushSubscriptionAction, savePushSubscriptionAction } from "@/app/(app)/money/settings/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied";

export function PushNotificationsCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      setStatus(subscription ? "subscribed" : "unsubscribed");
    }
    checkStatus();
  }, []);

  async function subscribe() {
    setError(null);
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Falta configurar la clave VAPID");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("La suscripción no devolvió los datos esperados");
      }
      await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar las notificaciones");
      setStatus("unsubscribed");
    }
  }

  async function unsubscribe() {
    setError(null);
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar las notificaciones");
      setStatus("subscribed");
    }
  }

  return (
    <Card>
      <CardLabel>Notificaciones push</CardLabel>
      <p className="mt-1 text-sm text-ink-soft">
        Recibí un aviso cuando se acerque un pago o algo necesite tu atención.
      </p>

      <div className="mt-4">
        {status === "unsupported" && <p className="text-sm text-ink-soft">Tu navegador no soporta notificaciones push.</p>}
        {status === "denied" && (
          <p className="text-sm text-ink-soft">
            Bloqueaste las notificaciones para este sitio. Habilitalas desde la configuración del navegador.
          </p>
        )}
        {status === "loading" && <p className="text-sm text-ink-soft">Cargando…</p>}
        {status === "unsubscribed" && (
          <Button type="button" onClick={subscribe} className="gap-1.5">
            <Bell size={16} /> Activar notificaciones
          </Button>
        )}
        {status === "subscribed" && (
          <Button type="button" variant="secondary" onClick={unsubscribe} className="gap-1.5">
            <BellOff size={16} /> Desactivar notificaciones
          </Button>
        )}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    </Card>
  );
}

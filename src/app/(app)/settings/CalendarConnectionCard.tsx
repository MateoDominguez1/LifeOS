"use client";

import { useActionState, useTransition } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n";
import { connectCalendarAction, disconnectCalendarAction, type CalendarConnectState } from "./actions";

type Connection = {
  appleIdEmail: string;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
};

const initialState: CalendarConnectState = undefined;

export function CalendarConnectionCard({ t, connection }: { t: Dictionary["settings"]; connection: Connection | null }) {
  const [state, formAction, pending] = useActionState(connectCalendarAction, initialState);
  const [isDisconnecting, startDisconnect] = useTransition();

  return (
    <Card>
      <CardLabel>{t.calendarTitle}</CardLabel>
      <p className="mt-1 text-sm text-ink-soft">{t.calendarDescription}</p>

      {connection ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-ink-soft">
              {t.calendarConnectedAs} <span className="text-ink">{connection.appleIdEmail}</span>
            </span>
            <span className="text-ink-soft">
              {t.calendarLastSynced}{" "}
              <span className="text-ink">
                {connection.lastSyncedAt ? connection.lastSyncedAt.toLocaleString() : t.calendarNeverSynced}
              </span>
            </span>
            {connection.lastSyncError && (
              <span className="text-danger">
                {t.calendarSyncError}: {connection.lastSyncError}
              </span>
            )}
          </div>
          <form
            action={() => startDisconnect(async () => await disconnectCalendarAction())}
          >
            <Button type="submit" variant="secondary" disabled={isDisconnecting}>
              {isDisconnecting ? t.calendarDisconnecting : t.calendarDisconnect}
            </Button>
          </form>
        </div>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="email">{t.calendarEmailLabel}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="appSpecificPassword">{t.calendarPasswordLabel}</Label>
            <Input id="appSpecificPassword" name="appSpecificPassword" type="password" required autoComplete="off" />
            <p className="mt-1 text-xs text-ink-faint">{t.calendarPasswordHint}</p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? t.calendarConnecting : t.calendarConnect}
          </Button>
        </form>
      )}
    </Card>
  );
}

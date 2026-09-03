"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n";

const initialState: RegisterState = {};

export function RegisterForm({ t }: { t: Dictionary["auth"] }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <Card className="p-6">
      <h1 className="mb-1 font-display text-xl font-bold">{t.registerHeading}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t.registerSubtitle}</p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">{t.name}</Label>
          <Input id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">{t.email}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">{t.password}</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? t.registerButtonPending : t.registerButton}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        {t.hasAccount}{" "}
        <Link href="/login" className="font-medium text-accent-ink hover:underline">
          {t.loginLink}
        </Link>
      </p>
    </Card>
  );
}

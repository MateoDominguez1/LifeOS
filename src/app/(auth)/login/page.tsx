"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="p-6">
      <h1 className="mb-1 font-display text-xl font-bold">Bienvenido de nuevo</h1>
      <p className="mb-6 text-sm text-ink-soft">Iniciá sesión en tu cuenta LifeOS.</p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-accent-ink hover:underline">
          Crear cuenta
        </Link>
      </p>
    </Card>
  );
}

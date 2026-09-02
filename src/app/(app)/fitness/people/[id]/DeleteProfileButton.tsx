"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteManagedProfile } from "../actions";

export function DeleteProfileButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteManagedProfile(id);
          router.push("/fitness/people");
          router.refresh();
        })
      }
      className="text-sm text-danger hover:underline"
    >
      Eliminar
    </button>
  );
}

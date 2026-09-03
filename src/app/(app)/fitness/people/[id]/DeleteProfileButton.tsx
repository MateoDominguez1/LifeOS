"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { deleteManagedProfile } from "../actions";

export function DeleteProfileButton({ id, t }: { id: string; t: Dictionary }) {
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
      {t.common.delete}
    </button>
  );
}

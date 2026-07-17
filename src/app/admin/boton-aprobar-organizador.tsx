"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aprobarOrganizador } from "./actions";

export function BotonAprobarOrganizador({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function manejarClic() {
    setError(null);
    startTransition(async () => {
      try {
        await aprobarOrganizador(userId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo aprobar la cuenta.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" size="sm" onClick={manejarClic} disabled={isPending}>
        <CheckCircle2 className="size-4" />
        {isPending ? "Aprobando..." : "Aprobar organizador"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alternarActivo } from "./actions";

export function BotonAlternarActivo({
  userId,
  activo,
}: {
  userId: string;
  activo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function manejarClic() {
    const mensaje = activo
      ? "¿Suspender esta cuenta? No podrá iniciar sesión hasta que la reactives."
      : "¿Reactivar esta cuenta?";
    if (!window.confirm(mensaje)) return;

    setError(null);
    startTransition(async () => {
      try {
        await alternarActivo(userId, !activo);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la cuenta.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={manejarClic}
        disabled={isPending}
        className={activo ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}
      >
        {activo ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
        {activo ? "Suspender" : "Reactivar"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

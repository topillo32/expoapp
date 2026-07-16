"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eliminarCuenta } from "./actions";

export function BotonEliminarCuenta({ cuentaId }: { cuentaId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function manejarClic() {
    const confirmado = window.confirm("¿Seguro que quieres borrar esta cuenta?");
    if (!confirmado) return;

    setError(null);
    startTransition(async () => {
      try {
        await eliminarCuenta(cuentaId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo borrar la cuenta.");
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
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
        Borrar
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

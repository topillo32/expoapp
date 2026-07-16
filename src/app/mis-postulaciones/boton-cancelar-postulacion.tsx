"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelarPostulacion } from "./actions";

export function BotonCancelarPostulacion({ puestoId }: { puestoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function manejarClic() {
    const confirmado = window.confirm("¿Seguro que quieres cancelar esta postulación?");
    if (!confirmado) return;

    setError(null);
    startTransition(async () => {
      try {
        await cancelarPostulacion(puestoId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cancelar la postulación.");
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
        <XCircle className="size-4" />
        {isPending ? "Cancelando..." : "Cancelar postulación"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

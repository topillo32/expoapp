"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetearPassword } from "./actions";

export function BotonResetearPassword({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [passwordNueva, setPasswordNueva] = useState<string | null>(null);

  function manejarClic() {
    const confirmado = window.confirm(
      "¿Generar una contraseña nueva para esta cuenta? La contraseña anterior dejará de funcionar.",
    );
    if (!confirmado) return;

    setError(null);
    startTransition(async () => {
      const resultado = await resetearPassword(userId);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      setPasswordNueva(resultado.password ?? null);
    });
  }

  if (passwordNueva) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-2 text-xs">
        <p className="font-medium text-foreground">Contraseña nueva:</p>
        <p className="mt-1 select-all break-all font-mono text-foreground">{passwordNueva}</p>
        <p className="mt-1 text-muted-foreground">
          Entrégasela al usuario ahora — no se vuelve a mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" onClick={manejarClic} disabled={isPending}>
        <KeyRound className="size-4" />
        {isPending ? "Generando..." : "Resetear contraseña"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

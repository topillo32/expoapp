"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cambiarPassword, type EstadoCambiarPassword } from "./actions";

const estadoInicial: EstadoCambiarPassword = {};

export function CambiarPasswordForm() {
  const [estado, formAction, enviando] = useActionState(cambiarPassword, estadoInicial);

  if (estado.ok) {
    return (
      <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
        Contraseña actualizada.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nueva">Contraseña nueva</Label>
        <Input id="nueva" name="nueva" type="password" minLength={6} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmar">Confirmar contraseña</Label>
        <Input id="confirmar" name="confirmar" type="password" minLength={6} required />
      </div>

      {estado.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" className="shadow-lg shadow-primary/25" disabled={enviando}>
        {enviando ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}

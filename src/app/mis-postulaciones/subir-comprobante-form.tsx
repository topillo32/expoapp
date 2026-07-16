"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subirComprobantePosterior, type EstadoSubirComprobante } from "./actions";

const estadoInicial: EstadoSubirComprobante = {};

export function SubirComprobanteForm({ puestoId }: { puestoId: string }) {
  const accion = subirComprobantePosterior.bind(null, puestoId);
  const [estado, formAction, enviando] = useActionState(accion, estadoInicial);

  if (estado.ok) {
    return (
      <p className="rounded-md bg-success/10 p-2 text-xs text-success">
        Comprobante subido. El organizador va a confirmar tu pago.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="comprobante"
        accept="image/*"
        required
        className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:text-primary"
      />
      <Button type="submit" size="sm" disabled={enviando}>
        <Upload className="size-3.5" />
        {enviando ? "Subiendo..." : "Subir comprobante"}
      </Button>
      {estado.error && <p className="w-full text-xs text-destructive">{estado.error}</p>}
    </form>
  );
}

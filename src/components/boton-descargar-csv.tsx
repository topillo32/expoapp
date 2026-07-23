"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BotonDescargarCsv({
  accion,
  nombreArchivo,
}: {
  accion: () => Promise<string>;
  nombreArchivo: string;
}) {
  const [pendiente, startTransition] = useTransition();

  function descargar() {
    startTransition(async () => {
      const csv = await accion();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo;
      enlace.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Button type="button" variant="outline" onClick={descargar} disabled={pendiente}>
      <Download className="size-4" />
      {pendiente ? "Generando..." : "Exportar CSV"}
    </Button>
  );
}

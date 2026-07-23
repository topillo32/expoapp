"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS = [
  { valor: "emprendedor", etiqueta: "Emprendedores" },
  { valor: "comida", etiqueta: "Comida" },
  { valor: "merchandising", etiqueta: "Merchandising" },
] as const;

export function FiltrosEventos({
  comunas,
  comunaSeleccionada,
  tipoSeleccionado,
}: {
  comunas: string[];
  comunaSeleccionada: string | null;
  tipoSeleccionado: string | null;
}) {
  const router = useRouter();

  function actualizarFiltro(clave: "comuna" | "tipo", valor: string | null) {
    const params = new URLSearchParams(window.location.search);
    if (valor) {
      params.set(clave, valor);
    } else {
      params.delete(clave);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  const hayFiltros = Boolean(comunaSeleccionada || tipoSeleccionado);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <Select
        items={comunas.map((c) => ({ label: c, value: c }))}
        value={comunaSeleccionada}
        onValueChange={(v) =>
          actualizarFiltro("comuna", typeof v === "string" ? v : null)
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Comuna" />
        </SelectTrigger>
        <SelectContent>
          {comunas.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={TIPOS.map((t) => ({ label: t.etiqueta, value: t.valor }))}
        value={tipoSeleccionado}
        onValueChange={(v) =>
          actualizarFiltro("tipo", typeof v === "string" ? v : null)
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Tipo de puesto" />
        </SelectTrigger>
        <SelectContent>
          {TIPOS.map((t) => (
            <SelectItem key={t.valor} value={t.valor}>
              {t.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hayFiltros && (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
          Quitar filtros
        </button>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronDownIcon, X, XIcon } from "lucide-react";
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
      <Combobox.Root
        items={comunas}
        value={comunaSeleccionada}
        onValueChange={(v) =>
          actualizarFiltro("comuna", typeof v === "string" ? v : null)
        }
        limit={8}
      >
        <Combobox.InputGroup className="relative flex h-8 w-44 items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
          <Combobox.Input
            placeholder="Comuna"
            className="h-full w-full min-w-0 rounded-lg border-0 bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
          <Combobox.Clear
            className="flex h-full shrink-0 items-center justify-center px-1 text-muted-foreground hover:text-foreground"
            aria-label="Quitar filtro de comuna"
          >
            <XIcon className="size-3.5" />
          </Combobox.Clear>
          <Combobox.Trigger
            className="flex h-full shrink-0 items-center justify-center px-2 text-muted-foreground"
            aria-label="Mostrar comunas"
          >
            <ChevronDownIcon className="size-4" />
          </Combobox.Trigger>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner className="isolate z-50 outline-none" sideOffset={4}>
            <Combobox.Popup className="max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <Combobox.Empty className="px-2.5 py-2 text-sm text-muted-foreground">
                No hay eventos en esa comuna.
              </Combobox.Empty>
              <Combobox.List className="max-h-64 overflow-y-auto p-1">
                {(comuna: string) => (
                  <Combobox.Item
                    key={comuna}
                    value={comuna}
                    className="flex w-full cursor-default items-center rounded-md px-2.5 py-1 text-sm outline-hidden select-none data-highlighted:bg-muted"
                  >
                    {comuna}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

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

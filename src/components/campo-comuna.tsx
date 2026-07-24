"use client";

import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { COMUNAS_CHILE } from "@/lib/comunas-chile";
import { cn } from "@/lib/utils";

export function CampoComuna({
  id,
  name,
  defaultValue,
  required,
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Combobox.Root
      items={COMUNAS_CHILE}
      name={name}
      defaultValue={defaultValue || null}
      required={required}
      limit={8}
    >
      <Combobox.InputGroup
        className={cn(
          "relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className,
        )}
      >
        <Combobox.Input
          id={id}
          placeholder="Escribe para buscar..."
          className="h-full w-full min-w-0 rounded-lg border-0 bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
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
              No se encontró esa comuna.
            </Combobox.Empty>
            <Combobox.List className="max-h-64 overflow-y-auto p-1">
              {(comuna: string) => (
                <Combobox.Item
                  key={comuna}
                  value={comuna}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-muted"
                >
                  {comuna}
                  <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

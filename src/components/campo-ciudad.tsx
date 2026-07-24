"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { COMUNAS_CHILE } from "@/lib/comunas-chile";
import { cn } from "@/lib/utils";

export function CampoCiudad({
  id,
  name,
  defaultValue,
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <Autocomplete.Root items={COMUNAS_CHILE} name={name} defaultValue={defaultValue} limit={8}>
      <Autocomplete.Input
        id={id}
        placeholder="Escribe la ciudad..."
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
          className,
        )}
      />

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="isolate z-50 outline-none" sideOffset={4}>
          <Autocomplete.Popup className="max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Autocomplete.Empty className="px-2.5 py-2 text-sm text-muted-foreground">
              Sin sugerencias — igual puedes usar lo que escribiste.
            </Autocomplete.Empty>
            <Autocomplete.List className="max-h-64 overflow-y-auto p-1">
              {(ciudad: string) => (
                <Autocomplete.Item
                  key={ciudad}
                  value={ciudad}
                  className="flex w-full cursor-default items-center rounded-md px-2.5 py-1 text-sm outline-hidden select-none data-highlighted:bg-muted"
                >
                  {ciudad}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ItemCerrarSesion() {
  const { pending } = useFormStatus();

  return (
    <DropdownMenuItem
      variant="destructive"
      nativeButton
      disabled={pending}
      render={<button type="submit" />}
    >
      <LogOut />
      {pending ? "Cerrando sesión..." : "Cerrar sesión"}
    </DropdownMenuItem>
  );
}

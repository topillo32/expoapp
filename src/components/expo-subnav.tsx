import Link from "next/link";
import { ClipboardList, MapPin, Pencil, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type SeccionExpo = "editar" | "postulaciones" | "plano" | "contabilidad";

const SECCIONES: { id: SeccionExpo; label: string; icono: React.ReactNode; ruta: string }[] = [
  { id: "editar", label: "Editar", icono: <Pencil className="size-4" />, ruta: "editar" },
  {
    id: "postulaciones",
    label: "Postulaciones",
    icono: <ClipboardList className="size-4" />,
    ruta: "postulaciones",
  },
  { id: "plano", label: "Plano", icono: <MapPin className="size-4" />, ruta: "plano" },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icono: <Wallet className="size-4" />,
    ruta: "contabilidad",
  },
];

export function ExpoSubNav({ expoId, activo }: { expoId: string; activo: SeccionExpo }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-1 border-b">
      {SECCIONES.map((seccion) => (
        <Link
          key={seccion.id}
          href={`/organizador/expos/${expoId}/${seccion.ruta}`}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            seccion.id === activo
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {seccion.icono}
          {seccion.label}
        </Link>
      ))}
    </nav>
  );
}

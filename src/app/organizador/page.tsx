import Link from "next/link";
import { CalendarDays, Landmark, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatearRangoFechas } from "@/lib/format";

interface ExpoPropia {
  id: string;
  nombre: string;
  estado: "borrador" | "publicada" | "finalizada";
  fechaInicio: string;
  fechaFin: string;
}

const etiquetaEstado: Record<ExpoPropia["estado"], string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  finalizada: "Finalizada",
};

export default async function OrganizadorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expos, error } = await supabase
    .from("expos")
    .select("id, nombre, estado, fechaInicio:fecha_inicio, fechaFin:fecha_fin")
    .eq("organizador_id", user!.id)
    .order("creado_en", { ascending: false })
    .returns<ExpoPropia[]>();

  if (error) {
    throw error;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Mis eventos</h1>
          <p className="mt-1 text-muted-foreground">
            Administra tus ferias, sus horarios y las postulaciones de puestos.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/organizador/cuentas"
            className={buttonVariants({ variant: "outline" })}
          >
            <Landmark className="size-4" />
            Cuentas de transferencia
          </Link>
          <Link href="/organizador/expos/nueva" className={buttonVariants({})}>
            <PlusCircle className="size-4" />
            Crear evento
          </Link>
        </div>
      </div>

      {expos.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no creaste ningún evento.{" "}
            <Link href="/organizador/expos/nueva" className="font-medium text-primary underline">
              Crea la primera
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {expos.map((expo) => (
            <Link key={expo.id} href={`/organizador/expos/${expo.id}/editar`} className="group block">
              <Card className="card-glow-hover h-full group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{expo.nombre}</CardTitle>
                    <Badge variant={expo.estado === "publicada" ? "default" : "secondary"}>
                      {etiquetaEstado[expo.estado]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {formatearRangoFechas(expo.fechaInicio, expo.fechaFin)}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

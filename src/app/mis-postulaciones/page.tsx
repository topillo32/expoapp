import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearPrecio } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const ETIQUETA_TIPO: Record<string, string> = {
  emprendedor: "Emprendedor",
  comida: "Comida",
  merchandising: "Merchandising",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

interface PostulacionPropia {
  id: string;
  tipo: string;
  esGratis: boolean;
  precio: number | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  motivoRechazo: string | null;
  fechaSolicitud: string;
  expo: { id: string; nombre: string } | null;
}

export default async function MisPostulacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/mis-postulaciones");
  }

  const { data: postulaciones, error } = await supabase
    .from("puestos")
    .select(
      `
      id,
      tipo,
      esGratis:es_gratis,
      precio,
      estado,
      motivoRechazo:motivo_rechazo,
      fechaSolicitud:fecha_solicitud,
      expo:expo_id(id, nombre)
      `,
    )
    .eq("emprendedor_id", user.id)
    .order("fecha_solicitud", { ascending: false })
    .returns<PostulacionPropia[]>();

  if (error) {
    throw error;
  }

  await supabase.rpc("marcar_postulaciones_vistas");

  const pendientes = (postulaciones ?? []).filter((p) => p.estado === "pendiente");
  const resueltas = (postulaciones ?? []).filter((p) => p.estado !== "pendiente");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Mis postulaciones
      </h1>
      <p className="mt-1 text-muted-foreground">
        El estado de todas tus solicitudes a puestos, en cualquier evento.
      </p>

      {(postulaciones ?? []).length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no te has postulado a ningún evento.
          </p>
          <Link href="/" className="mt-2 inline-block text-sm font-medium text-primary underline">
            Explorar eventos
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Pendientes ({pendientes.length})</h2>
            {pendientes.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No tienes postulaciones pendientes de revisión.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {pendientes.map((p) => (
                  <TarjetaPostulacion key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-medium">Resueltas ({resueltas.length})</h2>
            {resueltas.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Todavía no tienes postulaciones resueltas.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {resueltas.map((p) => (
                  <TarjetaPostulacion key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TarjetaPostulacion({ p }: { p: PostulacionPropia }) {
  const fecha = new Date(p.fechaSolicitud).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {p.expo ? (
              <Link href={`/expos/${p.expo.id}`} className="hover:underline">
                {p.expo.nombre}
              </Link>
            ) : (
              "Evento"
            )}{" "}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              · {ETIQUETA_TIPO[p.tipo] ?? p.tipo}
            </span>
          </CardTitle>
          <Badge
            variant={
              p.estado === "aprobado"
                ? "success"
                : p.estado === "rechazado"
                  ? "destructive"
                  : "warning"
            }
          >
            {ETIQUETA_ESTADO[p.estado]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Solicitado el {fecha}
        </p>
        <p className="font-medium">
          {p.esGratis ? <span className="text-success">Gratis</span> : formatearPrecio(p.precio ?? 0)}
        </p>
        {p.estado === "rechazado" && p.motivoRechazo && (
          <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            Motivo: {p.motivoRechazo}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

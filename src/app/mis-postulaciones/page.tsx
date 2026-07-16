import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearPrecio } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { EstadoPuesto } from "@/lib/types";
import { BotonCancelarPostulacion } from "./boton-cancelar-postulacion";
import { SubirComprobanteForm } from "./subir-comprobante-form";

const ETIQUETA_TIPO: Record<string, string> = {
  emprendedor: "Emprendedor",
  comida: "Comida",
  merchandising: "Merchandising",
};

const ETIQUETA_ESTADO: Record<EstadoPuesto, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado · falta pagar",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  cancelado: "Cancelada",
};

const ETIQUETA_TIPO_CUENTA: Record<string, string> = {
  corriente: "Cuenta corriente",
  vista: "Cuenta vista",
  ahorro: "Cuenta de ahorro",
  rut: "Cuenta RUT",
};

interface CuentaTransferenciaCruda {
  alias: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rutTitular: string;
  nombreTitular: string;
  emailContacto: string | null;
}

interface PostulacionPropia {
  id: string;
  tipo: string;
  nombreTienda: string;
  esGratis: boolean;
  precio: number | null;
  estado: EstadoPuesto;
  comprobantePagoUrl: string | null;
  motivoRechazo: string | null;
  fechaSolicitud: string;
  ubicacion: { etiqueta: string | null } | null;
  expo: {
    id: string;
    nombre: string;
    cuentaTransferencia: CuentaTransferenciaCruda | null;
  } | null;
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
      nombreTienda:nombre_tienda,
      esGratis:es_gratis,
      precio,
      estado,
      comprobantePagoUrl:comprobante_pago_url,
      motivoRechazo:motivo_rechazo,
      fechaSolicitud:fecha_solicitud,
      ubicacion:ubicacion_id(etiqueta),
      expo:expo_id(
        id,
        nombre,
        cuentaTransferencia:cuenta_transferencia_id(alias, banco, tipoCuenta:tipo_cuenta, numeroCuenta:numero_cuenta, rutTitular:rut_titular, nombreTitular:nombre_titular, emailContacto:email_contacto)
      )
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
  const esperandoPago = (postulaciones ?? []).filter((p) => p.estado === "aceptado");
  const resueltas = (postulaciones ?? []).filter(
    (p) => p.estado === "aprobado" || p.estado === "rechazado" || p.estado === "cancelado",
  );

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

          {esperandoPago.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-medium">
                Aceptadas · falta pagar ({esperandoPago.length})
              </h2>
              <div className="mt-4 space-y-3">
                {esperandoPago.map((p) => (
                  <TarjetaPostulacion key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

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
  const cuenta = p.expo?.cuentaTransferencia;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
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
            <p className="mt-0.5 text-sm text-muted-foreground">
              {p.nombreTienda}
              {p.ubicacion?.etiqueta && ` · Puesto ${p.ubicacion.etiqueta}`}
            </p>
          </div>
          <Badge
            variant={
              p.estado === "aprobado"
                ? "success"
                : p.estado === "rechazado"
                  ? "destructive"
                  : p.estado === "cancelado"
                    ? "outline"
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

        {p.estado === "aceptado" && cuenta && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Landmark className="size-3.5 text-primary" />
              Transfiere a esta cuenta
            </p>
            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <p>{cuenta.banco}</p>
              <p>{ETIQUETA_TIPO_CUENTA[cuenta.tipoCuenta] ?? cuenta.tipoCuenta}</p>
              <p>N° {cuenta.numeroCuenta}</p>
              <p>
                {cuenta.nombreTitular} · {cuenta.rutTitular}
              </p>
              {cuenta.emailContacto && <p>{cuenta.emailContacto}</p>}
            </div>
            {p.comprobantePagoUrl ? (
              <p className="text-xs text-muted-foreground">
                Ya subiste tu comprobante. Esperando confirmación del organizador.
              </p>
            ) : (
              <SubirComprobanteForm puestoId={p.id} />
            )}
          </div>
        )}

        {(p.estado === "pendiente" || p.estado === "aceptado") && (
          <div className="border-t pt-3">
            <BotonCancelarPostulacion puestoId={p.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

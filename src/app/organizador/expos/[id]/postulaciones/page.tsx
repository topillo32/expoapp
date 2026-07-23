import { notFound } from "next/navigation";
import { Car, CheckCircle2, Clock3, ThumbsUp, User, Wallet, XCircle, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TarjetaEstadistica } from "@/components/tarjeta-estadistica";
import { formatearPrecio } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETA_CATEGORIA, type CategoriaPuesto, type EstadoPuesto } from "@/lib/types";
import { aceptarPostulante, aprobarPuesto, rechazarPuesto } from "./actions";
import { ComprobanteLightbox } from "./comprobante-lightbox";

const ETIQUETA_TIPO: Record<string, string> = {
  emprendedor: "Emprendedor",
  comida: "Comida",
  merchandising: "Merchandising",
};

const ETIQUETA_ESTADO: Record<EstadoPuesto, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado · esperando pago",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  cancelado: "Cancelada por el postulante",
};

interface PostulacionCruda {
  id: string;
  tipo: string;
  esGratis: boolean;
  precio: number | null;
  rut: string;
  razonSocial: string;
  nombreTienda: string;
  categorias: CategoriaPuesto[];
  encargadoNombre: string;
  encargadoContacto: string;
  acompanantes: number;
  vieneEnAuto: boolean;
  necesitaLuz: boolean;
  estado: EstadoPuesto;
  comprobantePagoUrl: string | null;
  motivoRechazo: string | null;
  fechaSolicitud: string;
  emprendedor: { nombre: string; contacto: string | null } | null;
  ubicacion: { etiqueta: string | null } | null;
}

export default async function PostulacionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorQuery } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expo } = await supabase
    .from("expos")
    .select("id, nombre, requiereAceptacionPago:requiere_aceptacion_pago")
    .eq("id", id)
    .eq("organizador_id", user?.id ?? "")
    .maybeSingle<{ id: string; nombre: string; requiereAceptacionPago: boolean }>();

  if (!expo) {
    notFound();
  }

  const { data: postulaciones, error } = await supabase
    .from("puestos")
    .select(
      `
      id,
      tipo,
      esGratis:es_gratis,
      precio,
      rut,
      razonSocial:razon_social,
      nombreTienda:nombre_tienda,
      categorias,
      encargadoNombre:encargado_nombre,
      encargadoContacto:encargado_contacto,
      acompanantes,
      vieneEnAuto:viene_en_auto,
      necesitaLuz:necesita_luz,
      estado,
      comprobantePagoUrl:comprobante_pago_url,
      motivoRechazo:motivo_rechazo,
      fechaSolicitud:fecha_solicitud,
      emprendedor:emprendedor_id(nombre, contacto),
      ubicacion:ubicacion_id(etiqueta)
      `,
    )
    .eq("expo_id", id)
    .order("fecha_solicitud", { ascending: false })
    .returns<PostulacionCruda[]>();

  if (error) {
    throw error;
  }

  const conComprobante = await Promise.all(
    (postulaciones ?? []).map(async (p) => {
      if (!p.comprobantePagoUrl) {
        return { ...p, comprobanteSignedUrl: null as string | null };
      }
      const { data } = await supabase.storage
        .from("comprobantes")
        .createSignedUrl(p.comprobantePagoUrl, 3600);
      return { ...p, comprobanteSignedUrl: data?.signedUrl ?? null };
    }),
  );

  const pendientes = conComprobante.filter((p) => p.estado === "pendiente");
  const esperandoPago = conComprobante.filter((p) => p.estado === "aceptado");
  const resueltas = conComprobante.filter(
    (p) => p.estado === "aprobado" || p.estado === "rechazado" || p.estado === "cancelado",
  );
  const aprobadas = conComprobante.filter((p) => p.estado === "aprobado");

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: expo.nombre, href: `/organizador/expos/${expo.id}/editar` },
          { label: "Postulaciones" },
        ]}
      />
      <div>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Postulaciones a {expo.nombre}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Revisa, aprueba o rechaza las solicitudes de puestos.
        </p>
      </div>

      {errorQuery && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {decodeURIComponent(errorQuery)}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <TarjetaEstadistica
          icono={<Clock3 className="size-4 text-warning" />}
          titulo="Pendientes"
          valor={String(pendientes.length)}
          detalle="por revisar"
        />
        {expo.requiereAceptacionPago && (
          <TarjetaEstadistica
            icono={<Wallet className="size-4 text-muted-foreground" />}
            titulo="Esperando pago"
            valor={String(esperandoPago.length)}
            detalle="postulantes aceptados"
          />
        )}
        <TarjetaEstadistica
          icono={<ThumbsUp className="size-4 text-success" />}
          titulo="Aprobadas"
          valor={String(aprobadas.length)}
          detalle={`de ${conComprobante.length} solicitud(es)`}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium">
          Pendientes de revisión ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No hay postulaciones pendientes.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendientes.map((p) => (
              <TarjetaPostulacion
                key={p.id}
                p={p}
                expoId={expo.id}
                requiereAceptacionPago={expo.requiereAceptacionPago}
              />
            ))}
          </div>
        )}
      </section>

      {expo.requiereAceptacionPago && (
        <section className="mt-10">
          <h2 className="text-lg font-medium">Esperando pago ({esperandoPago.length})</h2>
          {esperandoPago.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No hay postulantes aceptados esperando pagar.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {esperandoPago.map((p) => (
                <TarjetaPostulacion
                  key={p.id}
                  p={p}
                  expoId={expo.id}
                  requiereAceptacionPago={expo.requiereAceptacionPago}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium">Resueltas ({resueltas.length})</h2>
        {resueltas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no resolviste ninguna postulación.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {resueltas.map((p) => (
              <TarjetaPostulacion
                key={p.id}
                p={p}
                expoId={expo.id}
                requiereAceptacionPago={expo.requiereAceptacionPago}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TarjetaPostulacion({
  p,
  expoId,
  requiereAceptacionPago,
}: {
  p: PostulacionCruda & { comprobanteSignedUrl: string | null };
  expoId: string;
  requiereAceptacionPago: boolean;
}) {
  const aceptarConIds = aceptarPostulante.bind(null, expoId, p.id);
  const aprobarConIds = aprobarPuesto.bind(null, expoId, p.id);
  const rechazarConIds = rechazarPuesto.bind(null, expoId, p.id);

  const necesitaAceptacionPrimero =
    requiereAceptacionPago && !p.esGratis && p.estado === "pendiente";
  const esperandoComprobante = p.estado === "aceptado" && !p.comprobanteSignedUrl;
  const puedeResolverDirecto = p.estado === "pendiente" || p.estado === "aceptado";
  const textoAprobar = p.esGratis ? "Aprobar" : "Confirmar pago";

  return (
    <Card className="card-glow-hover">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {p.nombreTienda}{" "}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              · {ETIQUETA_TIPO[p.tipo] ?? p.tipo}
              {p.ubicacion?.etiqueta ? ` · Puesto ${p.ubicacion.etiqueta}` : ""}
            </span>
          </CardTitle>
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
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <User className="size-3.5" />
            {p.emprendedor?.nombre ?? "—"}{" "}
            {p.emprendedor?.contacto ? `· ${p.emprendedor.contacto}` : ""}
          </p>
          <p className="text-muted-foreground">
            RUT {p.rut} · {p.razonSocial}
          </p>
          <p className="text-muted-foreground">
            Encargado: {p.encargadoNombre} ({p.encargadoContacto})
          </p>
          <p className="text-muted-foreground">
            {p.acompanantes} acompañante(s)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {p.categorias.map((c) => (
            <Badge key={c} variant="outline">
              {ETIQUETA_CATEGORIA[c] ?? c}
            </Badge>
          ))}
          {p.vieneEnAuto && (
            <Badge variant="secondary">
              <Car className="size-3" />
              Viene en auto
            </Badge>
          )}
          {p.necesitaLuz && (
            <Badge variant="secondary">
              <Zap className="size-3" />
              Necesita luz
            </Badge>
          )}
        </div>

        <p className="font-medium">
          {p.esGratis ? <span className="text-success">Gratis</span> : formatearPrecio(p.precio ?? 0)}
        </p>

        {p.comprobanteSignedUrl && (
          <ComprobanteLightbox url={p.comprobanteSignedUrl} />
        )}

        {esperandoComprobante && (
          <p className="rounded-md bg-warning/10 p-2 text-xs text-warning">
            Aceptado — todavía no sube el comprobante de pago.
          </p>
        )}

        {p.estado === "rechazado" && p.motivoRechazo && (
          <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            Motivo: {p.motivoRechazo}
          </p>
        )}

        {necesitaAceptacionPrimero && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <form action={aceptarConIds}>
              <Button type="submit" size="sm">
                <CheckCircle2 className="size-4" />
                Aceptar postulante
              </Button>
            </form>
            <form action={rechazarConIds} className="flex items-center gap-2">
              <Input
                name="motivo"
                placeholder="Motivo del rechazo (opcional)"
                className="h-8 w-56"
              />
              <Button type="submit" size="sm" variant="outline">
                <XCircle className="size-4" />
                Rechazar
              </Button>
            </form>
          </div>
        )}

        {!necesitaAceptacionPrimero && puedeResolverDirecto && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <form action={aprobarConIds}>
              <Button type="submit" size="sm" disabled={esperandoComprobante}>
                <CheckCircle2 className="size-4" />
                {textoAprobar}
              </Button>
            </form>
            <form action={rechazarConIds} className="flex items-center gap-2">
              <Input
                name="motivo"
                placeholder="Motivo del rechazo (opcional)"
                className="h-8 w-56"
              />
              <Button type="submit" size="sm" variant="outline">
                <XCircle className="size-4" />
                Rechazar
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

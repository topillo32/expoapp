import { notFound } from "next/navigation";
import { CircleDollarSign, Clock3, Gift } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExpoSubNav } from "@/components/expo-subnav";
import { BotonDescargarCsv } from "@/components/boton-descargar-csv";
import { TarjetaEstadistica } from "@/components/tarjeta-estadistica";
import { formatearFecha, formatearPrecio } from "@/lib/format";
import { calcularResumenIngresos, type PuestoParaIngreso } from "@/lib/contabilidad";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETA_TIPO_PUESTO } from "@/lib/types";
import { exportarContabilidadExpo } from "./actions";

interface PuestoFila extends PuestoParaIngreso {
  id: string;
  nombreTienda: string;
  encargadoNombre: string;
  fechaResolucion: string | null;
}

export default async function ContabilidadExpoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expo } = await supabase
    .from("expos")
    .select("id, nombre")
    .eq("id", id)
    .eq("organizador_id", user?.id ?? "")
    .maybeSingle<{ id: string; nombre: string }>();

  if (!expo) {
    notFound();
  }

  const { data: puestos, error } = await supabase
    .from("puestos")
    .select(
      "id, estado, esGratis:es_gratis, precio, tipo, nombreTienda:nombre_tienda, encargadoNombre:encargado_nombre, fechaResolucion:fecha_resolucion",
    )
    .eq("expo_id", id)
    .returns<PuestoFila[]>();

  if (error) {
    throw error;
  }

  const resumen = calcularResumenIngresos(puestos ?? []);
  const movimientos = (puestos ?? [])
    .filter((p) => p.estado === "aprobado" && !p.esGratis)
    .sort((a, b) => (b.fechaResolucion ?? "").localeCompare(a.fechaResolucion ?? ""));

  const exportarConId = exportarContabilidadExpo.bind(null, expo.id);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: expo.nombre, href: `/organizador/expos/${expo.id}/editar` },
          { label: "Contabilidad" },
        ]}
      />
      <ExpoSubNav expoId={expo.id} activo="contabilidad" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Contabilidad de {expo.nombre}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ingresos calculados a partir de los puestos aprobados.
          </p>
        </div>
        <BotonDescargarCsv
          accion={exportarConId}
          nombreArchivo={`contabilidad-${expo.nombre.toLowerCase().replace(/\s+/g, "-")}.csv`}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <TarjetaEstadistica
          icono={<CircleDollarSign className="size-4 text-primary" />}
          titulo="Ingreso total"
          valor={formatearPrecio(resumen.ingresoTotal)}
          detalle={`${resumen.puestosPagados} puesto(s) pagado(s)`}
        />
        <TarjetaEstadistica
          icono={<Clock3 className="size-4 text-warning" />}
          titulo="Pendiente por cobrar"
          valor={formatearPrecio(resumen.montoPorCobrar)}
          detalle={`${resumen.puestosPorCobrar} solicitud(es) sin confirmar`}
        />
        <TarjetaEstadistica
          icono={<Gift className="size-4 text-muted-foreground" />}
          titulo="Puestos gratis"
          valor={String(resumen.puestosGratis)}
          detalle="aprobados sin costo"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Desglose por tipo de puesto</h2>
        {resumen.porTipo.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay puestos aprobados.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Pagados</th>
                  <th className="px-4 py-2 font-medium">Gratis</th>
                  <th className="px-4 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resumen.porTipo.map((r) => (
                  <tr key={r.tipo} className="border-t">
                    <td className="px-4 py-2">{ETIQUETA_TIPO_PUESTO[r.tipo]}</td>
                    <td className="px-4 py-2">{r.puestosPagados}</td>
                    <td className="px-4 py-2">{r.puestosGratis}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatearPrecio(r.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Movimientos ({movimientos.length})</h2>
        {movimientos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay pagos confirmados para este evento.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Puesto</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Encargado</th>
                  <th className="px-4 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">
                      {m.fechaResolucion ? formatearFecha(m.fechaResolucion.slice(0, 10)) : "—"}
                    </td>
                    <td className="px-4 py-2">{m.nombreTienda}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {ETIQUETA_TIPO_PUESTO[m.tipo] ?? m.tipo}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{m.encargadoNombre}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatearPrecio(m.precio ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

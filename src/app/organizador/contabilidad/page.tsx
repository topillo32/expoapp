import Link from "next/link";
import { CircleDollarSign, Clock3, Gift } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BotonDescargarCsv } from "@/components/boton-descargar-csv";
import { Badge } from "@/components/ui/badge";
import { TarjetaEstadistica } from "@/components/tarjeta-estadistica";
import { calcularResumenPorExpo, type PuestoParaIngreso } from "@/lib/contabilidad";
import { formatearPrecio } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { exportarContabilidadGeneral } from "./actions";

interface ExpoPropia {
  id: string;
  nombre: string;
  estado: "borrador" | "publicada" | "finalizada";
}

const etiquetaEstado: Record<ExpoPropia["estado"], string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  finalizada: "Finalizada",
};

export default async function ContabilidadGeneralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expos, error: errorExpos } = await supabase
    .from("expos")
    .select("id, nombre, estado")
    .eq("organizador_id", user!.id)
    .order("creado_en", { ascending: false })
    .returns<ExpoPropia[]>();

  if (errorExpos) {
    throw errorExpos;
  }

  const expoIds = (expos ?? []).map((e) => e.id);

  const { data: puestos, error: errorPuestos } =
    expoIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("puestos")
          .select("expoId:expo_id, estado, esGratis:es_gratis, precio, tipo")
          .in("expo_id", expoIds)
          .returns<(PuestoParaIngreso & { expoId: string })[]>();

  if (errorPuestos) {
    throw errorPuestos;
  }

  const porExpo = calcularResumenPorExpo(expos ?? [], puestos ?? []);
  const estadoPorExpo = new Map((expos ?? []).map((e) => [e.id, e.estado]));

  const totalGeneral = {
    ingresoTotal: porExpo.reduce((acc, e) => acc + e.resumen.ingresoTotal, 0),
    puestosPagados: porExpo.reduce((acc, e) => acc + e.resumen.puestosPagados, 0),
    puestosGratis: porExpo.reduce((acc, e) => acc + e.resumen.puestosGratis, 0),
    montoPorCobrar: porExpo.reduce((acc, e) => acc + e.resumen.montoPorCobrar, 0),
  };

  const ordenadas = [...porExpo].sort((a, b) => b.resumen.ingresoTotal - a.resumen.ingresoTotal);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Contabilidad" }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Contabilidad</h1>
          <p className="mt-1 text-muted-foreground">
            Resumen de ingresos de todos tus eventos.
          </p>
        </div>
        <BotonDescargarCsv
          accion={exportarContabilidadGeneral}
          nombreArchivo="contabilidad-general.csv"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <TarjetaEstadistica
          icono={<CircleDollarSign className="size-4 text-primary" />}
          titulo="Ingreso total"
          valor={formatearPrecio(totalGeneral.ingresoTotal)}
          detalle={`${totalGeneral.puestosPagados} puesto(s) pagado(s)`}
        />
        <TarjetaEstadistica
          icono={<Clock3 className="size-4 text-warning" />}
          titulo="Pendiente por cobrar"
          valor={formatearPrecio(totalGeneral.montoPorCobrar)}
          detalle="en solicitudes sin confirmar"
        />
        <TarjetaEstadistica
          icono={<Gift className="size-4 text-muted-foreground" />}
          titulo="Puestos gratis"
          valor={String(totalGeneral.puestosGratis)}
          detalle="aprobados sin costo"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Por evento</h2>
        {ordenadas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no creaste ningún evento.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Evento</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Pagados</th>
                  <th className="px-4 py-2 font-medium">Gratis</th>
                  <th className="px-4 py-2 font-medium">Por cobrar</th>
                  <th className="px-4 py-2 text-right font-medium">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((e) => (
                  <tr key={e.expoId} className="border-t">
                    <td className="px-4 py-2">
                      <Link
                        href={`/organizador/expos/${e.expoId}/contabilidad`}
                        className="font-medium text-primary hover:underline"
                      >
                        {e.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          estadoPorExpo.get(e.expoId) === "publicada" ? "default" : "secondary"
                        }
                      >
                        {etiquetaEstado[estadoPorExpo.get(e.expoId) ?? "borrador"]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{e.resumen.puestosPagados}</td>
                    <td className="px-4 py-2">{e.resumen.puestosGratis}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatearPrecio(e.resumen.montoPorCobrar)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatearPrecio(e.resumen.ingresoTotal)}
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

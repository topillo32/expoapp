import type { TipoPuesto } from "./types";

const TIPOS: TipoPuesto[] = ["emprendedor", "comida", "merchandising"];

export interface PuestoParaIngreso {
  estado: string;
  esGratis: boolean;
  precio: number | null;
  tipo: TipoPuesto;
}

export interface ResumenPorTipo {
  tipo: TipoPuesto;
  puestosPagados: number;
  puestosGratis: number;
  monto: number;
}

export interface ResumenIngresos {
  ingresoTotal: number;
  puestosPagados: number;
  puestosGratis: number;
  montoPorCobrar: number;
  puestosPorCobrar: number;
  porTipo: ResumenPorTipo[];
}

export interface ResumenExpo {
  expoId: string;
  nombre: string;
  resumen: ResumenIngresos;
}

/**
 * Agrupa puestos de varios eventos por expo y calcula el resumen de cada
 * uno. Recibe la lista completa de expos (para que las que todavia no
 * tienen ningun puesto aprobado igual aparezcan con ingreso 0) y la lista
 * plana de puestos de todas ellas.
 */
export function calcularResumenPorExpo(
  expos: { id: string; nombre: string }[],
  puestos: (PuestoParaIngreso & { expoId: string })[],
): ResumenExpo[] {
  const filasPorExpo = new Map<string, PuestoParaIngreso[]>();
  for (const p of puestos) {
    if (!filasPorExpo.has(p.expoId)) {
      filasPorExpo.set(p.expoId, []);
    }
    filasPorExpo.get(p.expoId)!.push(p);
  }

  return expos.map((e) => ({
    expoId: e.id,
    nombre: e.nombre,
    resumen: calcularResumenIngresos(filasPorExpo.get(e.id) ?? []),
  }));
}

/**
 * El ingreso se reconoce recien cuando el puesto queda "aprobado" (el
 * organizador confirmo el pago). Lo "pendiente por cobrar" son postulaciones
 * pagas que todavia estan pendientes o aceptadas esperando comprobante.
 */
export function calcularResumenIngresos(puestos: PuestoParaIngreso[]): ResumenIngresos {
  const aprobados = puestos.filter((p) => p.estado === "aprobado");
  const pendientesDePago = puestos.filter(
    (p) => (p.estado === "pendiente" || p.estado === "aceptado") && !p.esGratis,
  );

  const porTipo = TIPOS.map((tipo) => {
    const delTipo = aprobados.filter((p) => p.tipo === tipo);
    return {
      tipo,
      puestosPagados: delTipo.filter((p) => !p.esGratis).length,
      puestosGratis: delTipo.filter((p) => p.esGratis).length,
      monto: delTipo.reduce((acc, p) => acc + (p.esGratis ? 0 : (p.precio ?? 0)), 0),
    };
  }).filter((r) => r.puestosPagados > 0 || r.puestosGratis > 0);

  return {
    ingresoTotal: aprobados.reduce((acc, p) => acc + (p.esGratis ? 0 : (p.precio ?? 0)), 0),
    puestosPagados: aprobados.filter((p) => !p.esGratis).length,
    puestosGratis: aprobados.filter((p) => p.esGratis).length,
    montoPorCobrar: pendientesDePago.reduce((acc, p) => acc + (p.precio ?? 0), 0),
    puestosPorCobrar: pendientesDePago.length,
    porTipo,
  };
}

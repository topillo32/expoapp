export const TIPOS_PUESTO = ["emprendedor", "comida", "merchandising"] as const;

export interface CamposExpo {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  maxPuestos: number;
  tieneEstacionamiento: boolean;
  tieneBanos: boolean;
  banosGratis: boolean;
  tieneLuz: boolean;
  publicarAhora: boolean;
  recintoNombre: string;
  recintoDireccion: string;
  recintoComuna: string;
  recintoCiudad: string;
  requiereAceptacionPago: boolean;
  cuentaTransferenciaId: string | null;
}

export function parsearCamposExpo(formData: FormData): CamposExpo {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    fechaInicio: String(formData.get("fechaInicio") ?? ""),
    fechaFin: String(formData.get("fechaFin") ?? ""),
    maxPuestos: Number(formData.get("maxPuestos") ?? 0),
    tieneEstacionamiento: formData.get("tieneEstacionamiento") === "on",
    tieneBanos: formData.get("tieneBanos") === "on",
    banosGratis: formData.get("banosGratis") === "on",
    tieneLuz: formData.get("tieneLuz") === "on",
    publicarAhora: formData.get("publicar") === "on",
    recintoNombre: String(formData.get("recintoNombre") ?? "").trim(),
    recintoDireccion: String(formData.get("recintoDireccion") ?? "").trim(),
    recintoComuna: String(formData.get("recintoComuna") ?? "").trim(),
    recintoCiudad: String(formData.get("recintoCiudad") ?? "").trim(),
    requiereAceptacionPago: formData.get("requiereAceptacionPago") === "on",
    cuentaTransferenciaId: String(formData.get("cuentaTransferenciaId") ?? "").trim() || null,
  };
}

export function parsearHorarios(formData: FormData) {
  const fechas = formData.getAll("horarioFecha").map(String);
  const inicios = formData.getAll("horarioInicio").map(String);
  const fines = formData.getAll("horarioFin").map(String);

  return fechas
    .map((fecha, i) => ({
      fecha,
      hora_inicio: inicios[i],
      hora_fin: fines[i],
    }))
    .filter((h) => h.fecha && h.hora_inicio && h.hora_fin);
}

export function parsearCuposPorTipo(formData: FormData) {
  return TIPOS_PUESTO.filter((tipo) => formData.get(`habilitado_${tipo}`) === "on").map(
    (tipo) => {
      const gratisTotal = formData.get(`gratisTotal_${tipo}`) === "on";
      const precioCrudo = formData.get(`precio_${tipo}`);
      const cupoGratisCrudo = formData.get(`cupoGratis_${tipo}`);
      const maxCupoCrudo = formData.get(`maxCupo_${tipo}`);

      return {
        tipo_puesto: tipo,
        gratis_total: gratisTotal,
        precio: gratisTotal ? null : Number(precioCrudo ?? 0),
        cupo_gratis: gratisTotal
          ? 0
          : cupoGratisCrudo && String(cupoGratisCrudo).trim() !== ""
            ? Number(cupoGratisCrudo)
            : 0,
        max_cupo:
          maxCupoCrudo && String(maxCupoCrudo).trim() !== "" ? Number(maxCupoCrudo) : null,
      };
    },
  );
}

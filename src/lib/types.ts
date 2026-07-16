export type RolUsuario = "organizador" | "emprendedor" | "admin";

export type EstadoExpo = "borrador" | "publicada" | "finalizada";

export type TipoPuesto = "emprendedor" | "comida" | "merchandising";

export type EstadoPuesto = "pendiente" | "aceptado" | "aprobado" | "rechazado" | "cancelado";

export interface Recinto {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  capacidad?: number;
}

export interface ExpoHorario {
  id: string;
  expoId: string;
  fecha: string; // ISO date
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
}

export const CATEGORIAS_PUESTO = [
  "ropa_accesorios",
  "alimentos_bebidas",
  "artesanias",
  "belleza_cuidado_personal",
  "tecnologia",
  "juguetes_juegos",
  "papeleria_libros",
  "hogar_decoracion",
  "servicios",
  "otros",
] as const;

export type CategoriaPuesto = (typeof CATEGORIAS_PUESTO)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaPuesto, string> = {
  ropa_accesorios: "Ropa y accesorios",
  alimentos_bebidas: "Alimentos y bebidas",
  artesanias: "Artesanías",
  belleza_cuidado_personal: "Belleza y cuidado personal",
  tecnologia: "Tecnología",
  juguetes_juegos: "Juguetes y juegos",
  papeleria_libros: "Papelería y libros",
  hogar_decoracion: "Hogar y decoración",
  servicios: "Servicios",
  otros: "Otros",
};

export interface ExpoCupoTipo {
  tipoPuesto: TipoPuesto;
  maxCupo?: number;
  gratisTotal: boolean;
  cupoGratis: number;
  precio?: number;
}

export interface CuentaTransferencia {
  id: string;
  organizadorId: string;
  alias: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rutTitular: string;
  nombreTitular: string;
  emailContacto?: string;
}

export interface UbicacionPuesto {
  id: string;
  expoId: string;
  tipoPuesto: TipoPuesto;
  posX: number; // 0-1, relativo al ancho de la imagen del plano
  posY: number; // 0-1, relativo al alto de la imagen del plano
  etiqueta?: string;
  esGratis: boolean;
  precio?: number;
}

export interface Expo {
  id: string;
  organizadorId: string;
  organizadorNombre: string;
  recinto: Recinto;
  nombre: string;
  descripcion: string;
  fechaInicio: string; // ISO date
  fechaFin: string; // ISO date
  maxPuestos: number;
  tieneEstacionamiento: boolean;
  tieneBanos: boolean;
  banosGratis?: boolean;
  tieneLuz: boolean;
  estado: EstadoExpo;
  horarios: ExpoHorario[];
  cuposPorTipo: ExpoCupoTipo[];
  planoUrl?: string;
  flyerUrl?: string;
  requiereAceptacionPago: boolean;
  cuentaTransferenciaId?: string;
  ubicaciones: UbicacionPuesto[];
}

export interface Puesto {
  id: string;
  expoId: string;
  emprendedorId: string;
  tipo: TipoPuesto;
  esGratis: boolean;
  precio?: number;
  rut: string;
  razonSocial: string;
  nombreTienda: string;
  categorias: CategoriaPuesto[];
  quiereCupoGratis: boolean;
  ubicacionId?: string;
  encargadoNombre: string;
  encargadoContacto: string;
  acompanantes: number;
  vieneEnAuto: boolean;
  necesitaLuz: boolean;
  estado: EstadoPuesto;
  comprobantePagoUrl?: string;
  motivoRechazo?: string;
}

export interface Actividad {
  id: string;
  expoId: string;
  nombre: string;
  descripcion: string;
  fecha: string; // ISO date
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  lugar?: string;
}

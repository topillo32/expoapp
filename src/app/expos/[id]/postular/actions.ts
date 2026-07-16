"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarRut } from "@/lib/rut";
import { extensionSegura, validarImagen } from "@/lib/validar-archivo";

export interface EstadoFormPostular {
  error?: string;
}

export async function crearPostulacion(
  _prevState: EstadoFormPostular,
  formData: FormData,
): Promise<EstadoFormPostular> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const expoId = String(formData.get("expoId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const ubicacionId = String(formData.get("ubicacionId") ?? "") || null;
  const nombreTienda = String(formData.get("nombreTienda") ?? "").trim();
  const razonSocial = String(formData.get("razonSocial") ?? "").trim();
  const rut = String(formData.get("rut") ?? "").trim();
  const categorias = formData.getAll("categorias").map(String);
  const encargadoNombre = String(formData.get("encargadoNombre") ?? "").trim();
  const encargadoContacto = String(formData.get("encargadoContacto") ?? "").trim();
  const acompanantes = Number(formData.get("acompanantes") ?? 0);
  const vieneEnAuto = formData.get("vieneEnAuto") === "on";
  const necesitaLuz = formData.get("necesitaLuz") === "on";
  const quiereCupoGratis = formData.get("quiereCupoGratis") === "on";
  const comprobante = formData.get("comprobante");

  if (
    !expoId ||
    !tipo ||
    !nombreTienda ||
    !razonSocial ||
    !rut ||
    !encargadoNombre ||
    !encargadoContacto
  ) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (categorias.length === 0) {
    return { error: "Selecciona al menos una categoría de lo que vendes." };
  }

  if (!validarRut(rut)) {
    return { error: "El RUT ingresado no es válido." };
  }

  const { data: expoInfo } = await supabase
    .from("expos")
    .select("requiereAceptacionPago:requiere_aceptacion_pago")
    .eq("id", expoId)
    .maybeSingle<{ requiereAceptacionPago: boolean }>();

  let esGratis: boolean;
  let precioFinal: number | null;

  if (ubicacionId) {
    const { data: ubicacion, error: errorUbicacion } = await supabase
      .from("ubicaciones_puesto")
      .select("esGratis:es_gratis, precio")
      .eq("id", ubicacionId)
      .eq("expo_id", expoId)
      .maybeSingle<{ esGratis: boolean; precio: number | null }>();

    if (errorUbicacion || !ubicacion) {
      return { error: "Ese lugar del plano ya no está disponible." };
    }

    const { data: yaOcupado } = await supabase
      .from("puestos")
      .select("id")
      .eq("ubicacion_id", ubicacionId)
      .in("estado", ["pendiente", "aprobado"])
      .maybeSingle();

    if (yaOcupado) {
      return { error: "Ese lugar ya fue tomado por otro emprendedor. Elige otro." };
    }

    esGratis = ubicacion.esGratis;
    precioFinal = ubicacion.esGratis ? null : ubicacion.precio;

    if (!esGratis && precioFinal == null) {
      return { error: "Ese lugar del plano no tiene un precio configurado." };
    }
  } else {
    const { data: cupoTipo, error: errorCupo } = await supabase
      .from("expo_cupos_tipo")
      .select("gratisTotal:gratis_total, cupoGratis:cupo_gratis, precio")
      .eq("expo_id", expoId)
      .eq("tipo_puesto", tipo)
      .maybeSingle<{ gratisTotal: boolean; cupoGratis: number; precio: number | null }>();

    if (errorCupo || !cupoTipo) {
      return { error: "Este tipo de puesto no está habilitado para este evento." };
    }

    esGratis = cupoTipo.gratisTotal || (quiereCupoGratis && cupoTipo.cupoGratis > 0);
    precioFinal = esGratis ? null : cupoTipo.precio;

    if (!esGratis && precioFinal == null) {
      return {
        error:
          "Este tipo de puesto no tiene un precio configurado. Pídele al organizador que edite el evento y le ponga un precio (o lo marque como gratis).",
      };
    }
  }

  const necesitaAceptacionPrevia = Boolean(expoInfo?.requiereAceptacionPago) && !esGratis;

  const archivoComprobante =
    !necesitaAceptacionPrevia && comprobante instanceof File && comprobante.size > 0
      ? comprobante
      : null;

  if (!esGratis && !necesitaAceptacionPrevia && !archivoComprobante) {
    return { error: "Debes subir el comprobante de pago." };
  }

  if (archivoComprobante) {
    const errorValidacion = await validarImagen(archivoComprobante);
    if (errorValidacion) {
      return { error: errorValidacion };
    }
  }

  let comprobantePagoUrl: string | null = null;

  if (archivoComprobante) {
    const extension = extensionSegura(archivoComprobante.name);
    const ruta = `${user.id}/${expoId}-${Date.now()}.${extension}`;

    const { error: errorUpload } = await supabase.storage
      .from("comprobantes")
      .upload(ruta, archivoComprobante);

    if (errorUpload) {
      return { error: `No se pudo subir el comprobante: ${errorUpload.message}` };
    }

    comprobantePagoUrl = ruta;
  }

  const { error: errorInsert } = await supabase.from("puestos").insert({
    expo_id: expoId,
    emprendedor_id: user.id,
    tipo,
    ubicacion_id: ubicacionId,
    es_gratis: esGratis,
    precio: precioFinal,
    rut,
    razon_social: razonSocial,
    nombre_tienda: nombreTienda,
    categorias,
    quiere_cupo_gratis: quiereCupoGratis,
    encargado_nombre: encargadoNombre,
    encargado_contacto: encargadoContacto,
    acompanantes,
    viene_en_auto: vieneEnAuto,
    necesita_luz: necesitaLuz,
    comprobante_pago_url: comprobantePagoUrl,
  });

  if (errorInsert) {
    if (errorInsert.code === "23505") {
      return { error: "Ese lugar ya fue tomado por otro emprendedor. Elige otro." };
    }
    return { error: errorInsert.message };
  }

  redirect(`/expos/${expoId}?postulado=1`);
}

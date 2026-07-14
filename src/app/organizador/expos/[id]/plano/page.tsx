import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { PlanoEditor, type UbicacionEditor } from "./plano-editor";

interface ExpoConPlano {
  id: string;
  nombre: string;
  planoUrl: string | null;
  maxPuestos: number;
  ubicaciones: UbicacionEditor[];
  cuposPorTipo: {
    tipoPuesto: UbicacionEditor["tipoPuesto"];
    gratisTotal: boolean;
    precio: number | null;
    maxCupo: number | null;
  }[];
}

export default async function PlanoExpoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expo, error } = await supabase
    .from("expos")
    .select(
      `
      id,
      nombre,
      planoUrl:plano_url,
      maxPuestos:max_puestos,
      ubicaciones:ubicaciones_puesto(id, tipoPuesto:tipo_puesto, posX:pos_x, posY:pos_y, etiqueta, esGratis:es_gratis, precio),
      cuposPorTipo:expo_cupos_tipo(tipoPuesto:tipo_puesto, gratisTotal:gratis_total, precio, maxCupo:max_cupo)
      `,
    )
    .eq("id", id)
    .eq("organizador_id", user?.id ?? "")
    .maybeSingle<ExpoConPlano>();

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }
    throw error;
  }

  if (!expo) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: expo.nombre, href: `/organizador/expos/${expo.id}/editar` },
          { label: "Plano" },
        ]}
      />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Plano de {expo.nombre}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Sube el croquis del recinto y marca cada puesto haciendo clic sobre la
        imagen.
      </p>

      <div className="mt-8">
        <PlanoEditor
          expoId={expo.id}
          planoUrl={expo.planoUrl}
          maxPuestos={expo.maxPuestos}
          ubicacionesIniciales={expo.ubicaciones}
          tiposDisponibles={expo.cuposPorTipo}
        />
      </div>
    </div>
  );
}

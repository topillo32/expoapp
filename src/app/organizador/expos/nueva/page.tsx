import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExpoForm } from "@/components/expo-form";
import { createClient } from "@/lib/supabase/server";
import { crearExpo } from "./actions";

export default async function NuevaExpoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cuentasDisponibles } = await supabase
    .from("cuentas_transferencia")
    .select("id, alias")
    .eq("organizador_id", user?.id ?? "")
    .order("creado_en", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs items={[{ label: "Nuevo evento" }]} />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Crear evento</h1>
      <p className="mt-1 text-muted-foreground">
        Completa los datos de tu feria o evento.
      </p>

      <div className="mt-8">
        <ExpoForm
          accion={crearExpo}
          cuentasDisponibles={cuentasDisponibles ?? []}
          textoBoton="Crear evento"
          textoEnviando="Creando..."
        />
      </div>
    </div>
  );
}

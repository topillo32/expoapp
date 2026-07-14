import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExpoForm } from "@/components/expo-form";
import { crearExpo } from "./actions";

export default function NuevaExpoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Nueva expo" }]} />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Crear expo</h1>
      <p className="mt-1 text-muted-foreground">
        Completa los datos de tu feria o expo.
      </p>

      <div className="mt-8">
        <ExpoForm accion={crearExpo} textoBoton="Crear expo" textoEnviando="Creando..." />
      </div>
    </div>
  );
}

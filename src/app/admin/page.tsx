import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BotonAlternarActivo } from "./boton-alternar-activo";
import { BotonResetearPassword } from "./boton-resetear-password";

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Admin",
  organizador: "Organizador",
  emprendedor: "Emprendedor",
};

interface PerfilFila {
  id: string;
  nombre: string;
  rol: string;
  activo: boolean;
  creadoEn: string;
  email: string | null;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, activo, creadoEn:creado_en")
    .order("creado_en", { ascending: false });

  if (error) {
    throw error;
  }

  let emailsPorId = new Map<string, string>();
  let tieneServiceRole = true;
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    emailsPorId = new Map(data.users.map((u) => [u.id, u.email ?? ""]));
  } catch {
    tieneServiceRole = false;
  }

  const filas: PerfilFila[] = (perfiles ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    rol: p.rol,
    activo: p.activo,
    creadoEn: p.creadoEn,
    email: emailsPorId.get(p.id) ?? null,
  }));

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold tracking-tight">
        <Users className="size-7 text-primary" />
        Cuentas de usuarios
      </h1>
      <p className="mt-1 text-muted-foreground">
        {filas.length} cuenta{filas.length === 1 ? "" : "s"} registrada{filas.length === 1 ? "" : "s"}.
      </p>

      {!tieneServiceRole && (
        <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Falta configurar <code>SUPABASE_SERVICE_ROLE_KEY</code> en las variables de entorno
          (Supabase: Settings → API → service_role) para ver el email de cada cuenta y poder
          resetear contraseñas.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {filas.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {f.nombre}
                  {f.email && (
                    <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                      {f.email}
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ETIQUETA_ROL[f.rol] ?? f.rol}</Badge>
                  <Badge variant={f.activo ? "success" : "destructive"}>
                    {f.activo ? "Activa" : "Suspendida"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <BotonAlternarActivo userId={f.id} activo={f.activo} />
              {tieneServiceRole && <BotonResetearPassword userId={f.id} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

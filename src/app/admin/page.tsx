import { Clock3, ShieldCheck, Store, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TarjetaEstadistica } from "@/components/tarjeta-estadistica";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BotonAlternarActivo } from "./boton-alternar-activo";
import { BotonAprobarOrganizador } from "./boton-aprobar-organizador";
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
  aprobado: boolean;
  creadoEn: string;
  email: string | null;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, activo, aprobado, creadoEn:creado_en")
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
    aprobado: p.aprobado,
    creadoEn: p.creadoEn,
    email: emailsPorId.get(p.id) ?? null,
  }));

  const pendientes = filas.filter((f) => f.rol === "organizador" && !f.aprobado);
  const resto = filas.filter((f) => !(f.rol === "organizador" && !f.aprobado));
  const organizadores = filas.filter((f) => f.rol === "organizador").length;
  const emprendedores = filas.filter((f) => f.rol === "emprendedor").length;
  const suspendidas = filas.filter((f) => !f.activo).length;

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 font-heading text-4xl font-semibold tracking-tight">
          <Users className="size-8 text-primary" />
          Cuentas de usuarios
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra el acceso de organizadores y emprendedores a la plataforma.
        </p>
      </div>

      {!tieneServiceRole && (
        <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Falta configurar <code>SUPABASE_SERVICE_ROLE_KEY</code> en las variables de entorno
          (Supabase: Settings → API → service_role) para ver el email de cada cuenta y poder
          resetear contraseñas.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaEstadistica
          icono={<Users className="size-4 text-primary" />}
          titulo="Cuentas totales"
          valor={String(filas.length)}
          detalle="registradas en la plataforma"
        />
        <TarjetaEstadistica
          icono={<Store className="size-4 text-muted-foreground" />}
          titulo="Organizadores"
          valor={String(organizadores)}
          detalle={`${emprendedores} emprendedor(es)`}
        />
        <TarjetaEstadistica
          icono={<Clock3 className="size-4 text-warning" />}
          titulo="Pendientes de aprobación"
          valor={String(pendientes.length)}
          detalle="organizadores esperando"
        />
        <TarjetaEstadistica
          icono={<UserCheck className="size-4 text-muted-foreground" />}
          titulo="Suspendidas"
          valor={String(suspendidas)}
          detalle="cuentas sin acceso"
        />
      </div>

      {pendientes.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            Organizadores esperando aprobación
            <Badge variant="warning">{pendientes.length}</Badge>
          </h2>
          <div className="mt-4 space-y-3">
            {pendientes.map((f) => (
              <Card key={f.id} className="card-glow-hover border-warning/40">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-sm font-semibold text-warning">
                        {f.nombre.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        {f.nombre}
                        {f.email && (
                          <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                            {f.email}
                          </span>
                        )}
                      </span>
                    </CardTitle>
                    <Badge variant="warning">Pendiente de aprobación</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <BotonAprobarOrganizador userId={f.id} />
                  <BotonAlternarActivo userId={f.id} activo={f.activo} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium">
          {pendientes.length > 0 ? "Todas las cuentas" : "Cuentas"}
        </h2>
        <div className="mt-4 space-y-3">
          {resto.map((f) => (
            <Card key={f.id} className="card-glow-hover">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-sm font-semibold text-foreground">
                      {f.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      {f.nombre}
                      {f.email && (
                        <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                          {f.email}
                        </span>
                      )}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {f.rol === "admin" && <ShieldCheck className="size-4 text-primary" />}
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
      </section>
    </div>
  );
}

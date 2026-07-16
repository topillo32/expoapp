import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: se salta RLS y puede administrar usuarios
 * de auth.users (listar, resetear contraseña). Solo se usa desde server
 * actions ya validadas como admin — nunca exponer a componentes cliente.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno " +
        "(Supabase: Settings > API > service_role) para usar el módulo de administración.",
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

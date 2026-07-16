import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresca el token si es necesario. No se puede quitar: sin esto las
  // sesiones expiran silenciosamente en Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("activo")
      .eq("id", user.id)
      .maybeSingle();

    if (perfil && perfil.activo === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/cuenta-suspendida";
      const redirectResponse = NextResponse.redirect(url);
      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie);
      }
      return redirectResponse;
    }
  }

  return response;
}

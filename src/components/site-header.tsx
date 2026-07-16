import Image from "next/image";
import Link from "next/link";
import { Bell, KeyRound, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rol: string | null = null;
  let novedades = 0;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();
    rol = perfil?.rol ?? null;

    if (rol === "emprendedor") {
      const { count } = await supabase
        .from("puestos")
        .select("id", { count: "exact", head: true })
        .eq("emprendedor_id", user.id)
        .eq("resultado_visto", false);
      novedades = count ?? 0;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-md">
      <div className="flex w-full items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          className="group flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <Image
            src="/image/logo-mark.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 transition-transform duration-200 group-hover:scale-105"
            priority
          />
          FeriaSync
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {!user && (
            <>
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                className={buttonVariants({ size: "sm", className: "ml-2" })}
              >
                Registrarme
              </Link>
            </>
          )}

          {user && rol === "organizador" && (
            <Link
              href="/organizador"
              className="group/nav flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <LayoutDashboard className="size-4 transition-colors duration-200 group-hover/nav:text-primary" />
              Mi panel
            </Link>
          )}

          {user && rol === "admin" && (
            <Link
              href="/admin"
              className="group/nav flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ShieldCheck className="size-4 transition-colors duration-200 group-hover/nav:text-primary" />
              Administración
            </Link>
          )}

          {user && rol === "emprendedor" && (
            <Link
              href="/mis-postulaciones"
              className="group/nav relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Bell className="size-4 transition-colors duration-200 group-hover/nav:text-primary" />
              Mis postulaciones
              {novedades > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                  {novedades > 9 ? "9+" : novedades}
                </span>
              )}
            </Link>
          )}

          {user && (
            <Link
              href="/cuenta"
              className="group/nav flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              title="Cambiar contraseña"
            >
              <KeyRound className="size-4 transition-colors duration-200 group-hover/nav:text-primary" />
            </Link>
          )}

          {user && (
            <form action={cerrarSesion} className="ml-1">
              <Button type="submit" variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

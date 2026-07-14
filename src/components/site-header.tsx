import Link from "next/link";
import { LayoutDashboard, Ticket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rol: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();
    rol = perfil?.rol ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          className="group flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <span className="flex size-7 -rotate-6 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-1 ring-white/10 transition-transform duration-200 group-hover:rotate-0">
            <Ticket className="size-4" />
          </span>
          Expos
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

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, KeyRound, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rol: string | null = null;
  let nombre: string | null = null;
  let novedades = 0;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol, nombre")
      .eq("id", user.id)
      .maybeSingle();
    rol = perfil?.rol ?? null;
    nombre = perfil?.nombre ?? null;

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
            <>
              <div className="mx-1.5 h-5 w-px shrink-0 bg-white/10" />

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="group/user flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-muted-foreground outline-none hover:bg-white/5 hover:text-foreground aria-expanded:bg-white/5 aria-expanded:text-foreground"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {(nombre ?? user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-medium text-foreground sm:inline">
                    {nombre ?? user.email}
                  </span>
                  <ChevronDown className="hidden size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded/user:rotate-180 sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-medium text-foreground">
                      {nombre ?? "Mi cuenta"}
                    </p>
                    {user.email && (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/cuenta" />}>
                    <KeyRound />
                    Cambiar contraseña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={cerrarSesion}>
                    <DropdownMenuItem
                      variant="destructive"
                      nativeButton
                      render={<button type="submit" />}
                    >
                      <LogOut />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

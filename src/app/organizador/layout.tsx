import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function OrganizadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, aprobado")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "organizador") {
    redirect("/");
  }

  if (!perfil.aprobado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 text-center">
        <Clock3 className="size-10 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
          Tu cuenta está en revisión
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Un administrador tiene que aprobar tu cuenta de organizador antes de que puedas crear
          eventos. Vuelve a entrar en un rato para revisar si ya está lista.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">{children}</div>
    </div>
  );
}

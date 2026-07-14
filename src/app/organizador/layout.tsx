import { redirect } from "next/navigation";
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
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "organizador") {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">{children}</div>
    </div>
  );
}

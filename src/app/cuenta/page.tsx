import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CambiarPasswordForm } from "./cambiar-password-form";

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/cuenta");
  }

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-12">
      <Card className="shadow-xl shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5 text-primary" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CambiarPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

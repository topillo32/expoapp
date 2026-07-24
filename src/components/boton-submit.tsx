"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function BotonSubmit({
  children,
  textoEnviando,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & { textoEnviando?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && textoEnviando ? textoEnviando : children}
    </Button>
  );
}

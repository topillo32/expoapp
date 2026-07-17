import { Pasos } from "./pasos";

export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Cómo funciona FeriaSync
      </h1>
      <p className="mt-1 text-muted-foreground">
        El paso a paso según seas organizador o emprendedor.
      </p>

      <div className="mt-8">
        <Pasos />
      </div>
    </div>
  );
}

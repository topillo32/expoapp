import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Términos y condiciones
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Última actualización: {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="font-heading text-lg font-semibold">1. Qué es FeriaSync</h2>
          <p className="mt-2 text-muted-foreground">
            FeriaSync es una plataforma que conecta a organizadores de ferias y eventos con
            emprendedores que buscan un puesto. Publicamos eventos, gestionamos postulaciones
            a puestos y facilitamos el contacto entre ambas partes. FeriaSync no organiza los
            eventos, no es dueño de los puestos ni participa como parte en la relación comercial
            entre el organizador y el emprendedor.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">2. Cuentas</h2>
          <p className="mt-2 text-muted-foreground">
            Para usar FeriaSync necesitas crear una cuenta como organizador o como emprendedor.
            Eres responsable de que los datos que entregues (nombre, contacto, RUT, datos de la
            empresa) sean veraces, y de mantener tu contraseña en privado. Cualquier actividad
            realizada desde tu cuenta se entiende hecha por ti.
          </p>
          <p className="mt-2 text-muted-foreground">
            Podemos suspender una cuenta que incumpla estos términos, que entregue información
            falsa, o que sea usada para fines distintos a los que la plataforma ofrece.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">3. Publicación de eventos y postulaciones</h2>
          <p className="mt-2 text-muted-foreground">
            El organizador es el único responsable de la información del evento (fechas, cupos,
            precios, condiciones) y de la decisión de aceptar, aprobar o rechazar cada
            postulación. FeriaSync no garantiza que un evento se realice, ni que una postulación
            aprobada se traduzca en la asignación efectiva de un puesto en el lugar del evento.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">4. Pagos y transferencias</h2>
          <p className="mt-2 text-muted-foreground">
            FeriaSync no procesa pagos ni retiene dinero de nadie. Cuando un puesto es pago, la
            transferencia se realiza directamente desde el emprendedor a la cuenta bancaria que
            el organizador registró para ese evento, fuera de la plataforma. FeriaSync solo
            facilita mostrar esos datos bancarios y permite adjuntar un comprobante para que el
            organizador confirme la recepción del pago.
          </p>
          <p className="mt-2 text-muted-foreground">
            Cualquier problema con una transferencia, un reembolso o el uso indebido de los datos
            bancarios entregados es un asunto entre el organizador y el emprendedor. FeriaSync no
            es responsable por errores de transferencia, fraudes fuera de la plataforma, ni por
            la exactitud de los datos bancarios que un organizador registre.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">5. Contenido que subes</h2>
          <p className="mt-2 text-muted-foreground">
            Los flyers, planos y comprobantes que subas siguen siendo tuyos. Al subirlos, nos
            autorizas a almacenarlos y mostrarlos dentro de la plataforma para el propósito con
            que fueron subidos (por ejemplo, mostrar el flyer de un evento publicado, o mostrar
            un comprobante al organizador correspondiente).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">6. Uso de tus datos</h2>
          <p className="mt-2 text-muted-foreground">
            Tus datos se usan únicamente dentro de FeriaSync, para operar la plataforma. Los
            detalles de qué se recopila y cómo se usa están en nuestra{" "}
            <Link href="/privacidad" className="text-primary underline">
              Política de datos
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">7. Límite de responsabilidad</h2>
          <p className="mt-2 text-muted-foreground">
            FeriaSync se entrega &ldquo;tal cual&rdquo; (as is). En la medida que lo permita la ley, no
            respondemos por pérdidas derivadas del uso de la plataforma, de la cancelación de un
            evento, de una transferencia mal hecha, o de la conducta de otros usuarios.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">8. Cambios a estos términos</h2>
          <p className="mt-2 text-muted-foreground">
            Podemos actualizar estos términos a medida que la plataforma cambie. Si el cambio es
            relevante, lo avisaremos dentro de la app.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">9. Contacto</h2>
          <p className="mt-2 text-muted-foreground">
            Dudas o reclamos:{" "}
            <a href="mailto:soportebeymatch@gmail.com" className="text-primary underline">
              soportebeymatch@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

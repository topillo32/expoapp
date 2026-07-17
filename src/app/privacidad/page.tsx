export default function PrivacidadPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Política de datos
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Última actualización: {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <p className="text-muted-foreground">
            Esta política explica qué datos recopila FeriaSync y para qué se usan. La regla
            general es simple: <strong className="text-foreground">tus datos se usan solo
            dentro de FeriaSync, para que la plataforma funcione</strong> — no los vendemos, no
            los usamos con fines publicitarios, y no se los pasamos a terceros para que los usen
            con sus propios fines.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Qué datos recopilamos</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Datos de cuenta: nombre, email, contraseña (guardada cifrada, nadie en FeriaSync puede verla).</li>
            <li>Datos de contacto que agregues a tu perfil.</li>
            <li>Si postulas a un puesto: RUT, razón social, nombre de tu tienda, categorías de producto, y los datos del encargado del puesto.</li>
            <li>Si eres organizador y usas el flujo de aceptación previa: los datos de tus cuentas bancarias (banco, tipo de cuenta, número, RUT y nombre del titular) para que los postulantes aceptados sepan a dónde transferir.</li>
            <li>Comprobantes de pago, flyers y planos de puestos que subas.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Para qué se usan</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Operar la plataforma: crear tu cuenta, publicar eventos, procesar postulaciones.</li>
            <li>Mostrar tus datos de contacto al organizador o emprendedor con el que estás interactuando en una postulación específica — nunca a otros usuarios.</li>
            <li>Mostrar los datos bancarios de una cuenta de transferencia únicamente a los postulantes que el organizador aceptó para ese evento.</li>
            <li>Soporte: si necesitas ayuda o recuperar el acceso a tu cuenta.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Dónde se guardan</h2>
          <p className="mt-2 text-muted-foreground">
            Los datos se almacenan en Supabase, el proveedor de base de datos que usa FeriaSync
            para operar. Es infraestructura, no un tercero con acceso a usar tus datos por su
            cuenta — es equivalente a que un negocio guarde sus archivos en un servidor.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Quién puede ver qué</h2>
          <p className="mt-2 text-muted-foreground">
            El acceso está restringido por reglas a nivel de base de datos, no solo por la
            interfaz: un organizador solo ve los datos de quienes postularon a sus propios
            eventos, y un emprendedor solo ve sus propias postulaciones. El equipo de FeriaSync
            (administración) puede acceder a datos de cuentas únicamente para dar soporte —
            por ejemplo, para restablecer el acceso si pierdes tu contraseña.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Tus derechos</h2>
          <p className="mt-2 text-muted-foreground">
            Puedes pedir acceder a tus datos, corregirlos o solicitar que eliminemos tu cuenta y
            la información asociada, escribiendo a{" "}
            <a href="mailto:soportebeymatch@gmail.com" className="text-primary underline">
              soportebeymatch@gmail.com
            </a>
            . Algunos datos (por ejemplo, registros de postulaciones ya resueltas) pueden
            conservarse por un tiempo razonable si son necesarios para resolver una disputa entre
            organizador y emprendedor.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Cambios a esta política</h2>
          <p className="mt-2 text-muted-foreground">
            Si cambiamos esta política de forma relevante, lo avisaremos dentro de la app.
          </p>
        </section>
      </div>
    </div>
  );
}

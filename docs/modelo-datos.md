# Diseño de dominio y modelo de datos — Plataforma de Expos (Supabase)

## Contexto

Proyecto nuevo (carpeta vacía, sin código existente). Es una plataforma tipo
marketplace: **múltiples organizadores/expositores** publican sus propias ferias/expos
de forma independiente, y los **emprendedores buscan entre todas esas expos** (de
cualquier organizador) y se postulan a puestos en las que les interesen. El público
en general visualiza expos y su calendario de actividades sin necesidad de login.

Stack acordado: Next.js (web, responsive) + Supabase (Postgres + Auth + Storage).
Esta fase es solo de **diseño de ideas** (modelo de datos, roles, reglas de negocio,
pantallas) — todavía no se escribe código.

Decisiones ya tomadas con el usuario:
- El horario puede variar por día dentro de una misma expo (no es un solo horario fijo).
- El cupo máximo de puestos es variable: a veces es un total general, a veces se
  necesita repartido por tipo de puesto (emprendedor/comida/merchandising) — el modelo
  debe soportar ambos casos sin obligar a definir cupos por tipo si no se necesitan.
- Un emprendedor puede tener varios puestos dentro de la misma expo.
- La asignación de un puesto requiere aprobación manual del organizador (no es automática
  por orden de llegada).

## Roles

- **Público** (sin login): ve expos publicadas, su info general y el calendario de
  actividades. No ve datos de contacto de encargados de puestos.
- **Emprendedor** (login): ve expos publicadas, se postula a uno o varios puestos,
  ve el estado de sus propias postulaciones (pendiente/aprobado/rechazado).
- **Organizador** (login): crea y administra sus propias expos, define horarios,
  cupos, servicios (estacionamiento/baños/luz), aprueba o rechaza postulaciones de
  puestos, gestiona el calendario de actividades.

## Modelo de datos (Postgres / Supabase)

1. **perfiles** — extiende `auth.users`: `id`, `nombre`, `rol` (organizador | emprendedor), `contacto`.

2. **recintos** — `id`, `nombre`, `direccion`, `ciudad`, `capacidad` (opcional), `creado_por` (FK perfiles). Reutilizable entre expos.

3. **expos** — `id`, `organizador_id` (FK perfiles), `recinto_id` (FK recintos), `nombre`,
   `descripcion`, `fecha_inicio`, `fecha_fin`, `max_puestos` (total general, siempre
   obligatorio), `tiene_estacionamiento` (bool), `tiene_banos` (bool), `banos_gratis`
   (bool, nullable), `tiene_luz` (bool), `estado` (borrador | publicada | finalizada).

4. **expo_horarios** — `id`, `expo_id` (FK), `fecha`, `hora_inicio`, `hora_fin`.
   Una fila por día de la expo, para soportar horarios distintos día a día.

5. **expo_cupos_tipo** — `id`, `expo_id` (FK), `tipo_puesto` (enum: emprendedor | comida |
   merchandising), `max_cupo` (int, nullable). Fila opcional: si no existe para un
   tipo, ese tipo solo queda limitado por el `max_puestos` general de la expo.

6. **puestos** — `id`, `expo_id` (FK), `emprendedor_id` (FK perfiles), `tipo` (enum
   igual al de cupos_tipo), `es_gratis` (bool), `precio` (numeric, nullable),
   `encargado_nombre`, `encargado_contacto`, `acompanantes` (int o lista simple),
   `viene_en_auto` (bool), `necesita_luz` (bool), `estado` (pendiente | aprobado |
   rechazado), `fecha_solicitud`, `fecha_resolucion`, `comprobante_pago_url` (texto,
   ruta en Supabase Storage, nullable), `motivo_rechazo` (texto, nullable).

   La mayoría de los emprendedores paga por transferencia bancaria, así que si
   `es_gratis = false`, el comprobante se sube como parte del mismo formulario de
   postulación (no después). El organizador lo revisa junto con el resto de la
   solicitud al momento de aprobar o rechazar.

7. **actividades** — `id`, `expo_id` (FK), `nombre`, `descripcion`, `fecha`,
   `hora_inicio`, `hora_fin`, `lugar` (opcional). Es lo que alimenta el calendario
   público.

## Reglas de negocio clave (en Postgres, no en la app)

- Trigger en `puestos`: al pasar `estado` a `aprobado`, contar puestos aprobados de
  la expo (total y por tipo si existe fila en `expo_cupos_tipo`) y rechazar la
  operación si se excede `max_puestos` o el `max_cupo` del tipo. Esto es justamente
  la ventaja de tener SQL real en vez de Firestore: la integridad del cupo se
  garantiza con un constraint/trigger, no con lógica de aplicación.
- Constraint/validación en `puestos`: no se puede pasar `estado` a `aprobado` si
  `es_gratis = false` y `comprobante_pago_url` es nulo — obliga a que exista
  comprobante antes de aprobar un puesto pago.
- RLS (Row Level Security):
  - Público (rol `anon`): `SELECT` en `expos` (solo `estado = publicada`),
    `expo_horarios`, `actividades`, `recintos`. Sin acceso a datos de encargados en `puestos`.
  - Emprendedor: `SELECT` en expos publicadas; `INSERT` de sus propios puestos
    (siempre en `pendiente`); `SELECT`/`UPDATE` solo de sus propios puestos.
  - Organizador: CRUD completo sobre sus propias `expos`, `expo_horarios`,
    `expo_cupos_tipo`, `actividades`; `UPDATE` de `estado` en `puestos` únicamente
    de expos propias.
- **Storage**: bucket privado `comprobantes` (no público como las fotos de puestos).
  Solo puede leer el archivo el emprendedor dueño del puesto y el organizador de esa
  expo — nunca el público ni otros emprendedores.

## Pantallas / flujos (ideas, sin implementar aún)

- **Público**: listado/búsqueda de expos publicadas → detalle de expo (recinto,
  fechas, horarios por día, servicios, calendario de actividades).
- **Emprendedor**: listado de expos disponibles → postularse a un puesto (tipo,
  encargado, acompañantes, auto, luz, y si el puesto es pago, subir foto del
  comprobante de transferencia en el mismo formulario) → ver estado de todas sus
  postulaciones (si es rechazado, ver el motivo para poder resubir comprobante o
  corregir datos).
- **Organizador**: dashboard de sus expos → crear/editar expo (datos generales,
  recinto, horarios por día, cupos por tipo si aplica, servicios) → bandeja de
  solicitudes de puestos (ver comprobante de pago cuando aplica, aprobar/rechazar
  con motivo) → gestión del calendario de actividades.

## Próximos pasos (fuera de esta fase de ideas)

- Validar este modelo con el usuario y ajustar campos si falta algo del dominio.
- Cuando se confirme, recién ahí pasar a scaffolding real: proyecto Next.js,
  esquema SQL en Supabase, políticas RLS, y las pantallas descritas arriba.

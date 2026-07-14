# Resumen del proyecto — qué hace y cómo está construida la UI

## Qué es

**Expos** es un marketplace de ferias/expos. Los **organizadores** publican sus
propias ferias de forma independiente (fechas, horarios, recinto, servicios,
tipos de puesto y precios). Los **emprendedores** navegan todas las expos
publicadas (de cualquier organizador), se postulan a un puesto, suben su
comprobante de pago si corresponde, y el organizador aprueba o rechaza cada
solicitud desde una bandeja. El público en general puede ver expos publicadas
sin necesidad de iniciar sesión.

## Stack

- **Next.js 16** (App Router, Server Components + Server Actions, Turbopack).
- **React 19**.
- **Supabase**: Postgres (con RLS para todos los permisos), Auth
  (email/password vía `@supabase/ssr`, cookies), Storage (buckets `planos` y
  `comprobantes`).
- **Tailwind CSS v4** (tema CSS-first, sin `tailwind.config` clásico) +
  **shadcn/ui** sobre `@base-ui/react` (no Radix — ojo, `Button` no tiene
  prop `asChild`, se usa `buttonVariants()` en su lugar).
- **lucide-react** para iconos.
- Fuentes: `Fraunces` (serif variable, para títulos, clase `font-heading`) +
  `Geist` / `Geist Mono` (texto y monoespaciado) vía `next/font/google`.

## Roles y rutas principales

| Rol | Rutas | Qué hace |
|---|---|---|
| Público | `/`, `/expos/[id]` | Ver expos publicadas, calendario de actividades, sin login |
| Emprendedor | `/expos/[id]/postular` | Postularse a un puesto (con o sin selección visual en el plano) |
| Organizador | `/organizador`, `/organizador/expos/nueva`, `/organizador/expos/[id]/editar`, `/organizador/expos/[id]/plano`, `/organizador/expos/[id]/postulaciones` | Crear/editar expos, marcar puestos en el plano, revisar y aprobar/rechazar postulaciones |
| Auth | `/auth/login`, `/auth/registro` | Login/registro con rol (organizador o emprendedor) |

`src/middleware.ts` refresca la sesión de Supabase en cada request.
`src/app/organizador/layout.tsx` protege todas las rutas de organizador:
redirige a login si no hay sesión, y a `/` si el rol no es `organizador`.

## Cómo está armada la UI, pantalla por pantalla

### Layout raíz (`src/app/layout.tsx`)
Define las fuentes globales y monta `<SiteHeader>` (nav superior) en todas
las páginas. El header (`src/components/site-header.tsx`) es server component:
lee la sesión y el rol para mostrar "Iniciar sesión/Registrarme" o
"Mi panel/Cerrar sesión" según corresponda. El logo ("Expos" + ícono de
ticket) usa un color naranja fijo, independiente del acento del tema.

### Home (`src/app/page.tsx`)
Hero con textura de puntos + glow radial, y grilla de tarjetas (`Card`) con
las expos publicadas: nombre, recinto/ciudad, fecha, descripción y badges de
servicios (estacionamiento, baños, luz). Cada tarjeta linkea al detalle.

### Detalle de expo (`src/app/expos/[id]/page.tsx`)
Página pública: hero con la misma textura, info del recinto, badges de
servicios, tarjetas de "puestos disponibles" por tipo con precio/gratis,
calendario de actividades, y un botón "Postularme" (si no hay sesión, manda
primero a login con `?next=`).

### Postulación (`src/app/expos/[id]/postular/`)
`page.tsx` (server) trae la expo, los cupos por tipo y las ubicaciones del
plano (si existen), calculando ocupación/disponibilidad. `postular-form.tsx`
(client) muestra:
- Si la expo tiene plano con pines: un selector visual (clic sobre la imagen
  del plano) para elegir el puesto exacto.
- Si no: un selector de tipo de puesto simple.
- Datos de la empresa (RUT, razón social, nombre de tienda, categorías —
  checklist).
- Datos del puesto (encargado, acompañantes, auto, luz).
- Subida de comprobante de pago (obligatoria si el puesto no es gratis).

### Panel del organizador (`src/app/organizador/`)
- `page.tsx`: lista las expos propias con su estado (borrador/publicada/
  finalizada).
- `expos/nueva/` y `expos/[id]/editar/`: comparten el componente
  `src/components/expo-form.tsx`, un formulario largo dividido en secciones
  (`SeccionCard`, con ícono + título) para datos generales, recinto,
  horarios (filas dinámicas por día), servicios, y configuración por tipo de
  puesto (habilitado, gratis total, precio, cupo gratis, cupo máximo). La
  edición hace un delete+reinsert completo de horarios y cupos al guardar.
- `expos/[id]/plano/`: editor visual del plano del recinto.
  - Sube la imagen del plano (bucket público `planos`).
  - Barra de tipos habilitados (con su precio/gratis) para elegir qué tipo
    de puesto marcar.
  - Un clic sobre la imagen coloca un pin en modo **borrador** (solo en el
    navegador, sin ir a la base de datos): etiqueta correlativa por tipo
    (E-1, C-1, M-1...) y precio autocompletados según la configuración del
    tipo.
  - Botón "Guardar cambios (N)" que inserta todos los borradores de una vez
    (un solo request). Aviso visible + confirmación al cerrar/recargar si
    quedan borradores sin guardar.
  - Cada pin ya guardado se puede editar (etiqueta/precio/gratis puntual) o
    borrar individualmente; también hay "Eliminar todo" (con confirmación)
    para vaciar el plano completo.
- `expos/[id]/postulaciones/`: bandeja de solicitudes. Lista puestos
  pendientes y resueltos, con datos del solicitante, categorías, comprobante
  (URL firmada temporal desde el bucket privado `comprobantes`), y botones
  Aprobar/Rechazar (con motivo opcional).

## Sistema visual (tema)

Definido en `src/app/globals.css` con variables CSS (`@theme inline` +
tokens en `:root`). Paleta actual: fondo navy oscuro (`#111827`), texto
off-white, acento primario teal (`#14B8A6`), tags/badges en gris pálido con
texto oscuro, y tarjetas con efecto **glass** real (`backdrop-filter: blur`
aplicado en el componente `Card`, no solo un color plano). Fondo con textura
de puntos + glow radial gris frío en las secciones "hero". El radio de
esquinas es más grande que el default de shadcn (`--radius: 0.85rem`) para
un look más suave.

## Server Actions y datos

Cada flujo mutable vive en un `actions.ts` junto a su página (`"use server"`),
usando el cliente Supabase de `src/lib/supabase/server.ts` (basado en
cookies, respeta RLS). Los tipos compartidos están en `src/lib/types.ts`
(roles, estados, tipos de puesto, categorías). Los permisos reales — quién
puede ver/crear/editar qué — están en Postgres (RLS), no en la app; la app
solo confía en que la base rechace lo que no corresponde.

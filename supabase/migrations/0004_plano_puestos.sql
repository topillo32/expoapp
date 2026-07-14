-- Plano del recinto con pines por puesto: el organizador sube una imagen del
-- croquis y marca a mano cada puesto fisico (posicion relativa 0-1, para que
-- el pin quede bien puesto sin importar el tamano de pantalla).

alter table expos
  add column if not exists plano_url text;

create table ubicaciones_puesto (
  id uuid primary key default gen_random_uuid(),
  expo_id uuid not null references expos(id) on delete cascade,
  tipo_puesto tipo_puesto not null,
  pos_x numeric(6, 4) not null check (pos_x >= 0 and pos_x <= 1),
  pos_y numeric(6, 4) not null check (pos_y >= 0 and pos_y <= 1),
  etiqueta text,
  es_gratis boolean not null default false,
  precio numeric(10, 2),
  creado_en timestamptz not null default now(),
  check (es_gratis = true or precio is not null)
);

-- Postulacion a un lugar fisico especifico del plano (opcional: si la expo no
-- usa plano, esta columna queda nula y todo sigue funcionando por tipo, como
-- hasta ahora).
alter table puestos
  add column if not exists ubicacion_id uuid references ubicaciones_puesto(id);

-- Un mismo lugar del plano no puede tener dos postulaciones activas a la vez
-- (evita que dos emprendedores se queden con el mismo pin por una condicion
-- de carrera entre el chequeo de disponibilidad y el insert).
create unique index ubicacion_activa_unica on puestos (ubicacion_id)
  where ubicacion_id is not null and estado in ('pendiente', 'aprobado');

alter table ubicaciones_puesto enable row level security;

create policy "ubicaciones: lectura publica o propia" on ubicaciones_puesto for select using (
  exists (
    select 1 from expos e
    where e.id = ubicaciones_puesto.expo_id
      and (e.estado = 'publicada' or e.organizador_id = auth.uid())
  )
);

create policy "ubicaciones: escritura organizador" on ubicaciones_puesto for all using (
  exists (select 1 from expos e where e.id = ubicaciones_puesto.expo_id and e.organizador_id = auth.uid())
);

-- Bucket publico para la imagen del plano (a diferencia de "comprobantes",
-- que es privado). Ruta de archivo: {expo_id}/plano.<ext>
insert into storage.buckets (id, name, public)
values ('planos', 'planos', true)
on conflict (id) do nothing;

create policy "planos: organizador sube el propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'planos'
  and exists (
    select 1 from expos e
    where e.id::text = (storage.foldername(name))[1] and e.organizador_id = auth.uid()
  )
);

create policy "planos: organizador actualiza el propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'planos'
  and exists (
    select 1 from expos e
    where e.id::text = (storage.foldername(name))[1] and e.organizador_id = auth.uid()
  )
);

create policy "planos: organizador borra el propio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'planos'
  and exists (
    select 1 from expos e
    where e.id::text = (storage.foldername(name))[1] and e.organizador_id = auth.uid()
  )
);

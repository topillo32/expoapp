-- Esquema inicial de la plataforma de Expos
-- Basado en docs/modelo-datos.md

create extension if not exists "pgcrypto";

create type rol_usuario as enum ('organizador', 'emprendedor');
create type estado_expo as enum ('borrador', 'publicada', 'finalizada');
create type tipo_puesto as enum ('emprendedor', 'comida', 'merchandising');
create type estado_puesto as enum ('pendiente', 'aprobado', 'rechazado');

create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null,
  contacto text,
  creado_en timestamptz not null default now()
);

create table recintos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text not null,
  ciudad text not null,
  capacidad int,
  creado_por uuid references perfiles(id),
  creado_en timestamptz not null default now()
);

create table expos (
  id uuid primary key default gen_random_uuid(),
  organizador_id uuid not null references perfiles(id),
  recinto_id uuid not null references recintos(id),
  nombre text not null,
  descripcion text,
  fecha_inicio date not null,
  fecha_fin date not null,
  max_puestos int not null check (max_puestos > 0),
  tiene_estacionamiento boolean not null default false,
  tiene_banos boolean not null default false,
  banos_gratis boolean,
  tiene_luz boolean not null default false,
  estado estado_expo not null default 'borrador',
  creado_en timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);

create table expo_horarios (
  id uuid primary key default gen_random_uuid(),
  expo_id uuid not null references expos(id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  check (hora_fin > hora_inicio)
);

create table expo_cupos_tipo (
  id uuid primary key default gen_random_uuid(),
  expo_id uuid not null references expos(id) on delete cascade,
  tipo_puesto tipo_puesto not null,
  max_cupo int check (max_cupo > 0),
  unique (expo_id, tipo_puesto)
);

create table puestos (
  id uuid primary key default gen_random_uuid(),
  expo_id uuid not null references expos(id) on delete cascade,
  emprendedor_id uuid not null references perfiles(id),
  tipo tipo_puesto not null,
  es_gratis boolean not null default false,
  precio numeric(10, 2),
  encargado_nombre text not null,
  encargado_contacto text not null,
  acompanantes int not null default 0,
  viene_en_auto boolean not null default false,
  necesita_luz boolean not null default false,
  estado estado_puesto not null default 'pendiente',
  comprobante_pago_url text,
  motivo_rechazo text,
  fecha_solicitud timestamptz not null default now(),
  fecha_resolucion timestamptz,
  check (es_gratis = true or precio is not null)
);

create table actividades (
  id uuid primary key default gen_random_uuid(),
  expo_id uuid not null references expos(id) on delete cascade,
  nombre text not null,
  descripcion text,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  lugar text,
  check (hora_fin > hora_inicio)
);

-- Antes de aprobar un puesto: exige comprobante si es pago, y respeta los cupos
-- (total de la expo y, si existe, el cupo especifico del tipo de puesto).
create or replace function validar_aprobacion_puesto()
returns trigger as $$
declare
  v_max_puestos int;
  v_aprobados_total int;
  v_max_cupo_tipo int;
  v_aprobados_tipo int;
begin
  if new.estado = 'aprobado' and (old.estado is distinct from 'aprobado') then
    if new.es_gratis = false and new.comprobante_pago_url is null then
      raise exception 'No se puede aprobar un puesto pago sin comprobante de pago';
    end if;

    select max_puestos into v_max_puestos from expos where id = new.expo_id;
    select count(*) into v_aprobados_total from puestos
      where expo_id = new.expo_id and estado = 'aprobado' and id <> new.id;

    if v_aprobados_total + 1 > v_max_puestos then
      raise exception 'Se alcanzo el maximo de puestos de la expo';
    end if;

    select max_cupo into v_max_cupo_tipo from expo_cupos_tipo
      where expo_id = new.expo_id and tipo_puesto = new.tipo;

    if v_max_cupo_tipo is not null then
      select count(*) into v_aprobados_tipo from puestos
        where expo_id = new.expo_id and tipo = new.tipo and estado = 'aprobado' and id <> new.id;

      if v_aprobados_tipo + 1 > v_max_cupo_tipo then
        raise exception 'Se alcanzo el cupo maximo para el tipo de puesto %', new.tipo;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_validar_aprobacion_puesto
before insert or update on puestos
for each row execute function validar_aprobacion_puesto();

-- Row Level Security

alter table perfiles enable row level security;
alter table recintos enable row level security;
alter table expos enable row level security;
alter table expo_horarios enable row level security;
alter table expo_cupos_tipo enable row level security;
alter table puestos enable row level security;
alter table actividades enable row level security;

create policy "perfiles: ver el propio" on perfiles for select using (auth.uid() = id);
create policy "perfiles: crear el propio" on perfiles for insert with check (auth.uid() = id);
create policy "perfiles: editar el propio" on perfiles for update using (auth.uid() = id);

create policy "recintos: lectura publica" on recintos for select using (true);
create policy "recintos: crear organizador" on recintos for insert to authenticated with check (
  exists (select 1 from perfiles where id = auth.uid() and rol = 'organizador')
);

create policy "expos: lectura publica o propia" on expos for select using (
  estado = 'publicada' or organizador_id = auth.uid()
);
create policy "expos: crear organizador" on expos for insert to authenticated with check (
  organizador_id = auth.uid()
);
create policy "expos: editar propias" on expos for update using (organizador_id = auth.uid());

create policy "expo_horarios: lectura publica o propia" on expo_horarios for select using (
  exists (
    select 1 from expos e
    where e.id = expo_horarios.expo_id
      and (e.estado = 'publicada' or e.organizador_id = auth.uid())
  )
);
create policy "expo_horarios: escritura organizador" on expo_horarios for all using (
  exists (select 1 from expos e where e.id = expo_horarios.expo_id and e.organizador_id = auth.uid())
);

create policy "expo_cupos_tipo: lectura publica o propia" on expo_cupos_tipo for select using (
  exists (
    select 1 from expos e
    where e.id = expo_cupos_tipo.expo_id
      and (e.estado = 'publicada' or e.organizador_id = auth.uid())
  )
);
create policy "expo_cupos_tipo: escritura organizador" on expo_cupos_tipo for all using (
  exists (select 1 from expos e where e.id = expo_cupos_tipo.expo_id and e.organizador_id = auth.uid())
);

create policy "puestos: emprendedor u organizador ven" on puestos for select using (
  emprendedor_id = auth.uid()
  or exists (select 1 from expos e where e.id = puestos.expo_id and e.organizador_id = auth.uid())
);
create policy "puestos: emprendedor postula" on puestos for insert to authenticated with check (
  emprendedor_id = auth.uid()
);
create policy "puestos: emprendedor edita pendientes" on puestos for update using (
  emprendedor_id = auth.uid() and estado = 'pendiente'
);
create policy "puestos: organizador resuelve" on puestos for update using (
  exists (select 1 from expos e where e.id = puestos.expo_id and e.organizador_id = auth.uid())
);

create policy "actividades: lectura publica o propia" on actividades for select using (
  exists (
    select 1 from expos e
    where e.id = actividades.expo_id
      and (e.estado = 'publicada' or e.organizador_id = auth.uid())
  )
);
create policy "actividades: escritura organizador" on actividades for all using (
  exists (select 1 from expos e where e.id = actividades.expo_id and e.organizador_id = auth.uid())
);

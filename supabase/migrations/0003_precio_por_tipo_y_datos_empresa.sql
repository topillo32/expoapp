-- El organizador define, por tipo de puesto, si es gratis o de pago (y cuantos
-- cupos gratis reserva dentro de ese tipo). El emprendedor ya no declara su
-- propio precio: lo hereda de la configuracion de la expo.

alter table expo_cupos_tipo
  add column if not exists gratis_total boolean not null default false,
  add column if not exists cupo_gratis int not null default 0,
  add column if not exists precio numeric(10, 2);

-- Datos minimos de la empresa que se piden siempre al postular, y si el
-- emprendedor esta pidiendo uno de los cupos gratis reservados (cuando aplica).
alter table puestos
  add column if not exists rut text,
  add column if not exists razon_social text,
  add column if not exists nombre_tienda text,
  add column if not exists categorias text[] not null default '{}',
  add column if not exists quiere_cupo_gratis boolean not null default false;

-- Reemplaza la funcion de validacion para sumar el control del cupo_gratis
-- por tipo, ademas de lo que ya validaba (max_puestos y max_cupo por tipo).
create or replace function validar_aprobacion_puesto()
returns trigger as $$
declare
  v_max_puestos int;
  v_aprobados_total int;
  v_max_cupo_tipo int;
  v_aprobados_tipo int;
  v_cupo_gratis int;
  v_aprobados_gratis int;
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

    select max_cupo, cupo_gratis into v_max_cupo_tipo, v_cupo_gratis
      from expo_cupos_tipo
      where expo_id = new.expo_id and tipo_puesto = new.tipo;

    if v_max_cupo_tipo is not null then
      select count(*) into v_aprobados_tipo from puestos
        where expo_id = new.expo_id and tipo = new.tipo and estado = 'aprobado' and id <> new.id;

      if v_aprobados_tipo + 1 > v_max_cupo_tipo then
        raise exception 'Se alcanzo el cupo maximo para el tipo de puesto %', new.tipo;
      end if;
    end if;

    if new.es_gratis and v_cupo_gratis is not null and v_cupo_gratis > 0 then
      select count(*) into v_aprobados_gratis from puestos
        where expo_id = new.expo_id and tipo = new.tipo and estado = 'aprobado'
          and es_gratis and id <> new.id;

      if v_aprobados_gratis + 1 > v_cupo_gratis then
        raise exception 'Se alcanzo el cupo gratis para el tipo de puesto %', new.tipo;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Bucket privado para comprobantes de pago (a diferencia de fotos de puestos,
-- que serian publicas). Cada archivo se guarda en la ruta {user_id}/archivo.
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "comprobantes: el dueno sube el propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'comprobantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "comprobantes: dueno u organizador leen"
on storage.objects for select to authenticated
using (
  bucket_id = 'comprobantes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from puestos p
      join expos e on e.id = p.expo_id
      where p.comprobante_pago_url = name
        and e.organizador_id = auth.uid()
    )
  )
);

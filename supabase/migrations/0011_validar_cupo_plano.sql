-- El organizador podia marcar en el plano mas puestos que el "maximo de
-- puestos" o el cupo por tipo definidos en la expo (esa validacion solo
-- existia al aprobar una postulacion, no al marcar el pin fisico). Se agrega
-- el mismo tipo de trigger que ya usa "puestos" para que el cupo configurado
-- se respete tambien aca.

create or replace function validar_cupo_ubicacion_puesto()
returns trigger as $$
declare
  v_max_puestos int;
  v_total int;
  v_max_cupo_tipo int;
  v_total_tipo int;
begin
  select max_puestos into v_max_puestos from expos where id = new.expo_id;
  select count(*) into v_total from ubicaciones_puesto where expo_id = new.expo_id;

  if v_total + 1 > v_max_puestos then
    raise exception 'Se alcanzo el maximo de puestos de la expo (%)', v_max_puestos;
  end if;

  select max_cupo into v_max_cupo_tipo from expo_cupos_tipo
    where expo_id = new.expo_id and tipo_puesto = new.tipo_puesto;

  if v_max_cupo_tipo is not null then
    select count(*) into v_total_tipo from ubicaciones_puesto
      where expo_id = new.expo_id and tipo_puesto = new.tipo_puesto;

    if v_total_tipo + 1 > v_max_cupo_tipo then
      raise exception 'Se alcanzo el cupo maximo para el tipo de puesto %', new.tipo_puesto;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_validar_cupo_ubicacion_puesto
before insert on ubicaciones_puesto
for each row execute function validar_cupo_ubicacion_puesto();

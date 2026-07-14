-- Permite que un organizador vea el perfil (nombre, contacto) de los
-- emprendedores que se postularon a alguna de sus expos. Sin esto, la
-- bandeja de solicitudes no podria mostrar quien es el solicitante, porque
-- la politica de "perfiles" solo dejaba ver el propio perfil.

create policy "perfiles: organizador ve a quienes postularon"
on perfiles for select
using (
  exists (
    select 1 from puestos p
    join expos e on e.id = p.expo_id
    where p.emprendedor_id = perfiles.id
      and e.organizador_id = auth.uid()
  )
);

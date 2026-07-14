-- La causa real del error de RLS al subir el plano: "upload(..., { upsert: true })"
-- se traduce en un INSERT ... ON CONFLICT DO UPDATE, y Postgres exige que el rol
-- tenga tambien una politica de SELECT sobre la tabla ademas de INSERT/UPDATE,
-- o rechaza la operacion citando row-level security (aunque el INSERT en si
-- seria valido). El bucket "comprobantes" ya tenia su politica de SELECT; a
-- "planos" nunca se le agrego una, y por eso ningun ajuste al INSERT arreglaba
-- nada.

create policy "planos: lectura publica"
on storage.objects for select
using (bucket_id = 'planos');

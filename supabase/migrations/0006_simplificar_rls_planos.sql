-- Simplifica las politicas de Storage del bucket "planos": en vez de
-- verificar la propiedad de la expo con un EXISTS/JOIN contra la tabla
-- "expos" (que puede fallar dentro del motor de Storage), la ruta del
-- archivo ahora empieza con el id del organizador, y la politica solo
-- compara eso directamente -- igual que ya funciona para "comprobantes".
--
-- Nueva convencion de ruta: {organizador_id}/{expo_id}/plano.<ext>

drop policy if exists "planos: organizador sube el propio" on storage.objects;
drop policy if exists "planos: organizador actualiza el propio" on storage.objects;
drop policy if exists "planos: organizador borra el propio" on storage.objects;

create policy "planos: organizador sube el propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'planos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "planos: organizador actualiza el propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'planos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "planos: organizador borra el propio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'planos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

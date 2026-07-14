-- Reintento definitivo de las politicas de Storage para "planos", evitando
-- storage.foldername() por completo (para no depender de su comportamiento
-- exacto) y usando una comparacion de texto directa: el archivo debe
-- guardarse en una ruta que empiece exactamente con "{auth.uid()}/".

drop policy if exists "planos: organizador sube el propio" on storage.objects;
drop policy if exists "planos: organizador actualiza el propio" on storage.objects;
drop policy if exists "planos: organizador borra el propio" on storage.objects;

create policy "planos: organizador sube el propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'planos'
  and name like (auth.uid()::text || '/%')
);

create policy "planos: organizador actualiza el propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'planos'
  and name like (auth.uid()::text || '/%')
);

create policy "planos: organizador borra el propio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'planos'
  and name like (auth.uid()::text || '/%')
);

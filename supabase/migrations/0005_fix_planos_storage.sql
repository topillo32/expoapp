-- Re-asegura el bucket "planos" y sus políticas de Storage de forma segura
-- para volver a correr (por si la migración anterior no llegó a crearlas
-- completas). Si algo de esto ya existía, no rompe nada.

insert into storage.buckets (id, name, public)
values ('planos', 'planos', true)
on conflict (id) do update set public = true;

drop policy if exists "planos: organizador sube el propio" on storage.objects;
drop policy if exists "planos: organizador actualiza el propio" on storage.objects;
drop policy if exists "planos: organizador borra el propio" on storage.objects;

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

-- Flyer/imagen promocional de la expo: se sube al crear/editar la expo y se
-- previsualiza en la bandeja publica de ferias (portada) y en el detalle.
-- Mismo patron que el bucket "planos": publico para lectura, escritura solo
-- del organizador dueno, ruta {organizador_id}/{expo_id}/flyer.<ext>.

alter table expos
  add column if not exists flyer_url text;

insert into storage.buckets (id, name, public)
values ('flyers', 'flyers', true)
on conflict (id) do nothing;

create policy "flyers: lectura publica"
on storage.objects for select
using (bucket_id = 'flyers');

create policy "flyers: organizador sube el propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'flyers'
  and name like (auth.uid()::text || '/%')
);

create policy "flyers: organizador actualiza el propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'flyers'
  and name like (auth.uid()::text || '/%')
);

create policy "flyers: organizador borra el propio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'flyers'
  and name like (auth.uid()::text || '/%')
);

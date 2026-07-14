-- Crea automaticamente la fila en `perfiles` cuando alguien se registra
-- (auth.users). Se usa security definer porque en ese momento el usuario
-- todavia no tiene una sesion RLS activa para insertar su propio perfil.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre, rol, contacto)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce((new.raw_user_meta_data ->> 'rol')::rol_usuario, 'emprendedor'),
    new.raw_user_meta_data ->> 'contacto'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

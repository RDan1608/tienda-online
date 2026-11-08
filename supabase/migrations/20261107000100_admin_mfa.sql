-- Verificación en dos pasos (TOTP) para la admin. Si la cuenta tiene un factor verificado, la base solo
-- le da poderes de admin a sesiones que pasaron el segundo paso (aal2). Sin factor, todo sigue igual,
-- así que activarlo es opcional y no deja a nadie fuera.
create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
     and (
       coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
       or not exists (
         select 1 from auth.mfa_factors f
          where f.user_id = (select auth.uid()) and f.status = 'verified'
       )
     );
$$;

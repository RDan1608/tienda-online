-- El intento fallido se registraba y enseguida se lanzaba un error: el error deshacía el registro,
-- así que el límite de intentos nunca se activaba. Ahora "no encontrado" se devuelve como resultado
-- (no como error) y el intento fallido se conserva.
create or replace function public.track_order(p_code text, p_phone text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_code   text := upper(trim(p_code));
  v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 8);
  v_order  public.orders;
  v_result jsonb;
begin
  if char_length(v_code) not between 4 and 20 or char_length(v_digits) < 8 then
    raise exception 'Revisa el código y el teléfono' using errcode = 'P0003';
  end if;

  if (select count(*) from public.track_attempts
       where code = v_code and not ok and at > now() - interval '15 minutes') >= 5 then
    raise exception 'Demasiados intentos, espera unos minutos' using errcode = 'P0004';
  end if;

  select * into v_order from public.orders
   where code = v_code
     and right(regexp_replace(phone, '\D', '', 'g'), 8) = v_digits;

  if not found then
    insert into public.track_attempts (code, ok) values (v_code, false);
    return jsonb_build_object('error', 'not_found');
  end if;

  insert into public.track_attempts (code, ok) values (v_code, true);

  select jsonb_build_object(
    'code', v_order.code,
    'status', v_order.status,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'customer', split_part(v_order.customer_name, ' ', 1),
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', name_snapshot, 'qty', qty, 'price', price_snapshot) order by name_snapshot)
                         from public.order_items where order_id = v_order.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'note', note, 'at', created_at) order by created_at)
                          from public.order_events where order_id = v_order.id), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- Limpieza: los intentos de más de un día no sirven para nada.
delete from public.track_attempts where at < now() - interval '1 day';

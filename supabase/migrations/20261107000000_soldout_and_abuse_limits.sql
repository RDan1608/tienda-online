-- 1) Colores agotados: `colors` guarda solo los DISPONIBLES (lo que ve y elige el público);
--    `colors_out` guarda los agotados para que la admin pueda reactivarlos con un toque.
alter table public.products add column if not exists colors_out text[] not null default '{}';

-- 2) Límites contra abuso. create_order() se puede llamar directo desde la API pública (con la llave
--    pública), saltándose el captcha de la web, así que el límite tiene que vivir aquí:
--    - por teléfono (solo dígitos: "+504 9999-9999" y "99999999" cuentan como el mismo)
--    - global (tope de pedidos por ventana, sin importar el teléfono)
create or replace function public.create_order(
  p_customer_name text,
  p_phone         text,
  p_email         text,
  p_notes         text,
  p_items         jsonb
)
returns table (order_id uuid, order_code text, order_total numeric)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_code     text;
  v_total    numeric(10, 2);
  v_expected int;
  v_found    int;
  v_bad      text;
  v_digits   text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 8);
begin
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido' using errcode = '22023';
  end if;

  if char_length(v_digits) < 8 then
    raise exception 'Teléfono inválido' using errcode = '22023';
  end if;

  if (select count(*) from public.orders
      where right(regexp_replace(phone, '\D', '', 'g'), 8) = v_digits
        and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Demasiados pedidos, intenta en unos minutos' using errcode = 'P0001';
  end if;

  if (select count(*) from public.orders
      where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'Estamos recibiendo muchos pedidos, intenta en unos minutos' using errcode = 'P0001';
  end if;

  create temp table _items on commit drop as
    select (i->>'product_id')::uuid           as product_id,
           nullif(trim(i->>'color'), '')      as color,
           sum((i->>'qty')::int)              as qty
    from jsonb_array_elements(p_items) as i
    group by 1, 2;

  if exists (select 1 from _items where qty < 1 or qty > 99) then
    raise exception 'Cantidad inválida' using errcode = '22023';
  end if;

  select count(distinct product_id) into v_expected from _items;
  select count(distinct it.product_id) into v_found
    from _items it join public.products p on p.id = it.product_id and p.is_active;
  if v_found <> v_expected then
    raise exception 'Algún producto ya no está disponible' using errcode = 'P0002';
  end if;

  -- Producto que tenía colores y ya se agotaron todos: no se puede pedir.
  select p.name into v_bad
    from _items it join public.products p on p.id = it.product_id
   where cardinality(p.colors) = 0 and cardinality(p.colors_out) > 0
   limit 1;
  if v_bad is not null then
    raise exception '% está agotado', v_bad using errcode = 'P0002';
  end if;

  -- Si el producto tiene colores, hay que elegir uno disponible.
  select p.name || ' · ' || coalesce(it.color, 'sin color') into v_bad
    from _items it join public.products p on p.id = it.product_id
   where cardinality(p.colors) > 0 and (it.color is null or not (it.color = any (p.colors)))
   limit 1;
  if v_bad is not null then
    raise exception 'Color no disponible o sin elegir: %', v_bad using errcode = 'P0002';
  end if;
  update _items it set color = null
    from public.products p
   where p.id = it.product_id and cardinality(p.colors) = 0 and it.color is not null;

  select sum(p.price * it.qty) into v_total
    from _items it join public.products p on p.id = it.product_id;

  v_code := 'P-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (code, customer_name, phone, email, notes, total)
  values (v_code, trim(p_customer_name), trim(p_phone),
          nullif(trim(p_email), ''), nullif(trim(p_notes), ''), v_total)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, name_snapshot, price_snapshot, qty, color)
  select v_order_id, p.id,
         p.name || coalesce(' · ' || it.color, ''),
         p.price, sum(it.qty), it.color
  from _items it join public.products p on p.id = it.product_id
  group by p.id, p.name, p.price, it.color;

  return query select v_order_id, v_code, v_total;
end;
$$;

revoke execute on function public.create_order(text, text, text, text, jsonb) from public;
grant  execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

-- 3) track_order: cada consulta fallida guardaba una fila sin tope (alguien podía llenar la base).
--    Ahora hay tope global por minuto y se limpian las filas viejas.
create index if not exists track_attempts_at_idx on public.track_attempts (at);

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

  if random() < 0.02 then
    delete from public.track_attempts where at < now() - interval '1 day';
  end if;

  if (select count(*) from public.track_attempts
       where code = v_code and not ok and at > now() - interval '15 minutes') >= 5
     or (select count(*) from public.track_attempts
          where not ok and at > now() - interval '1 minute') >= 120 then
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

  -- Sin datos del lote: es una regla interna (ver hide_batch_numbers).
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

revoke execute on function public.track_order(text, text) from public;
grant  execute on function public.track_order(text, text) to anon, authenticated;

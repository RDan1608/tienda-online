-- Colores por producto: el admin define cuáles hay y quien pide elige uno.
-- El color elegido se guarda en el pedido (order_items.color) y también en el nombre del renglón
-- ("Peluche X · Rosa"), así cualquier pantalla que ya muestre el nombre lo muestra sin cambios.
alter table public.products    add column if not exists colors text[] not null default '{}';
alter table public.order_items add column if not exists color  text;

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
begin
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido' using errcode = '22023';
  end if;

  -- Anti-spam: máx. 3 pedidos por teléfono cada 10 minutos.
  if (select count(*) from public.orders
      where phone = trim(p_phone)
        and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Demasiados pedidos, intenta en unos minutos' using errcode = 'P0001';
  end if;

  -- Normaliza items (agrupa duplicados por producto y color) y valida contra productos activos.
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

  -- Si el producto tiene colores, hay que elegir uno de ellos; si no tiene, no se guarda ninguno.
  select p.name into v_bad
    from _items it join public.products p on p.id = it.product_id
   where (cardinality(p.colors) > 0 and (it.color is null or not (it.color = any (p.colors))))
   limit 1;
  if v_bad is not null then
    raise exception 'Elige un color para %', v_bad using errcode = 'P0002';
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

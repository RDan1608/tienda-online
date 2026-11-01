-- ---------- "Más vendidos" cuenta también las etapas nuevas ----------------
create or replace function public.sync_sold_count()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_was boolean := old.status in ('confirmado', 'preparando', 'en_camino', 'listo', 'entregado');
  v_is  boolean := new.status in ('confirmado', 'preparando', 'en_camino', 'listo', 'entregado');
begin
  if v_was = v_is then
    return new;
  end if;

  update public.products p
     set sold_count = greatest(0, p.sold_count + case when v_is then s.qty else -s.qty end)
    from (select product_id, sum(qty)::int as qty
            from public.order_items
           where order_id = new.id and product_id is not null
           group by product_id) s
   where p.id = s.product_id;

  return new;
end;
$$;

-- ---------- Historial de estados (alimenta la línea de tiempo) -----------
create table public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  note       text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;
create policy "order_events: admin lee/edita"
  on public.order_events for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create or replace function public.log_order_event()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  return null;
end;
$$;

create trigger orders_log_event_ins after insert on public.orders
  for each row execute function public.log_order_event();
create trigger orders_log_event_upd after update of status on public.orders
  for each row execute function public.log_order_event();

-- Pedidos que ya existían: su primer evento es su creación.
insert into public.order_events (order_id, status, created_at)
select id, status, created_at from public.orders o
where not exists (select 1 from public.order_events e where e.order_id = o.id);

-- ---------- Consultar un pedido (código + teléfono) --------------------------
-- El teléfono funciona como segunda llave: sin él no se ve nada. Los intentos fallidos se limitan.
create table public.track_attempts (
  id      bigint generated always as identity primary key,
  code    text not null,
  ok      boolean not null,
  at      timestamptz not null default now()
);
create index track_attempts_code_idx on public.track_attempts (code, at desc);
alter table public.track_attempts enable row level security; -- sin policies: solo la función accede

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
    raise exception 'No encontramos un pedido con ese código y teléfono' using errcode = 'P0003';
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

revoke execute on function public.track_order(text, text) from public;
grant  execute on function public.track_order(text, text) to anon, authenticated;

-- ---------- Etiquetas administradas ---------------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 30 and name = lower(name)),
  created_at timestamptz not null default now()
);
create unique index tags_name_idx on public.tags (name);
alter table public.tags enable row level security;
create policy "tags: admin lee/edita"
  on public.tags for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Las etiquetas que ya usan los productos pasan a la lista administrable.
insert into public.tags (name)
select distinct t from public.products, unnest(tags) as t
where char_length(t) between 1 and 30 and t = lower(t)
on conflict do nothing;

-- Renombrar / borrar se refleja en todos los productos (security invoker: solo admin puede por RLS).
create or replace function public.rename_tag(p_old text, p_new text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.tags set name = p_new where name = p_old;
  update public.products
     set tags = array(select distinct x from unnest(array_replace(tags, p_old, p_new)) as x)
   where p_old = any (tags);
end;
$$;

create or replace function public.delete_tag(p_name text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.tags where name = p_name;
  update public.products set tags = array_remove(tags, p_name) where p_name = any (tags);
end;
$$;

revoke execute on function public.rename_tag(text, text), public.delete_tag(text) from public, anon;
grant  execute on function public.rename_tag(text, text), public.delete_tag(text) to authenticated;

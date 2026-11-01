-- ---------- Lotes: se reúnen pedidos hasta llegar a un mínimo, y entonces se compra --------------
-- Hay un solo lote abierto a la vez. Todo pedido nuevo entra al lote abierto. Cuando se junta el mínimo,
-- la admin cierra el lote ("pedido al proveedor") y se abre el siguiente.
create table public.batches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  min_orders int  not null check (min_orders between 1 and 1000),
  status     text not null default 'abierto' check (status in ('abierto', 'cerrado')),
  deadline   date,
  closed_at  timestamptz,
  created_at timestamptz not null default now()
);

-- Solo puede haber un lote abierto.
create unique index batches_one_open on public.batches (status) where status = 'abierto';

alter table public.batches enable row level security;
create policy "batches: admin lee/edita"
  on public.batches for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

alter table public.orders add column batch_id uuid references public.batches (id) on delete set null;
create index orders_batch_idx on public.orders (batch_id, status);

-- Cada pedido nuevo entra al lote abierto (si hay uno).
create or replace function public.assign_order_batch()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.batch_id is null then
    select id into new.batch_id from public.batches where status = 'abierto' limit 1;
  end if;
  return new;
end;
$$;

create trigger orders_assign_batch before insert on public.orders
  for each row execute function public.assign_order_batch();

-- Lote inicial: lo que ya existe entra en él (la admin puede cambiar el mínimo cuando quiera).
insert into public.batches (name, min_orders) values ('Lote 1', 10);
update public.orders
   set batch_id = (select id from public.batches where status = 'abierto')
 where batch_id is null and status <> 'cancelado';

-- ---------- Progreso del lote abierto (público: solo números, sin datos de nadie) ----------
create or replace function public.open_batch()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', b.name,
    'min_orders', b.min_orders,
    'deadline', b.deadline,
    'count', (select count(*) from public.orders o where o.batch_id = b.id and o.status <> 'cancelado')
  )
  from public.batches b
  where b.status = 'abierto'
  limit 1;
$$;
revoke execute on function public.open_batch() from public;
grant  execute on function public.open_batch() to anon, authenticated;

-- ---------- Cerrar el lote: se hace el pedido al proveedor ----------
-- Los pedidos CONFIRMADOS pasan a "Pedido realizado". Los que siguen sin confirmar pasan al lote nuevo.
create or replace function public.close_batch(p_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_next uuid;
  v_min  int;
begin
  select min_orders into v_min from public.batches where id = p_id and status = 'abierto';
  if not found then
    raise exception 'El lote ya está cerrado' using errcode = 'P0001';
  end if;

  update public.batches set status = 'cerrado', closed_at = now() where id = p_id;

  insert into public.batches (name, min_orders)
  values ('Lote ' || ((select count(*) from public.batches) + 1), v_min)
  returning id into v_next;

  update public.orders set batch_id = v_next where batch_id = p_id and status = 'nuevo';
  update public.orders set status = 'preparando' where batch_id = p_id and status = 'confirmado';

  return v_next;
end;
$$;

-- ---------- Avanzar todos los pedidos de un lote cerrado de una vez ----------
-- Solo mueve hacia adelante (el orden de las etapas es el del enum) y nunca toca cancelados.
create or replace function public.advance_batch(p_id uuid, p_status public.order_status)
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_n int;
begin
  if p_status not in ('en_camino', 'listo', 'entregado') then
    raise exception 'Etapa inválida' using errcode = '22023';
  end if;
  update public.orders
     set status = p_status
   where batch_id = p_id
     and status > 'confirmado'
     and status < p_status;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke execute on function public.close_batch(uuid), public.advance_batch(uuid, public.order_status) from public, anon;
grant  execute on function public.close_batch(uuid), public.advance_batch(uuid, public.order_status) to authenticated;

-- ---------- El seguimiento del cliente incluye su lote ----------
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
                          from public.order_events where order_id = v_order.id), '[]'::jsonb),
    'batch', (select jsonb_build_object(
                'name', b.name,
                'status', b.status,
                'min_orders', b.min_orders,
                'deadline', b.deadline,
                'count', (select count(*) from public.orders o where o.batch_id = b.id and o.status <> 'cancelado'))
              from public.batches b where b.id = v_order.batch_id)
  ) into v_result;

  return v_result;
end;
$$;

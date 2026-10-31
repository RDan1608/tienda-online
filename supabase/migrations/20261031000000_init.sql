-- =====================================================================
-- Tienda online: esquema inicial
-- Ejecutar en Supabase → SQL Editor (una sola vez, en orden).
-- Público (anon): lee catálogo activo + crea pedidos vía RPC create_order.
-- Admin (authenticated + fila en public.admins): todo lo demás.
-- =====================================================================

-- ---------- Admins ----------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins: ver propia fila"
  on public.admins for select to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Utilidad updated_at ----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Categorías -------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: lectura pública"
  on public.categories for select to anon, authenticated
  using (true);

create policy "categories: admin escribe"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Productos --------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '',
  price       numeric(10, 2) not null check (price >= 0),  -- Lempiras (HNL)
  tags        text[] not null default '{}',
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  sold_count  int not null default 0,                       -- mantenido por trigger
  search      tsvector generated always as (
                to_tsvector('spanish'::regconfig, name || ' ' || description)
              ) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_active_idx   on public.products (is_active, created_at desc);
create index products_sold_idx     on public.products (sold_count desc);
create index products_tags_idx     on public.products using gin (tags);
create index products_search_idx   on public.products using gin (search);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "products: público ve activos"
  on public.products for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "products: admin escribe"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Imágenes de producto ---------------------------------------
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path       text not null,           -- ruta dentro del bucket "products"
  alt        text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

create policy "product_images: lectura si producto visible"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.is_active or public.is_admin())
  ));

create policy "product_images: admin escribe"
  on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Pedidos ----------------------------------------------------
create type public.order_status as enum
  ('nuevo', 'confirmado', 'preparando', 'entregado', 'cancelado');

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone         text not null check (char_length(phone) between 8 and 20),
  email         text check (email is null or char_length(email) <= 254),
  notes         text check (notes is null or char_length(notes) <= 1000),
  status        public.order_status not null default 'nuevo',
  total         numeric(10, 2) not null check (total >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index orders_status_idx  on public.orders (status, created_at desc);
create index orders_phone_idx   on public.orders (phone, created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  name_snapshot  text not null,
  price_snapshot numeric(10, 2) not null,
  qty            int not null check (qty between 1 and 99)
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Sin policy de insert: el público solo crea pedidos vía create_order().
create policy "orders: admin lee/edita"
  on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "order_items: admin lee/edita"
  on public.order_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- RPC: crear pedido (único punto de escritura pública) -------
-- p_items: [{"product_id": "<uuid>", "qty": 2}, ...]
-- Precios se toman SIEMPRE de la BD, nunca del cliente.
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

  -- Normaliza items (agrupa duplicados) y valida contra productos activos.
  create temp table _items on commit drop as
    select (i->>'product_id')::uuid as product_id,
           sum((i->>'qty')::int)    as qty
    from jsonb_array_elements(p_items) as i
    group by 1;

  if exists (select 1 from _items where qty < 1 or qty > 99) then
    raise exception 'Cantidad inválida' using errcode = '22023';
  end if;

  select count(*) into v_expected from _items;
  select count(*) into v_found
    from _items it join public.products p on p.id = it.product_id and p.is_active;
  if v_found <> v_expected then
    raise exception 'Algún producto ya no está disponible' using errcode = 'P0002';
  end if;

  select sum(p.price * it.qty) into v_total
    from _items it join public.products p on p.id = it.product_id;

  v_code := 'P-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (code, customer_name, phone, email, notes, total)
  values (v_code, trim(p_customer_name), trim(p_phone),
          nullif(trim(p_email), ''), nullif(trim(p_notes), ''), v_total)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, name_snapshot, price_snapshot, qty)
  select v_order_id, p.id, p.name, p.price, it.qty
  from _items it join public.products p on p.id = it.product_id;

  return query select v_order_id, v_code, v_total;
end;
$$;

revoke execute on function public.create_order(text, text, text, text, jsonb) from public;
grant  execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

-- ---------- Más vendidos: sold_count según estado del pedido -----------
-- Cuenta solo pedidos confirmados/preparando/entregados.
create or replace function public.sync_sold_count()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_was boolean := old.status in ('confirmado', 'preparando', 'entregado');
  v_is  boolean := new.status in ('confirmado', 'preparando', 'entregado');
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

create trigger orders_sync_sold_count
  after update of status on public.orders
  for each row execute function public.sync_sold_count();

-- ---------- Storage: bucket público de imágenes -------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 2097152,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do nothing;

create policy "products bucket: admin sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and public.is_admin());

create policy "products bucket: admin actualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'products' and public.is_admin());

create policy "products bucket: admin borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'products' and public.is_admin());

-- ---------- Realtime: notificar pedidos nuevos al panel admin ----------
-- Realtime respeta RLS → solo admins reciben los eventos.
alter publication supabase_realtime add table public.orders;

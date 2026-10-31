-- =====================================================================
-- Endurecimiento según `supabase db advisors`
-- - Funciones internas fuera del schema expuesto por la API (private).
-- - Una sola policy permisiva por rol/acción.
-- - auth.uid()/is_admin() envueltos en (select ...) → se evalúan una vez.
-- create_order() sigue siendo pública a propósito.
-- =====================================================================

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Las policies referencian funciones por OID: mover de schema no las rompe.
alter function public.is_admin()        set schema private;
alter function public.sync_sold_count() set schema private;
alter function public.set_updated_at()  set schema private;

revoke execute on function private.sync_sold_count() from public, anon, authenticated;
revoke execute on function private.set_updated_at()  from public, anon, authenticated;

-- ---------- admins ----------
drop policy "admins: ver propia fila" on public.admins;
create policy "admins: ver propia fila"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------- categories ----------
drop policy "categories: lectura pública" on public.categories;
drop policy "categories: admin escribe"   on public.categories;

create policy "categories: lectura pública"
  on public.categories for select to anon, authenticated
  using (true);
create policy "categories: admin inserta"
  on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy "categories: admin actualiza"
  on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "categories: admin borra"
  on public.categories for delete to authenticated
  using ((select private.is_admin()));

-- ---------- products ----------
drop policy "products: público ve activos" on public.products;
drop policy "products: admin escribe"      on public.products;

create policy "products: lectura"
  on public.products for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy "products: admin inserta"
  on public.products for insert to authenticated
  with check ((select private.is_admin()));
create policy "products: admin actualiza"
  on public.products for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "products: admin borra"
  on public.products for delete to authenticated
  using ((select private.is_admin()));

-- ---------- product_images ----------
drop policy "product_images: lectura si producto visible" on public.product_images;
drop policy "product_images: admin escribe"               on public.product_images;

create policy "product_images: lectura"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.is_active or (select private.is_admin()))
  ));
create policy "product_images: admin inserta"
  on public.product_images for insert to authenticated
  with check ((select private.is_admin()));
create policy "product_images: admin actualiza"
  on public.product_images for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "product_images: admin borra"
  on public.product_images for delete to authenticated
  using ((select private.is_admin()));

-- ---------- orders / order_items ----------
drop policy "orders: admin lee/edita"      on public.orders;
drop policy "order_items: admin lee/edita" on public.order_items;

create policy "orders: admin lee/edita"
  on public.orders for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "order_items: admin lee/edita"
  on public.order_items for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------- storage ----------
drop policy "products bucket: admin sube"      on storage.objects;
drop policy "products bucket: admin actualiza" on storage.objects;
drop policy "products bucket: admin borra"     on storage.objects;

create policy "products bucket: admin sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select private.is_admin()));
create policy "products bucket: admin actualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'products' and (select private.is_admin()));
create policy "products bucket: admin borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select private.is_admin()));

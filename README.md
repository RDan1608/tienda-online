# Tienda online

Catálogo + pedidos (sin pagos) para joyería, peluches, pines, llaveros, phone charms y legos.
Next.js 16 · Supabase · Tailwind v4 · Vercel. Precios en Lempiras (HNL).

## Setup

Proyecto Supabase: `tienda-online` (ref `tyafroedxuxjumpjbxnc`, us-east-1), ya enlazado con el CLI.

```bash
npm install
npm run dev                    # http://localhost:3000 (requiere .env.local)

supabase db push               # aplicar migraciones nuevas de supabase/migrations
supabase config push           # aplicar cambios de supabase/config.toml (auth, etc.)
supabase db advisors --linked  # linter de seguridad/rendimiento
```

Nuevo admin: crear usuario en Authentication → Users y luego:
```sql
insert into public.admins (user_id)
select id from auth.users where email = 'nuevo@ejemplo.com';
```

## Seguridad

- Público (publishable key) solo puede: leer productos activos/categorías/imágenes y llamar `create_order()`.
- `create_order()` recalcula precios en la BD y limita a 3 pedidos por teléfono cada 10 min.
- Pedidos, escritura de catálogo y subida de imágenes: solo usuarios en `public.admins` (RLS).
- `/admin` pasa por `src/proxy.ts` (chequeo optimista); la autorización real es RLS + `is_admin()`.

## Fases

- [x] 0 · Setup, esquema, RLS, tema
- [ ] 1 · Catálogo público + filtros + detalle
- [ ] 2 · Carrito, favoritos, pedido
- [ ] 3 · Admin: login, CRUD productos/imágenes
- [ ] 4 · Admin: pedidos, realtime, email
- [ ] 5 · Más vendidos, SEO, QA, cron anti-pausa

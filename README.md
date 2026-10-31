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
- [x] 1 · Catálogo público + filtros + detalle
- [x] 2 · Carrito, favoritos, pedido (email listo; falta RESEND_API_KEY)
- [x] 3 · Admin: login, CRUD productos/imágenes/categorías
- [x] 4 · Admin: pedidos, realtime, email (varios destinatarios en ORDER_NOTIFY_EMAIL)
- [x] 5 · SEO, accesibilidad, rendimiento, cron anti-pausa, QA

## Datos de demostración

`supabase/demo-products.sql` carga 15 productos `demo-*`. Para borrarlos:
```sql
delete from public.products where slug like 'demo-%';
```

## Antes de lanzar (checklist)

1. **Nombre y textos**: editar `src/lib/site.ts` (nombre, lema, texto de cómo comprar).
2. **Productos**: borrar los demo (SQL de arriba) y cargar los reales desde `/admin`.
3. **Dominio**: Vercel → Settings → Domains. Después actualizar la URL permitida de login en
   `supabase/config.toml` (`site_url` y `additional_redirect_urls`) y correr `supabase config push`.
4. **Correo**: verificar el dominio en Resend, poner `ORDER_FROM_EMAIL` con ese dominio y
   los destinatarios en `ORDER_NOTIFY_EMAIL` (separados por coma). Sin dominio propio, Resend
   solo entrega a la cuenta dueña.
5. **Credenciales**: cambiar la contraseña del admin y rotar la API key de Resend si se compartió.
6. **Hosting**: el plan Hobby de Vercel no permite uso comercial; pasar a Pro o mover a Cloudflare.

## Mantenimiento

- **Cron** (`vercel.ts`): `/api/keepalive` corre a diario y evita que Supabase (plan gratis) pause la base.
  Requiere la variable `CRON_SECRET` en Vercel.
- **SEO**: `/sitemap.xml` y `/robots.txt` se generan solos; cada producto lleva datos estructurados (JSON-LD).
- **Pruebas rápidas**: `npm run lint && npx tsc --noEmit && npm run build`.

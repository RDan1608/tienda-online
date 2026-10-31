-- Productos de DEMOSTRACIÓN para probar el catálogo.
-- Borrar todos:  delete from public.products where slug like 'demo-%';
insert into public.products (category_id, name, slug, description, price, tags, is_featured)
select c.id, v.name, v.slug, v.description, v.price, v.tags, v.featured
from (values
  ('joyeria', 'Aretes de perla minimal', 'demo-aretes-perla', 'Aretes pequeños con perla sintética y base de acero inoxidable. Hipoalergénicos.', 180, array['acero','plateado','elegante'], true),
  ('joyeria', 'Collar corazón dorado', 'demo-collar-corazon', 'Cadena fina con dije de corazón. Baño de oro, 45 cm.', 320, array['dorado','romántico'], true),
  ('joyeria', 'Pulsera de cuentas pastel', 'demo-pulsera-pastel', 'Pulsera elástica con cuentas en tonos pastel.', 120, array['kawaii','pastel'], false),
  ('joyeria', 'Anillo ajustable luna', 'demo-anillo-luna', 'Anillo ajustable con diseño de luna creciente. Talla única.', 150, array['plateado','acero'], false),
  ('peluches', 'Conejito de peluche 25 cm', 'demo-peluche-conejo', 'Peluche suave de conejito, ideal para regalo.', 450, array['kawaii','pastel','regalo'], true),
  ('peluches', 'Osito con lazo', 'demo-peluche-osito', 'Osito clásico con lazo azul. 30 cm.', 520, array['regalo','romántico'], false),
  ('peluches', 'Gatito mochi mini', 'demo-peluche-gatito', 'Peluche mochi de gatito, cabe en la palma de la mano.', 260, array['kawaii','anime'], false),
  ('pines', 'Pin esmaltado gatito', 'demo-pin-gatito', 'Pin metálico esmaltado con cierre de goma.', 95, array['kawaii','anime'], false),
  ('pines', 'Set de 3 pines flores', 'demo-pin-flores', 'Tres pines esmaltados con diseños florales.', 210, array['pastel','floral'], true),
  ('llaveros', 'Llavero acrílico estrella', 'demo-llavero-estrella', 'Llavero acrílico transparente con brillos.', 110, array['pastel','brillos'], false),
  ('llaveros', 'Llavero peluche mini oso', 'demo-llavero-oso', 'Mini peluche con argolla para llaves o mochila.', 160, array['kawaii','regalo'], false),
  ('phone-charms', 'Phone charm de perlas', 'demo-charm-perlas', 'Colgante para celular con perlas y dije de corazón.', 140, array['elegante','romántico'], true),
  ('phone-charms', 'Phone charm frutitas', 'demo-charm-frutas', 'Charm con cuentas de frutas de colores.', 130, array['kawaii','pastel'], false),
  ('legos', 'Ramo de flores para armar', 'demo-lego-flores', 'Set de bloques para armar un ramo de flores. 750 piezas.', 1250, array['floral','regalo'], true),
  ('legos', 'Mini set casita', 'demo-lego-casita', 'Set de bloques compatible para armar una casita. 320 piezas.', 680, array['regalo'], false)
) as v(cat, name, slug, description, price, tags, featured)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- Categorías iniciales
insert into public.categories (name, slug, sort_order) values
  ('Joyería',      'joyeria',      1),
  ('Peluches',     'peluches',     2),
  ('Pines',        'pines',        3),
  ('Llaveros',     'llaveros',     4),
  ('Phone charms', 'phone-charms', 5),
  ('Legos',        'legos',        6)
on conflict (slug) do nothing;

-- Dar rol admin (crear antes el usuario en Authentication → Users):
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'admin@ejemplo.com';

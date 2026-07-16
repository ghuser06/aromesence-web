-- Catálogo de dama: columna de género + 17 perfumes con precio de
-- proveedor (Magna, 2026-07-15) + $1,000 MXN de margen.
-- Imagen: placeholder hasta contar con fotos autorizadas.

alter table public.perfumes
  add column genero text not null default 'caballero'
  check (genero in ('caballero', 'dama'));

insert into public.perfumes (marca, nombre, tipo, precio, imagen, badge, stock, genero) values
('Carolina Herrera', '212 VIP Rosé Cabaret Limited Edition', 'EDP 80ml', 2674, 'placeholder-dama.svg', 'new', 5, 'dama'),
('Ariana Grande', 'Cloud 2.0 Intense', 'EDP 100ml', 1975, 'placeholder-dama.svg', 'new', 5, 'dama'),
('Coach', 'Gold', 'Parfum 90ml', 1989, 'placeholder-dama.svg', null, 5, 'dama'),
('Dolce & Gabbana', 'Dolce Shine', 'EDP 75ml', 1804, 'placeholder-dama.svg', null, 5, 'dama'),
('Dolce & Gabbana', 'Dolce Violet', 'EDT 75ml', 1815, 'placeholder-dama.svg', null, 5, 'dama'),
('Dolce & Gabbana', 'Q', 'Parfum 100ml', 2275, 'placeholder-dama.svg', null, 5, 'dama'),
('Lacoste', 'Eau de Lacoste Silver Rose', 'EDP 100ml', 1895, 'placeholder-dama.svg', null, 5, 'dama'),
('Carolina Herrera', 'Good Girl Blush', 'EDP 150ml', 3559, 'placeholder-dama.svg', 'hot', 5, 'dama'),
('Jean Paul Gaultier', 'La Belle Paradise Garden', 'EDP 100ml', 2924, 'placeholder-dama.svg', 'new', 5, 'dama'),
('Lancôme', 'La Vie Est Belle Iris Absolu', 'EDP 100ml', 2689, 'placeholder-dama.svg', null, 5, 'dama'),
('Yves Saint Laurent', 'Libre Le Parfum', 'EDP 90ml', 3495, 'placeholder-dama.svg', 'hot', 5, 'dama'),
('Sabrina Carpenter', 'Me Espresso', 'EDP 75ml', 1625, 'placeholder-dama.svg', 'new', 5, 'dama'),
('Rabanne', 'Million Gold For Her Pure Jasmine', 'EDP 90ml', 2794, 'placeholder-dama.svg', null, 5, 'dama'),
('Christian Dior', 'Miss Dior Blooming Bouquet', 'EDT 100ml', 3210, 'placeholder-dama.svg', 'hot', 5, 'dama'),
('Versace', 'Bright Crystal', 'EDT 200ml', 2395, 'placeholder-dama.svg', null, 5, 'dama'),
('Versace', 'Crystal Noir', 'EDP 90ml', 2041, 'placeholder-dama.svg', null, 5, 'dama'),
('Carolina Herrera', 'Very Good Girl Elixir', 'EDP 80ml', 2984, 'placeholder-dama.svg', null, 5, 'dama');

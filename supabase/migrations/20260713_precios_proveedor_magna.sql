-- Actualización de precios: precio del proveedor (Magna Perfumes, 2026-07-13) + $1,000 MXN de margen.
-- Solo los 13 productos con coincidencia exacta de presentación en el catálogo del proveedor.

update public.perfumes set precio = 2095, actualizado_en = now() where marca = 'Versace' and nombre = 'Eros';
update public.perfumes set precio = 1925, actualizado_en = now() where marca = 'Versace' and nombre = 'Dylan Blue';
update public.perfumes set precio = 2794, actualizado_en = now() where marca = 'Jean Paul Gaultier' and nombre = 'Le Male Elixir';
update public.perfumes set precio = 2724, actualizado_en = now() where marca = 'Jean Paul Gaultier' and nombre = 'Le Beau Paradise Garden';
update public.perfumes set precio = 1740, actualizado_en = now() where marca = 'Montblanc' and nombre = 'Explorer';
update public.perfumes set precio = 1650, actualizado_en = now() where marca = 'Montblanc' and nombre = 'Legend Spirit';
update public.perfumes set precio = 1217, actualizado_en = now() where marca = 'Nautica' and nombre = 'Voyage';
update public.perfumes set precio = 1239, actualizado_en = now() where marca = 'Nautica' and nombre = 'Voyage N-83';
update public.perfumes set precio = 1239, actualizado_en = now() where marca = 'Nautica' and nombre = 'Voyage Sport';
update public.perfumes set precio = 1194, actualizado_en = now() where marca = 'Nautica' and nombre = 'Classic';
update public.perfumes set precio = 1449, actualizado_en = now() where marca = 'Tommy Hilfiger' and nombre = 'Tommy';
update public.perfumes set precio = 1785, actualizado_en = now() where marca = 'Moschino' and nombre = 'Toy Boy';
update public.perfumes set precio = 1889, actualizado_en = now() where marca = 'Coach' and nombre = 'For Men';

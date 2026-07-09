-- Tabla de pedidos: registro consecutivo de cada compra con los datos
-- que pide la paquetería, vinculada al pago de Mercado Pago.

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido bigint generated always as identity unique,
  creado_en timestamptz not null default now(),
  estado_pedido text not null default 'pendiente_pago'
    check (estado_pedido in ('pendiente_pago', 'pagado', 'enviado', 'entregado', 'cancelado')),

  -- Datos del cliente / envío (requisitos de paquetería)
  nombre text not null,
  telefono text not null,
  email text,
  calle text not null,
  colonia text not null,
  codigo_postal text not null check (codigo_postal ~ '^[0-9]{5}$'),
  ciudad text not null,
  estado text not null,
  referencias text,

  -- Contenido del pedido
  items jsonb not null,
  total numeric(10,2) not null check (total >= 0),
  mp_preference_id text
);

alter table public.pedidos enable row level security;

-- Solo administradores (perfil_usuario.es_admin) pueden ver y actualizar pedidos
create policy "pedidos_select_admin"
  on public.pedidos for select
  to authenticated
  using (exists (select 1 from public.perfil_usuario p where p.id = (select auth.uid()) and p.es_admin));

create policy "pedidos_update_admin"
  on public.pedidos for update
  to authenticated
  using (exists (select 1 from public.perfil_usuario p where p.id = (select auth.uid()) and p.es_admin));

-- La creación de pedidos pasa por esta función (la llama el backend con la
-- clave publishable). Al ser security definer puede insertar y devolver el
-- número consecutivo sin exponer permisos de lectura sobre la tabla.
create or replace function public.crear_pedido(datos jsonb)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  nuevo_numero bigint;
begin
  insert into public.pedidos (
    id, nombre, telefono, email, calle, colonia, codigo_postal,
    ciudad, estado, referencias, items, total, mp_preference_id
  )
  values (
    coalesce(nullif(datos->>'id', '')::uuid, gen_random_uuid()),
    datos->>'nombre',
    datos->>'telefono',
    nullif(datos->>'email', ''),
    datos->>'calle',
    datos->>'colonia',
    datos->>'codigo_postal',
    datos->>'ciudad',
    datos->>'estado',
    nullif(datos->>'referencias', ''),
    datos->'items',
    (datos->>'total')::numeric,
    datos->>'mp_preference_id'
  )
  returning numero_pedido into nuevo_numero;

  return nuevo_numero;
end;
$$;

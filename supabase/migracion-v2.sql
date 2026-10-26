-- =====================================================================
-- MIGRACIÓN V2 · para una base de datos que YA tiene el esquema anterior
-- Pegar completo en: Supabase → SQL Editor → New query → Run
-- Es seguro ejecutarla más de una vez. No borra ni modifica tus datos.
-- (Si estás creando el proyecto desde cero, NO la necesitas: usa schema.sql)
-- =====================================================================

-- 1. Botiquín: los sobres ahora tienen un "tipo" ('sobre' o 'botiquin')
alter table public.savings_goals
  add column if not exists kind text not null default 'sobre';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'savings_goals_kind_check'
  ) then
    alter table public.savings_goals
      add constraint savings_goals_kind_check check (kind in ('sobre','botiquin'));
  end if;
end $$;

-- Solo un botiquín por usuario
create unique index if not exists one_botiquin_per_user
  on public.savings_goals (user_id) where kind = 'botiquin';

-- 2. Retirar dinero de un sobre/botiquín (vuelve al disponible del mes)
create or replace function public.withdraw_from_goal(p_goal_id uuid, p_year int, p_month int, p_amount numeric)
returns public.savings_contributions
language plpgsql security invoker set search_path = public as $$
declare
  v_current numeric;
  v_row public.savings_contributions;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto debe ser mayor a 0';
  end if;
  select g.current_amount into v_current
    from public.savings_goals g
   where g.id = p_goal_id and g.user_id = auth.uid();
  if v_current is null then
    raise exception 'No se encontró el sobre';
  end if;
  if p_amount > v_current then
    raise exception 'Solo hay % guardados', v_current;
  end if;
  insert into public.savings_contributions (goal_id, year, month, amount)
  values (p_goal_id, p_year, p_month, -p_amount)
  returning * into v_row;
  return v_row;
end $$;

-- 3. Eventos (día/mes + monto). year NULL = se repite todos los años
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  icon         text not null default 'party-popper',
  event_month  smallint not null check (event_month between 1 and 12),
  event_day    smallint not null check (event_day between 1 and 31),
  year         smallint check (year between 2000 and 2100),
  amount       numeric(12,2) not null default 0 check (amount >= 0),
  created_at   timestamptz not null default now()
);
create index if not exists events_user_idx on public.events (user_id, event_month, event_day);

alter table public.events enable row level security;
drop policy if exists "events_own" on public.events;
create policy "events_own" on public.events for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 4. Categorías nuevas por defecto (las que ya existen se respetan)
insert into public.categories (user_id, name, icon, type) values
  (null, 'Comida', 'utensils', 'indispensable'),
  (null, 'Vivienda', 'house', 'indispensable'),
  (null, 'Transporte', 'bus', 'indispensable'),
  (null, 'Salud', 'heart-pulse', 'indispensable'),
  (null, 'Alquiler', 'key-round', 'indispensable'),
  (null, 'Hipoteca', 'landmark', 'indispensable'),
  (null, 'Supermercado', 'shopping-cart', 'indispensable'),
  (null, 'Combustible', 'fuel', 'indispensable'),
  (null, 'Medicinas de uso continuo', 'pill', 'indispensable'),
  (null, 'Seguro médico', 'shield-check', 'indispensable'),
  (null, 'Escuela y colegio', 'school', 'indispensable'),
  (null, 'Cuidado de niños', 'baby', 'indispensable'),
  (null, 'Cuidado de familiares', 'heart-handshake', 'indispensable'),
  (null, 'Deudas y préstamos', 'hand-coins', 'indispensable'),
  (null, 'Tarjeta de crédito', 'credit-card', 'indispensable'),
  (null, 'Impuestos', 'receipt', 'indispensable'),
  (null, 'Pensión alimenticia', 'scale', 'indispensable'),
  (null, 'Alimento de mascotas', 'paw-print', 'indispensable'),
  (null, 'Higiene personal', 'bath', 'indispensable'),
  (null, 'Productos de limpieza', 'spray-can', 'indispensable'),
  (null, 'Mantenimiento del hogar', 'wrench', 'indispensable'),
  (null, 'Seguro del vehículo', 'car', 'indispensable'),
  (null, 'Insumos del negocio', 'store', 'indispensable'),
  (null, 'Transporte escolar', 'bus-front', 'indispensable'),
  (null, 'Internet', 'wifi', 'servicio'),
  (null, 'Electricidad', 'zap', 'servicio'),
  (null, 'Agua', 'droplets', 'servicio'),
  (null, 'Teléfono', 'smartphone', 'servicio'),
  (null, 'Streaming', 'tv', 'servicio'),
  (null, 'Gas', 'flame', 'servicio'),
  (null, 'Cable y TV', 'satellite-dish', 'servicio'),
  (null, 'Aseo y basura', 'trash-2', 'servicio'),
  (null, 'Condominio', 'building-2', 'servicio'),
  (null, 'Suscripciones digitales', 'cloud', 'servicio'),
  (null, 'Música', 'music', 'servicio'),
  (null, 'Gimnasio', 'dumbbell', 'servicio'),
  (null, 'Seguros', 'shield-check', 'servicio'),
  (null, 'Iglesia y diezmo', 'church', 'servicio'),
  (null, 'Alarma y seguridad', 'lock', 'servicio'),
  (null, 'Dominio y hosting', 'globe', 'servicio'),
  (null, 'Lavandería', 'washing-machine', 'servicio'),
  (null, 'Plan de celular', 'phone', 'servicio'),
  (null, 'Membresías', 'id-card', 'servicio'),
  (null, 'Imprevistos', 'triangle-alert', 'prioridad_alta'),
  (null, 'Educación', 'graduation-cap', 'prioridad_alta'),
  (null, 'Emergencia médica', 'ambulance', 'prioridad_alta'),
  (null, 'Consulta médica', 'stethoscope', 'prioridad_alta'),
  (null, 'Dentista', 'tooth', 'prioridad_alta'),
  (null, 'Farmacia', 'pill', 'prioridad_alta'),
  (null, 'Exámenes y laboratorio', 'microscope', 'prioridad_alta'),
  (null, 'Reparaciones del hogar', 'hammer', 'prioridad_alta'),
  (null, 'Reparación del vehículo', 'car', 'prioridad_alta'),
  (null, 'Trámites y documentos', 'file-text', 'prioridad_alta'),
  (null, 'Material escolar', 'backpack', 'prioridad_alta'),
  (null, 'Uniformes', 'shirt', 'prioridad_alta'),
  (null, 'Lentes y óptica', 'glasses', 'prioridad_alta'),
  (null, 'Salidas al cine', 'clapperboard', 'prioridad_media'),
  (null, 'Ropa', 'shirt', 'prioridad_media'),
  (null, 'Regalos', 'gift', 'prioridad_media'),
  (null, 'Restaurantes', 'utensils-crossed', 'prioridad_media'),
  (null, 'Cumpleaños', 'cake', 'prioridad_media'),
  (null, 'Fiestas y celebraciones', 'party-popper', 'prioridad_media'),
  (null, 'Viajes', 'plane', 'prioridad_media'),
  (null, 'Calzado', 'footprints', 'prioridad_media'),
  (null, 'Peluquería y belleza', 'scissors', 'prioridad_media'),
  (null, 'Salidas en familia', 'users', 'prioridad_media'),
  (null, 'Deportes', 'trophy', 'prioridad_media'),
  (null, 'Cursos y talleres', 'book-open', 'prioridad_media'),
  (null, 'Libros', 'book', 'prioridad_media'),
  (null, 'Muebles y decoración', 'sofa', 'prioridad_media'),
  (null, 'Electrodomésticos', 'refrigerator', 'prioridad_media'),
  (null, 'Tecnología', 'laptop', 'prioridad_media'),
  (null, 'Veterinario', 'dog', 'prioridad_media'),
  (null, 'Juguetes', 'puzzle', 'prioridad_media'),
  (null, 'Jardinería', 'flower-2', 'prioridad_media'),
  (null, 'Herramientas', 'wrench', 'prioridad_media'),
  (null, 'Donaciones', 'heart', 'prioridad_media'),
  (null, 'Autocuidado y spa', 'sparkles', 'prioridad_media'),
  (null, 'Navidad', 'tree-pine', 'prioridad_media'),
  (null, 'Antojos', 'ice-cream-cone', 'prioridad_baja'),
  (null, 'Hobbies', 'gamepad-2', 'prioridad_baja'),
  (null, 'Videojuegos', 'joystick', 'prioridad_baja'),
  (null, 'Café y snacks', 'coffee', 'prioridad_baja'),
  (null, 'Bebidas y licores', 'beer', 'prioridad_baja'),
  (null, 'Compras impulsivas', 'shopping-bag', 'prioridad_baja'),
  (null, 'Accesorios', 'watch', 'prioridad_baja'),
  (null, 'Conciertos y eventos', 'ticket', 'prioridad_baja'),
  (null, 'Fotografía', 'camera', 'prioridad_baja'),
  (null, 'Coleccionables', 'gem', 'prioridad_baja'),
  (null, 'Arte y manualidades', 'palette', 'prioridad_baja'),
  (null, 'Cosméticos', 'spray-can', 'prioridad_baja'),
  (null, 'Gadgets', 'cpu', 'prioridad_baja'),
  (null, 'Salir de fiesta', 'martini', 'prioridad_baja')
on conflict do nothing;

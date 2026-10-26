-- =====================================================================
-- FINANZAS PERSONALES · Esquema Supabase
-- Pegar completo en: Supabase → SQL Editor → Run
-- =====================================================================

-- ---------- 1. TIPOS ----------------------------------------------------
create type public.expense_type as enum (
  'indispensable', 'servicio',
  'prioridad_alta', 'prioridad_media', 'prioridad_baja'
);

-- ---------- 2. TABLAS ---------------------------------------------------

-- Categorías: user_id NULL = categoría por defecto (visible para todos, solo lectura)
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade default auth.uid(),
  name        text not null check (char_length(name) between 1 and 60),
  icon        text not null default 'circle-dollar-sign',   -- nombre kebab-case de Lucide
  type        public.expense_type not null,
  created_at  timestamptz not null default now()
);
create unique index categories_unique_name
  on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- Ingresos: un registro por día exacto
create table public.incomes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  income_date  date not null,
  amount       numeric(12,2) not null check (amount > 0),
  description  text not null default '',
  icon         text not null default 'banknote',
  created_at   timestamptz not null default now()
);
create index incomes_user_date_idx on public.incomes (user_id, income_date);

-- Plantillas de gastos recurrentes (solo indispensable / servicio)
create table public.recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete restrict,
  name         text not null,
  base_amount  numeric(12,2) not null check (base_amount >= 0),
  start_year   smallint not null,
  start_month  smallint not null check (start_month between 1 and 12),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Gastos mensuales: recurrentes clonados (template_id) o eventuales (template_id NULL)
create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete restrict,
  template_id  uuid references public.recurring_expenses(id) on delete set null,
  year         smallint not null check (year between 2000 and 2100),
  month        smallint not null check (month between 1 and 12),
  name         text not null,
  amount       numeric(12,2) not null check (amount >= 0),
  is_paid      boolean not null default false,
  is_skipped   boolean not null default false,   -- "omitir este mes" sin borrar la plantilla
  created_at   timestamptz not null default now()
);
create unique index expenses_template_month_uniq
  on public.expenses (template_id, year, month) where template_id is not null;
create index expenses_user_period_idx on public.expenses (user_id, year, month);

-- Sobres de ahorro
create table public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  icon           text not null default 'piggy-bank',
  color          text not null default 'violet' check (color in ('violet','emerald','amber','sky','rose')),
  kind           text not null default 'sobre' check (kind in ('sobre','botiquin')),  -- 'botiquin' = fondo de salud
  target_amount  numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),  -- lo mantiene el trigger
  created_at     timestamptz not null default now()
);

-- Aportes a sobres: cada aporte descuenta del saldo del mes en que se hace
create table public.savings_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id     uuid not null references public.savings_goals(id) on delete cascade,
  year        smallint not null check (year between 2000 and 2100),
  month       smallint not null check (month between 1 and 12),
  amount      numeric(12,2) not null check (amount <> 0),   -- negativo = retiro
  created_at  timestamptz not null default now()
);
create index contributions_user_period_idx on public.savings_contributions (user_id, year, month);

-- Solo un botiquín (fondo de salud) por usuario
create unique index one_botiquin_per_user on public.savings_goals (user_id) where kind = 'botiquin';

-- Eventos con fecha (día/mes). year NULL = se repite todos los años; con valor = solo ese año
create table public.events (
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
create index events_user_idx on public.events (user_id, event_month, event_day);

-- ---------- 3. TRIGGERS -------------------------------------------------

-- Recalcula current_amount del sobre cuando cambian sus aportes
create or replace function public.sync_goal_total()
returns trigger language plpgsql set search_path = public as $$
declare g uuid := coalesce(new.goal_id, old.goal_id);
begin
  update public.savings_goals
     set current_amount = greatest(coalesce((select sum(amount) from public.savings_contributions where goal_id = g), 0), 0)
   where id = g;
  return null;
end $$;

create trigger trg_sync_goal_total
after insert or update or delete on public.savings_contributions
for each row execute function public.sync_goal_total();

-- Las plantillas recurrentes solo aceptan categorías indispensable/servicio
create or replace function public.check_recurring_category()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from public.categories c
     where c.id = new.category_id and c.type in ('indispensable', 'servicio')
  ) then
    raise exception 'Los gastos recurrentes solo admiten categorías indispensable o servicio';
  end if;
  return new;
end $$;

create trigger trg_check_recurring_category
before insert or update on public.recurring_expenses
for each row execute function public.check_recurring_category();

-- ---------- 4. FUNCIONES DE NEGOCIO (RPC) ------------------------------

-- Crea los gastos fijos de cada mes desde su inicio hasta el mes pedido; cada mes es copia del anterior.
-- Es idempotente: se puede llamar cada vez que se abre un mes.
create or replace function public.sync_recurring_expenses(p_year int, p_month int)
returns void language plpgsql security invoker set search_path = public as $$
declare
  r       public.recurring_expenses;
  m       date;
  prev_m  date;
  prev    public.expenses;
  last_m  date := make_date(p_year, p_month, 1);
begin
  for r in
    select * from public.recurring_expenses
     where is_active and user_id = auth.uid()
  loop
    for m in
      select gs::date
        from generate_series(make_date(r.start_year, r.start_month, 1)::timestamp,
                             last_m::timestamp, interval '1 month') as gs
    loop
      -- el mes ya existe: no se toca
      continue when exists (
        select 1 from public.expenses e
         where e.template_id = r.id
           and e.year  = extract(year  from m)::int
           and e.month = extract(month from m)::int);

      if m = make_date(r.start_year, r.start_month, 1) then
        -- primer mes del gasto fijo: nace con su monto base
        insert into public.expenses (user_id, category_id, template_id, year, month, name, amount)
        values (r.user_id, r.category_id, r.id, extract(year from m)::int, extract(month from m)::int, r.name, r.base_amount)
        on conflict (template_id, year, month) where template_id is not null do nothing;
      else
        -- meses siguientes: COPIA EXACTA del mes anterior (nombre, categoría y monto).
        -- Si en el mes anterior se quitó (is_skipped), no se vuelve a crear.
        prev_m := (m - interval '1 month')::date;
        select * into prev from public.expenses e
         where e.template_id = r.id
           and e.year  = extract(year  from prev_m)::int
           and e.month = extract(month from prev_m)::int;
        if found and not prev.is_skipped then
          insert into public.expenses (user_id, category_id, template_id, year, month, name, amount)
          values (r.user_id, prev.category_id, r.id, extract(year from m)::int, extract(month from m)::int, prev.name, prev.amount)
          on conflict (template_id, year, month) where template_id is not null do nothing;
        end if;
      end if;
    end loop;
  end loop;
end $$;

-- Deja los gastos fijos de un mes como copia exacta del mes anterior (botón "Copiar mes anterior")
create or replace function public.copy_fixed_from_previous(p_year int, p_month int)
returns void language plpgsql security invoker set search_path = public as $$
declare
  py int;
  pm int;
begin
  if p_month = 1 then py := p_year - 1; pm := 12; else py := p_year; pm := p_month - 1; end if;

  perform public.sync_recurring_expenses(py, pm);

  if not exists (
    select 1 from public.expenses x
     where x.user_id = auth.uid() and x.year = py and x.month = pm
       and x.template_id is not null and not x.is_skipped
  ) then
    raise exception 'El mes anterior no tiene gastos fijos para copiar';
  end if;

  -- Los fijos que nacieron en este mismo mes dejan de existir (el mes pasa a ser copia del anterior)
  with gone as (
    update public.recurring_expenses r
       set is_active = false
     where r.user_id = auth.uid() and r.start_year = p_year and r.start_month = p_month
    returning r.id
  )
  delete from public.expenses x
   where x.user_id = auth.uid()
     and x.template_id in (select id from gone)
     and (x.year, x.month) >= (p_year, p_month);

  -- Se vacían los fijos de este mes y se copian los del anterior
  delete from public.expenses x
   where x.user_id = auth.uid() and x.year = p_year and x.month = p_month and x.template_id is not null;

  insert into public.expenses (user_id, category_id, template_id, year, month, name, amount)
  select prev.user_id, prev.category_id, prev.template_id, p_year, p_month, prev.name, prev.amount
    from public.expenses prev
    join public.recurring_expenses r on r.id = prev.template_id and r.is_active
   where prev.user_id = auth.uid() and prev.year = py and prev.month = pm and not prev.is_skipped
  on conflict (template_id, year, month) where template_id is not null do nothing;
end $$;

-- Resumen del mes: arrastre + ingresos - gastos - ahorros = disponible
-- El arrastre es todo lo que ocurrió ANTES del día 1 del mes pedido.
-- Llamar primero a sync_recurring_expenses para que los fijos de meses previos estén generados.
create or replace function public.month_summary(p_year int, p_month int)
returns table (carryover numeric, total_income numeric, total_expenses numeric, total_savings numeric, available numeric)
language sql stable security invoker set search_path = public as $$
  with b as (
    select make_date(p_year, p_month, 1) as s,
           (make_date(p_year, p_month, 1) + interval '1 month')::date as e
  ),
  calc as (
    select
      coalesce((select sum(i.amount) from public.incomes i
                 where i.user_id = auth.uid() and i.income_date < b.s), 0)
    - coalesce((select sum(x.amount) from public.expenses x
                 where x.user_id = auth.uid() and not x.is_skipped
                   and make_date(x.year, x.month, 1) < b.s), 0)
    - coalesce((select sum(c.amount) from public.savings_contributions c
                 where c.user_id = auth.uid() and make_date(c.year, c.month, 1) < b.s), 0) as carryover,
      coalesce((select sum(i.amount) from public.incomes i
                 where i.user_id = auth.uid() and i.income_date >= b.s and i.income_date < b.e), 0) as inc,
      coalesce((select sum(x.amount) from public.expenses x
                 where x.user_id = auth.uid() and not x.is_skipped
                   and x.year = p_year and x.month = p_month), 0) as exp,
      coalesce((select sum(c.amount) from public.savings_contributions c
                 where c.user_id = auth.uid() and c.year = p_year and c.month = p_month), 0) as sav
    from b
  )
  select carryover, inc, exp, sav, carryover + inc - exp - sav from calc;
$$;

-- Inyecta dinero a un sobre desde el saldo disponible del mes (valida que alcance)
create or replace function public.add_to_goal(p_goal_id uuid, p_year int, p_month int, p_amount numeric)
returns public.savings_contributions
language plpgsql security invoker set search_path = public as $$
declare
  v_available numeric;
  v_row public.savings_contributions;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto debe ser mayor a 0';
  end if;
  perform public.sync_recurring_expenses(p_year, p_month);
  select s.available into v_available from public.month_summary(p_year, p_month) s;
  if p_amount > v_available then
    raise exception 'Saldo insuficiente: tienes % disponibles este mes', v_available;
  end if;
  insert into public.savings_contributions (goal_id, year, month, amount)
  values (p_goal_id, p_year, p_month, p_amount)
  returning * into v_row;
  return v_row;
end $$;

-- Retira dinero de un sobre/botiquín y lo devuelve al saldo disponible del mes (valida que haya suficiente)
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

-- ---------- 5. ROW LEVEL SECURITY --------------------------------------
alter table public.categories            enable row level security;
alter table public.incomes               enable row level security;
alter table public.recurring_expenses    enable row level security;
alter table public.expenses              enable row level security;
alter table public.savings_goals         enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.events                enable row level security;

-- Categorías: ver las por defecto (user_id null) + las propias; editar solo las propias
create policy "categories_select" on public.categories for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "categories_insert" on public.categories for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "categories_update" on public.categories for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "categories_delete" on public.categories for delete to authenticated
  using (user_id = (select auth.uid()));

-- Resto de tablas: cada usuario solo ve y modifica sus filas
create policy "incomes_own" on public.incomes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recurring_own" on public.recurring_expenses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "expenses_own" on public.expenses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "goals_own" on public.savings_goals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "events_own" on public.events for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Aportes: además, el sobre debe pertenecer al usuario
create policy "contributions_own" on public.savings_contributions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.savings_goals g
                 where g.id = goal_id and g.user_id = (select auth.uid()))
  );

-- ---------- 6. DATOS SEMILLA (categorías por defecto) ------------------
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

-- Ejemplo opcional: crear un sobre (ejecutar logueado desde la app o con tu user_id)
-- insert into public.savings_goals (user_id, name, icon, color, target_amount)
-- values ('<TU_USER_ID>', 'Registro de mercado Palma', 'store', 'emerald', 500);

-- =====================================================================
-- MIGRACIÓN V3 · cada mes es copia real del mes anterior
-- Pegar completo en: Supabase → SQL Editor → New query → Run
-- Es seguro ejecutarla más de una vez. NO modifica los datos que ya tienes.
-- Requiere haber ejecutado antes migracion-v2.sql.
-- =====================================================================

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

# Mis finanzas

## Instalación desde cero
1. Supabase → SQL Editor → pegar y ejecutar `supabase/schema.sql`
2. Supabase → Authentication → Providers → Email: para probar rápido, desactivar "Confirm email"
3. `cp .env.local.example .env.local` y rellenar URL y anon key (Project Settings → API)
4. `npm install` y `npm run dev` → http://localhost:3000

## Si ya tenías la base de datos de la versión anterior
Ejecuta **solo** `supabase/migracion-v2.sql` en Supabase → SQL Editor (no borra datos).
Añade: Botiquín, Eventos, retirar dinero de sobres y más categorías por defecto.

## Versión 3: cada mes es copia del anterior
Ejecuta `supabase/migracion-v3.sql` en Supabase → SQL Editor (después de la v2).

## Novedades de la versión 2
- Tema oscuro y diseño a ancho completo.
- Catálogo de ~350 iconos con grupos y buscador (en español) para categorías, ingresos, sobres y eventos.
- Todo editable: gastos, ingresos, sobres, botiquín, eventos y categorías propias.
- Botiquín (fondo de salud) con aportes y retiros.
- Eventos con fecha y monto; se repiten cada año (o solo un año si lo prefieres).
# Finanzas-app

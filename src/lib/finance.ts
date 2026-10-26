import type { ExpenseType, GoalColor } from "@/types/finance";

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
export const YEARS = [2026, 2027, 2028];

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

/** Máximo de días de un mes (febrero = 29 para permitir eventos del 29/feb). */
export const maxDaysOfMonth = (month: number) => new Date(2024, month, 0).getDate();

export const RECURRING_TYPES: ExpenseType[] = ["indispensable", "servicio"];
export const isRecurringType = (t: ExpenseType) => RECURRING_TYPES.includes(t);

// Clases completas y estáticas para que Tailwind las detecte
export const TYPE_META: Record<
  ExpenseType,
  { label: string; icon: string; badge: string }
> = {
  indispensable:   { label: "Indispensables",  icon: "shield-check",  badge: "bg-slate-700 text-slate-100" },
  servicio:        { label: "Servicios",       icon: "plug-zap",      badge: "bg-sky-500/15 text-sky-300" },
  prioridad_alta:  { label: "Prioridad alta",  icon: "signal-high",   badge: "bg-rose-500/15 text-rose-300" },
  prioridad_media: { label: "Prioridad media", icon: "signal-medium", badge: "bg-amber-500/15 text-amber-300" },
  prioridad_baja:  { label: "Prioridad baja",  icon: "signal-low",    badge: "bg-emerald-500/15 text-emerald-300" },
};

export const ALL_TYPES: ExpenseType[] = [
  "indispensable", "servicio", "prioridad_alta", "prioridad_media", "prioridad_baja",
];

export const ENVELOPE_COLORS: Record<
  GoalColor,
  { paper: string; flap: string; seal: string; bar: string; text: string }
> = {
  violet:  { paper: "bg-violet-500/10",  flap: "bg-violet-500/25",  seal: "bg-violet-600",  bar: "bg-violet-500",  text: "text-violet-300" },
  emerald: { paper: "bg-emerald-500/10", flap: "bg-emerald-500/25", seal: "bg-emerald-600", bar: "bg-emerald-500", text: "text-emerald-300" },
  amber:   { paper: "bg-amber-500/10",   flap: "bg-amber-500/25",   seal: "bg-amber-500",   bar: "bg-amber-500",   text: "text-amber-300" },
  sky:     { paper: "bg-sky-500/10",     flap: "bg-sky-500/25",     seal: "bg-sky-600",     bar: "bg-sky-500",     text: "text-sky-300" },
  rose:    { paper: "bg-rose-500/10",    flap: "bg-rose-500/25",    seal: "bg-rose-600",    bar: "bg-rose-500",    text: "text-rose-300" },
};

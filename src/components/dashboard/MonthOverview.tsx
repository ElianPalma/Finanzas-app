import { CalendarPlus, Minus, Plus, Equal, TriangleAlert, Pencil } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { usd } from "@/lib/finance";
import type { Income, MonthSummary } from "@/types/finance";

type Tone = "slate" | "emerald" | "ink" | "rose" | "violet";

const TONES: Record<Tone, { chip: string; value: string }> = {
  slate:   { chip: "bg-slate-700 text-slate-200",         value: "text-slate-200" },
  emerald: { chip: "bg-emerald-500/15 text-emerald-300",  value: "text-emerald-300" },
  ink:     { chip: "bg-white text-slate-900",             value: "text-white" },
  rose:    { chip: "bg-rose-500/15 text-rose-300",        value: "text-rose-300" },
  violet:  { chip: "bg-violet-500/15 text-violet-300",    value: "text-violet-300" },
};

function Term({ icon, label, value, tone, hint }: { icon: string; label: string; value: number; tone: Tone; hint?: string }) {
  const t = TONES[tone];
  return (
    <div className="flex min-w-[8.5rem] flex-1 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${t.chip}`}>
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-400">{label}</p>
        <p className={`text-lg font-extrabold tabular-nums ${t.value}`}>{usd(value)}</p>
        {hint && <p className="truncate text-[11px] font-medium text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

function Operator({ kind }: { kind: "plus" | "minus" | "equal" }) {
  const Cmp = kind === "plus" ? Plus : kind === "minus" ? Minus : Equal;
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-800 text-slate-400" aria-hidden="true">
      <Cmp className="size-4" strokeWidth={3} />
    </span>
  );
}

interface Props {
  summary: MonthSummary;
  incomes: Income[];
  /** Total acumulado en botiquín + sobres hasta este mes (incluye lo que arrastra) */
  savingsTotal?: number;
  onAddIncome?: () => void;
  onEditIncome?: (income: Income) => void;
}

export function MonthOverview({ summary, incomes, savingsTotal, onAddIncome, onEditIncome }: Props) {
  const { carryover, total_income, total_expenses, total_savings, available } = summary;
  const totalBalance = carryover + total_income;
  const negative = available < 0;

  // Reparto del saldo total: gastos / ahorros / libre
  const base = totalBalance > 0 ? totalBalance : 0;
  const pct = (n: number) => (base ? Math.max(0, Math.min(100, (n / base) * 100)) : 0);
  const pExp = pct(total_expenses);
  const pSav = Math.min(pct(total_savings), 100 - pExp);

  const sortedIncomes = [...incomes].sort((a, b) => a.income_date.localeCompare(b.income_date));

  return (
    <section aria-label="Resumen del mes" className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      {/* Ecuación: arrastre + ingresos = saldo total − gastos − ahorros = disponible */}
      <div className="flex flex-wrap items-center gap-2">
        <Term icon="history" label="Saldo anterior" value={carryover} tone="slate" />
        <Operator kind="plus" />
        <Term icon="trending-up" label="Ingresos del mes" value={total_income} tone="emerald" />
        <Operator kind="equal" />
        <Term icon="wallet" label="Saldo total" value={totalBalance} tone="ink" />
        <Operator kind="minus" />
        <Term icon="receipt" label="Gastos" value={total_expenses} tone="rose" />
        <Operator kind="minus" />
        <Term
          icon="piggy-bank"
          label="Ahorros del mes"
          value={total_savings}
          tone="violet"
          hint={savingsTotal !== undefined ? `Acumulado: ${usd(savingsTotal)}` : undefined}
        />
      </div>

      {/* Resultado */}
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${
          negative
            ? "bg-rose-600 text-white"
            : "border border-emerald-500/30 bg-emerald-500/10 text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-white/15">
            <Icon name={negative ? "triangle-alert" : "hand-coins"} className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-white/70">Disponible este mes</p>
            <p className="text-3xl font-extrabold tabular-nums">{usd(available)}</p>
          </div>
        </div>
        {negative && (
          <p className="flex items-center gap-2 text-sm font-semibold" role="alert">
            <TriangleAlert className="size-4" aria-hidden="true" />
            Gastas más de lo que tienes
          </p>
        )}
      </div>

      {/* Barra de reparto */}
      {base > 0 && (
        <div className="mt-4">
          <div
            className="flex h-3 overflow-hidden rounded-full bg-emerald-500/25"
            role="img"
            aria-label={`Del saldo total, ${Math.round(pExp)}% va a gastos, ${Math.round(pSav)}% a ahorros y el resto queda libre`}
          >
            <div className="bg-rose-500 transition-[width] duration-500" style={{ width: `${pExp}%` }} />
            <div className="bg-violet-500 transition-[width] duration-500" style={{ width: `${pSav}%` }} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-rose-500" />Gastos {Math.round(pExp)}%</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-violet-500" />Ahorros {Math.round(pSav)}%</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-400/60" />Libre {Math.max(0, Math.round(100 - pExp - pSav))}%</li>
          </ul>
        </div>
      )}

      {/* Ingresos por día */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <Icon name="calendar-check" className="size-4 text-emerald-500" />
            Ingresos por día
          </h2>
          {onAddIncome && (
            <button
              type="button"
              onClick={onAddIncome}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Añadir ingreso
            </button>
          )}
        </div>

        {sortedIncomes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-400">
            Aún no registras ingresos este mes. Añade el primero con el día en que lo recibes.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {sortedIncomes.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => onEditIncome?.(i)}
                  title={`Editar${i.description ? ` · ${i.description}` : ""}`}
                  aria-label={`Editar ingreso del día ${Number(i.income_date.slice(8, 10))}: ${i.description || "sin descripción"}`}
                  className="group flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-slate-900 py-1.5 pr-3 pl-1.5 text-left hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                    <Icon name={i.icon} className="size-4" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-slate-400">Día {Number(i.income_date.slice(8, 10))}</span>
                    {i.description && <span className="max-w-[10rem] truncate text-xs text-slate-300">{i.description}</span>}
                  </span>
                  <span className="font-bold tabular-nums text-emerald-300">+{usd(i.amount)}</span>
                  <Pencil className="size-3.5 text-slate-500 group-hover:text-slate-200" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

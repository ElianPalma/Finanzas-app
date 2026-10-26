import { CheckCircle2, Circle, Copy, EyeOff, Pencil, Plus, Repeat, Sparkles, Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { TYPE_META, isRecurringType, usd } from "@/lib/finance";
import type { Expense, ExpenseType } from "@/types/finance";

const FIXED_ORDER: ExpenseType[] = ["indispensable", "servicio"];
const EXTRA_ORDER: ExpenseType[] = ["prioridad_alta", "prioridad_media", "prioridad_baja"];

interface Props {
  expenses: Expense[];
  onTogglePaid: (id: string, paid: boolean) => void;
  /** Fijo: se quita desde este mes en adelante. Eventual: se elimina. */
  onRemove: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  /** Copia los gastos fijos del mes anterior a este mes */
  onCopyPrevious?: () => void;
  onAdd?: () => void;
}

type RowProps = { expense: Expense } & Pick<Props, "onTogglePaid" | "onRemove" | "onEdit">;

function Row({ expense, onTogglePaid, onRemove, onEdit }: RowProps) {
  const meta = TYPE_META[expense.category.type];
  const recurring = expense.template_id !== null;
  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-800/60">
      <button
        type="button"
        onClick={() => onTogglePaid(expense.id, !expense.is_paid)}
        aria-pressed={expense.is_paid}
        aria-label={expense.is_paid ? `Marcar ${expense.name} como pendiente` : `Marcar ${expense.name} como pagado`}
        className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        {expense.is_paid ? (
          <CheckCircle2 className="size-6 text-emerald-500" />
        ) : (
          <Circle className="size-6 text-slate-600" />
        )}
      </button>

      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${meta.badge}`}>
        <Icon name={expense.category.icon} className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${expense.is_paid ? "text-slate-500 line-through" : "text-slate-100"}`}>
          {expense.name}
        </p>
        <p className="truncate text-xs text-slate-400">{expense.category.name}</p>
      </div>

      {recurring && (
        <span title="Se repite cada mes" className="text-slate-500">
          <Repeat className="size-4" aria-hidden="true" />
        </span>
      )}

      <span className="font-bold tabular-nums text-slate-100">{usd(expense.amount)}</span>

      <button
        type="button"
        onClick={() => onEdit(expense)}
        aria-label={`Editar ${expense.name}`}
        title="Editar"
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(expense)}
        aria-label={recurring ? `Quitar ${expense.name} desde este mes` : `Eliminar ${expense.name}`}
        title={recurring ? "Quitar desde este mes (los meses anteriores no cambian)" : "Eliminar"}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        {recurring ? <EyeOff className="size-4" /> : <Trash2 className="size-4" />}
      </button>
    </li>
  );
}

function Group({
  type,
  items,
  ...handlers
}: { type: ExpenseType; items: Expense[] } & Pick<Props, "onTogglePaid" | "onRemove" | "onEdit">) {
  if (items.length === 0) return null;
  const meta = TYPE_META[type];
  const subtotal = items.reduce((s, e) => s + e.amount, 0);
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.badge}`}>
          <Icon name={meta.icon} className="size-3.5" />
          {meta.label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-400">{usd(subtotal)}</span>
      </div>
      <ul>
        {items.map((e) => (
          <Row key={e.id} expense={e} {...handlers} />
        ))}
      </ul>
    </div>
  );
}

function SectionHeader({ icon, title, total, tone }: { icon: React.ReactNode; title: string; total: number; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-extrabold">
        <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
        {title}
      </h2>
      <span className="text-lg font-extrabold tabular-nums">{usd(total)}</span>
    </div>
  );
}

export function ExpenseList({ expenses, onTogglePaid, onRemove, onEdit, onCopyPrevious, onAdd }: Props) {
  const visible = expenses.filter((e) => !e.is_skipped);
  const byType = (t: ExpenseType) => visible.filter((e) => e.category.type === t);
  const sum = (types: ExpenseType[]) =>
    visible.filter((e) => types.includes(e.category.type)).reduce((s, e) => s + e.amount, 0);
  const handlers = { onTogglePaid, onRemove, onEdit };
  const hasExtras = EXTRA_ORDER.some((t) => byType(t).length > 0);

  return (
    <section aria-label="Gastos del mes" className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Icon name="receipt" className="size-5 text-rose-400" />
          Gastos
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
        {onCopyPrevious && (
          <button
            type="button"
            onClick={onCopyPrevious}
            title="Deja los gastos fijos de este mes igual que el mes anterior"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <Copy className="size-4" aria-hidden="true" />
            Copiar mes anterior
          </button>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <Plus className="size-4" aria-hidden="true" />
            Añadir gasto
          </button>
        )}
        </div>
      </div>

      {/* FIJOS: se repiten cada mes */}
      <SectionHeader
        icon={<Repeat className="size-4" />}
        title="Fijos del mes"
        total={sum(FIXED_ORDER)}
        tone="bg-slate-700 text-white"
      />
      {FIXED_ORDER.every((t) => byType(t).length === 0) ? (
        <p className="mt-2 px-2 text-sm text-slate-400">
          Añade comida, internet u otros gastos que se repiten: aparecerán solos en los meses siguientes.
        </p>
      ) : (
        FIXED_ORDER.map((t) => <Group key={t} type={t} items={byType(t)} {...handlers} />)
      )}

      <hr className="my-5 border-slate-800" />

      {/* EXTRAS: solo existen este mes */}
      <SectionHeader
        icon={<Sparkles className="size-4" />}
        title="Extras de este mes"
        total={sum(EXTRA_ORDER)}
        tone="bg-amber-500/15 text-amber-300"
      />
      {!hasExtras ? (
        <p className="mt-2 px-2 text-sm text-slate-400">
          Sin extras por ahora. Los gastos eventuales (cine, regalos…) se guardan con su prioridad y solo cuentan en este mes.
        </p>
      ) : (
        EXTRA_ORDER.map((t) => <Group key={t} type={t} items={byType(t)} {...handlers} />)
      )}
    </section>
  );
}

// Útil al crear un gasto: ¿debe repetirse cada mes?
export { isRecurringType };

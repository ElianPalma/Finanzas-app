"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PiggyBank, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MONTHS, isRecurringType } from "@/lib/finance";
import { MonthOverview } from "./MonthOverview";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { AddExpenseDialog, type ExpenseFormValues } from "@/components/expenses/AddExpenseDialog";
import { CategoryDialog } from "@/components/expenses/CategoryDialog";
import { SavingsEnvelope } from "@/components/savings/SavingsEnvelope";
import { AddGoalDialog } from "@/components/savings/AddGoalDialog";
import { Botiquin } from "@/components/botiquin/Botiquin";
import { BotiquinDialog } from "@/components/botiquin/BotiquinDialog";
import { EventsSection } from "@/components/events/EventsSection";
import { EventDialog } from "@/components/events/EventDialog";
import type {
  Category,
  EventItem,
  Expense,
  ExpenseType,
  Goal,
  GoalColor,
  Income,
  MonthSummary,
} from "@/types/finance";

const pad = (n: number) => String(n).padStart(2, "0");

interface MonthData {
  summary: MonthSummary;
  incomes: Income[];
  expenses: Expense[];
  goals: Goal[]; // solo sobres de ahorro
  botiquin: Goal | null;
  /** Total acumulado en botiquín + sobres hasta el mes que se ve */
  savingsTotal: number;
  events: EventItem[];
  categories: Category[];
}

type DialogName = "income" | "expense" | "goal" | "botiquin" | "event" | null;

export function MonthView({ year, month }: { year: number; month: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<MonthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogName>(null);

  // Elemento que se está editando en cada diálogo (null = modo crear)
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [catDialog, setCatDialog] = useState<{ category: Category | null; type: ExpenseType } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    // 1. Clona los gastos fijos hasta este mes (idempotente)
    const sync = await supabase.rpc("sync_recurring_expenses", { p_year: year, p_month: month });
    if (sync.error) return setError(sync.error.message);

    const from = `${year}-${pad(month)}-01`;
    const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;

    // 2. Resumen (con arrastre), ingresos, gastos, sobres/botiquín, eventos y categorías
    const [summary, incomes, expenses, goals, contribs, events, categories] = await Promise.all([
      supabase.rpc("month_summary", { p_year: year, p_month: month }).single(),
      supabase.from("incomes").select("*").gte("income_date", from).lt("income_date", next).order("income_date"),
      supabase.from("expenses").select("*, category:categories(*)").eq("year", year).eq("month", month).order("name"),
      supabase.from("savings_goals").select("*").order("created_at"),
      supabase.from("savings_contributions").select("goal_id, year, month, amount"),
      supabase.from("events").select("*").order("event_month").order("event_day"),
      supabase.from("categories").select("*").order("name"),
    ]);
    const failed = [summary, incomes, expenses, goals, contribs, events, categories].find((r) => r.error);
    if (failed?.error) return setError(failed.error.message);

    const s = summary.data as Record<string, string | number>;

    // Saldo de cada sobre/botiquín AL MES QUE SE VE: arrastre de meses anteriores + aportes de este mes.
    // (Los aportes de meses posteriores no cuentan todavía.)
    const cur = year * 12 + month;
    const carryBy: Record<string, number> = {};
    const addedBy: Record<string, number> = {};
    for (const c of contribs.data ?? []) {
      const k = Number(c.year) * 12 + Number(c.month);
      const a = Number(c.amount);
      if (k < cur) carryBy[c.goal_id] = (carryBy[c.goal_id] ?? 0) + a;
      else if (k === cur) addedBy[c.goal_id] = (addedBy[c.goal_id] ?? 0) + a;
    }
    const allGoals = (goals.data ?? []).map((g) => {
      const carry = carryBy[g.id] ?? 0;
      const added = addedBy[g.id] ?? 0;
      return {
        ...g,
        target_amount: Number(g.target_amount),
        current_amount: Math.max(0, carry + added),
        carry,
        added,
      };
    }) as Goal[];

    setData({
      summary: {
        carryover: Number(s.carryover),
        total_income: Number(s.total_income),
        total_expenses: Number(s.total_expenses),
        total_savings: Number(s.total_savings),
        available: Number(s.available),
      },
      incomes: (incomes.data ?? []).map((i) => ({ ...i, amount: Number(i.amount) })) as Income[],
      expenses: (expenses.data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[],
      goals: allGoals.filter((g) => g.kind !== "botiquin"),
      botiquin: allGoals.find((g) => g.kind === "botiquin") ?? null,
      savingsTotal: allGoals.reduce((s, g) => s + g.current_amount, 0),
      events: (events.data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as EventItem[],
      categories: (categories.data ?? []) as Category[],
    });
  }, [supabase, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Gastos ----------
  const togglePaid = async (id: string, paid: boolean) => {
    await supabase.from("expenses").update({ is_paid: paid }).eq("id", id);
    load();
  };

  // Fijo: se quita de este mes y de los siguientes (los meses anteriores no cambian).
  // Eventual: se elimina.
  const removeExpense = async (e: Expense) => {
    if (e.template_id) {
      await supabase
        .from("expenses")
        .update({ is_skipped: true })
        .eq("template_id", e.template_id)
        .or(`year.gt.${year},and(year.eq.${year},month.gte.${month})`);
    } else {
      await supabase.from("expenses").delete().eq("id", e.id);
    }
    load();
  };

  // Deja los gastos fijos de este mes como una copia exacta del mes anterior
  const copyPreviousMonth = async () => {
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    const ok = window.confirm(
      `Los gastos fijos de ${MONTHS[month - 1]} ${year} se reemplazarán por una copia exacta de ${MONTHS[pm - 1]} ${py} (mismos nombres y montos, sin pagar).\n\n` +
        `Los fijos que añadiste solo en ${MONTHS[month - 1]} se quitarán. Los gastos eventuales no se tocan.\n\n¿Continuar?`
    );
    if (!ok) return;
    const { error } = await supabase.rpc("copy_fixed_from_previous", { p_year: year, p_month: month });
    if (error) {
      window.alert(error.message);
      return;
    }
    await load();
  };

  const addExpense = async (input: ExpenseFormValues) => {
    if (isRecurringType(input.type)) {
      // Fijo: plantilla que aparece en este mes y todos los siguientes
      const { error } = await supabase.from("recurring_expenses").insert({
        category_id: input.categoryId,
        name: input.name,
        base_amount: input.amount,
        start_year: year,
        start_month: month,
      });
      if (error) throw new Error(error.message);
      await supabase.rpc("sync_recurring_expenses", { p_year: year, p_month: month });
    } else {
      // Eventual: solo este mes
      const { error } = await supabase.from("expenses").insert({
        category_id: input.categoryId,
        name: input.name,
        amount: input.amount,
        year,
        month,
      });
      if (error) throw new Error(error.message);
    }
    await load();
  };

  const updateExpense = async (e: Expense, v: ExpenseFormValues) => {
    const fields = { category_id: v.categoryId, name: v.name, amount: v.amount };
    const { error } = await supabase.from("expenses").update(fields).eq("id", e.id);
    if (error) throw new Error(error.message);

    if (e.template_id && v.applyForward) {
      // La plantilla (para los meses que aún no existen) y los meses siguientes ya creados
      const t = await supabase
        .from("recurring_expenses")
        .update({ category_id: v.categoryId, name: v.name, base_amount: v.amount })
        .eq("id", e.template_id);
      if (t.error) throw new Error(t.error.message);
      const f = await supabase
        .from("expenses")
        .update(fields)
        .eq("template_id", e.template_id)
        .or(`year.gt.${year},and(year.eq.${year},month.gt.${month})`);
      if (f.error) throw new Error(f.error.message);
    }
    await load();
  };

  // Evita que un doble clic cree el mismo gasto fijo dos veces
  const savingExpense = useRef(false);
  const submitExpense = async (v: ExpenseFormValues) => {
    if (savingExpense.current) return;
    savingExpense.current = true;
    try {
      if (editExpense) await updateExpense(editExpense, v);
      else await addExpense(v);
    } finally {
      savingExpense.current = false;
    }
  };

  // ---------- Categorías ----------
  const saveCategory = async (v: { name: string; icon: string; type: ExpenseType }) => {
    const target = catDialog?.category;
    const res = target
      ? await supabase.from("categories").update({ name: v.name, icon: v.icon }).eq("id", target.id)
      : await supabase.from("categories").insert({ name: v.name, icon: v.icon, type: v.type });
    if (res.error) {
      if (res.error.code === "23505") throw new Error("Ya tienes una categoría con ese nombre");
      throw new Error(res.error.message);
    }
    await load();
  };

  const deleteCategory = async (c: Category) => {
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) {
      if (error.code === "23503") throw new Error("Esta categoría tiene gastos asociados; cámbialos de categoría primero.");
      throw new Error(error.message);
    }
    await load();
  };

  // ---------- Ingresos ----------
  const submitIncome = async (v: { date: string; amount: number; description: string; icon: string }) => {
    const row = { income_date: v.date, amount: v.amount, description: v.description, icon: v.icon };
    const { error } = editIncome
      ? await supabase.from("incomes").update(row).eq("id", editIncome.id)
      : await supabase.from("incomes").insert(row);
    if (error) throw new Error(error.message);
    await load();
  };

  const deleteIncome = async (i: Income) => {
    const { error } = await supabase.from("incomes").delete().eq("id", i.id);
    if (error) throw new Error(error.message);
    await load();
  };

  // ---------- Sobres de ahorro y Botiquín ----------
  const contribute = async (goalId: string, amount: number) => {
    const { error } = await supabase.rpc("add_to_goal", {
      p_goal_id: goalId,
      p_year: year,
      p_month: month,
      p_amount: amount,
    });
    if (error) throw new Error(error.message);
    await load();
  };

  const withdraw = async (goalId: string, amount: number) => {
    const { error } = await supabase.rpc("withdraw_from_goal", {
      p_goal_id: goalId,
      p_year: year,
      p_month: month,
      p_amount: amount,
    });
    if (error) throw new Error(error.message);
    await load();
  };

  const submitGoal = async (v: { name: string; icon: string; color: GoalColor; target: number }) => {
    const row = { name: v.name, icon: v.icon, color: v.color, target_amount: v.target };
    const { error } = editGoal
      ? await supabase.from("savings_goals").update(row).eq("id", editGoal.id)
      : await supabase.from("savings_goals").insert({ ...row, kind: "sobre" });
    if (error) throw new Error(error.message);
    await load();
  };

  const deleteGoal = async (g: Goal) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", g.id);
    if (error) throw new Error(error.message);
    await load();
  };

  const submitBotiquin = async (v: { name: string; target: number }) => {
    const row = { name: v.name, target_amount: v.target };
    const { error } = editGoal
      ? await supabase.from("savings_goals").update(row).eq("id", editGoal.id)
      : await supabase.from("savings_goals").insert({ ...row, kind: "botiquin", icon: "briefcase-medical", color: "rose" });
    if (error) throw new Error(error.message);
    await load();
  };

  // ---------- Eventos ----------
  const submitEvent = async (v: { name: string; icon: string; month: number; day: number; amount: number; yearly: boolean }) => {
    const row = {
      name: v.name,
      icon: v.icon,
      event_month: v.month,
      event_day: v.day,
      amount: v.amount,
      year: v.yearly ? null : year,
    };
    const { error } = editEvent
      ? await supabase.from("events").update(row).eq("id", editEvent.id)
      : await supabase.from("events").insert(row);
    if (error) throw new Error(error.message);
    await load();
  };

  const deleteEvent = async (ev: EventItem) => {
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) throw new Error(error.message);
    await load();
  };

  // ---------- Abrir diálogos ----------
  const closeDialog = () => setDialog(null);
  const openExpense = (e: Expense | null) => { setEditExpense(e); setDialog("expense"); };
  const openIncome = (i: Income | null) => { setEditIncome(i); setDialog("income"); };
  const openGoal = (g: Goal | null) => { setEditGoal(g); setDialog("goal"); };
  const openBotiquin = (g: Goal | null) => { setEditGoal(g); setDialog("botiquin"); };
  const openEvent = (e: EventItem | null) => { setEditEvent(e); setDialog("event"); };

  if (error) {
    const needsMigration = /events|kind|withdraw_from_goal|schema cache/i.test(error);
    return (
      <div role="alert" className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        <p className="font-semibold">No se pudieron cargar los datos: {error}</p>
        {needsMigration && (
          <p>
            Parece que falta ejecutar la migración de la base de datos: pega el contenido de{" "}
            <code className="rounded bg-slate-900 px-1">supabase/migracion-v2.sql</code> en Supabase → SQL Editor → Run, y
            recarga la página.
          </p>
        )}
      </div>
    );
  }
  if (!data) return <p className="text-sm text-slate-400">Cargando el mes…</p>;

  return (
    <div className="space-y-6">
      <MonthOverview
        summary={data.summary}
        incomes={data.incomes}
        savingsTotal={data.savingsTotal}
        onAddIncome={() => openIncome(null)}
        onEditIncome={(i) => openIncome(i)}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ExpenseList
          expenses={data.expenses}
          onTogglePaid={togglePaid}
          onRemove={removeExpense}
          onCopyPrevious={copyPreviousMonth}
          onEdit={(e) => openExpense(e)}
          onAdd={() => openExpense(null)}
        />

        <div className="space-y-6">
          <Botiquin
            goal={data.botiquin}
            available={data.summary.available}
            onCreate={() => openBotiquin(null)}
            onEdit={(g) => openBotiquin(g)}
            onContribute={contribute}
            onWithdraw={withdraw}
          />

          <section aria-label="Sobres de ahorro">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                <PiggyBank className="size-5 text-violet-400" aria-hidden="true" />
                Sobres de ahorro
              </h2>
              <button
                type="button"
                onClick={() => openGoal(null)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nuevo sobre
              </button>
            </div>
            {data.goals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                Crea tu primer sobre (por ejemplo, “Registro de mercado Palma”) y ve llenarlo mes a mes.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
                {data.goals.map((g) => (
                  <SavingsEnvelope
                    key={g.id}
                    goal={g}
                    available={data.summary.available}
                    onContribute={contribute}
                    onEdit={(goal) => openGoal(goal)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <EventsSection
        events={data.events}
        year={year}
        month={month}
        onAdd={() => openEvent(null)}
        onEdit={(e) => openEvent(e)}
      />

      <AddIncomeDialog
        open={dialog === "income"}
        year={year}
        month={month}
        income={editIncome}
        onClose={closeDialog}
        onSubmit={submitIncome}
        onDelete={deleteIncome}
      />
      <AddExpenseDialog
        open={dialog === "expense"}
        categories={data.categories}
        expense={editExpense}
        onClose={closeDialog}
        onSubmit={submitExpense}
        onNewCategory={(type) => setCatDialog({ category: null, type })}
        onEditCategory={(c) => setCatDialog({ category: c, type: c.type })}
      />
      <CategoryDialog
        open={catDialog !== null}
        category={catDialog?.category ?? null}
        defaultType={catDialog?.type ?? "prioridad_media"}
        onClose={() => setCatDialog(null)}
        onSubmit={saveCategory}
        onDelete={deleteCategory}
      />
      <AddGoalDialog
        open={dialog === "goal"}
        goal={editGoal}
        onClose={closeDialog}
        onSubmit={submitGoal}
        onDelete={deleteGoal}
      />
      <BotiquinDialog
        open={dialog === "botiquin"}
        goal={editGoal}
        onClose={closeDialog}
        onSubmit={submitBotiquin}
        onDelete={deleteGoal}
      />
      <EventDialog
        open={dialog === "event"}
        year={year}
        month={month}
        event={editEvent}
        onClose={closeDialog}
        onSubmit={submitEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}

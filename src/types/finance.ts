export type ExpenseType =
  | "indispensable"
  | "servicio"
  | "prioridad_alta"
  | "prioridad_media"
  | "prioridad_baja";

export type GoalColor = "violet" | "emerald" | "amber" | "sky" | "rose";

export interface Category {
  id: string;
  name: string;
  icon: string; // nombre kebab-case de Lucide
  type: ExpenseType;
  user_id: string | null; // null = categoría por defecto (solo lectura)
}

export interface Expense {
  id: string;
  year: number;
  month: number;
  name: string;
  amount: number;
  is_paid: boolean;
  is_skipped: boolean;
  template_id: string | null; // no nulo = gasto recurrente clonado
  category: Category;
}

export interface Income {
  id: string;
  income_date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  icon: string;
}

export type GoalKind = "sobre" | "botiquin";

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: GoalColor;
  target_amount: number;
  current_amount: number;
  kind: GoalKind; // "sobre" = sobre de ahorro, "botiquin" = fondo de salud
  /** Lo que traía acumulado de los meses anteriores (calculado para el mes que se ve) */
  carry?: number;
  /** Aportes (+) o retiros (−) hechos en el mes que se ve */
  added?: number;
}

/** Evento con fecha (día/mes). year = null → se repite todos los años. */
export interface EventItem {
  id: string;
  name: string;
  icon: string;
  event_month: number; // 1-12
  event_day: number; // 1-31
  year: number | null;
  amount: number;
}

export interface MonthSummary {
  carryover: number;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  available: number;
}

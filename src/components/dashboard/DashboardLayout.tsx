"use client";

import Link from "next/link";
import { CalendarDays, Wallet } from "lucide-react";
import { MONTHS, MONTHS_SHORT, YEARS } from "@/lib/finance";

interface Props {
  year: number;
  month: number; // 1-12
  children: React.ReactNode;
}

export function DashboardLayout({ year, month, children }: Props) {
  const today = new Date();
  const isCurrent = (y: number, m: number) =>
    today.getFullYear() === y && today.getMonth() + 1 === m;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Mis finanzas</span>
          </div>

          {/* Selector de año */}
          <nav aria-label="Año" className="flex rounded-xl bg-slate-800 p-1">
            {YEARS.map((y) => (
              <Link
                key={y}
                href={`/${y}/${month}`}
                aria-current={y === year ? "page" : undefined}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                  y === year
                    ? "bg-slate-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {y}
              </Link>
            ))}
          </nav>
        </div>

        {/* Selector de mes */}
        <nav aria-label="Mes" className="w-full overflow-x-auto px-4 pt-1 pb-3 sm:px-6 lg:px-10">
          <ul className="flex min-w-max gap-2 xl:min-w-0 xl:[&>li]:flex-1">
            {MONTHS_SHORT.map((label, i) => {
              const m = i + 1;
              const active = m === month;
              return (
                <li key={label}>
                  <Link
                    href={`/${year}/${m}`}
                    aria-current={active ? "page" : undefined}
                    aria-label={`${MONTHS[i]} ${year}`}
                    className={`relative flex w-14 flex-col items-center rounded-xl border py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 xl:w-full ${
                      active
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    {label}
                    {isCurrent(year, m) && (
                      <span
                        className={`absolute -top-1 -right-1 size-2.5 rounded-full ring-2 ring-slate-950 ${
                          active ? "bg-amber-300" : "bg-emerald-500"
                        }`}
                        title="Mes actual"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-10">
        <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
          <CalendarDays className="size-6 text-emerald-500" aria-hidden="true" />
          {MONTHS[month - 1]} {year}
        </h1>
        {children}
      </main>
    </div>
  );
}

import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MonthView } from "@/components/dashboard/MonthView";

// Next.js 15: params es una Promise
export default async function MonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = await params;
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || y < 2000 || y > 2100 || !Number.isInteger(m) || m < 1 || m > 12) {
    notFound();
  }

  return (
    <DashboardLayout year={y} month={m}>
      <MonthView year={y} month={m} />
    </DashboardLayout>
  );
}

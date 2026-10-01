import { prisma } from "@/lib/prisma";
import { CalendarioClient } from "./calendario-client";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}) {
  const { mes, ano } = await searchParams;
  const now = new Date();
  const year = ano ? Number(ano) : now.getFullYear();
  const month = mes ? Number(mes) - 1 : now.getMonth(); // 0-indexado

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const schedules = await prisma.schedule.findMany({
    where: { date: { gte: firstDay, lte: lastDay } },
    include: { assignments: { include: { military: true } } },
    orderBy: { date: "asc" },
  });

  const schedulesData = schedules.map((s) => ({
    id: s.id,
    dateISO: s.date.toISOString(),
    assignments: s.assignments.map((a) => ({
      id: a.id,
      warName: a.military.warName,
      type: a.military.type,
    })),
  }));

  return <CalendarioClient year={year} month={month} schedules={schedulesData} />;
}

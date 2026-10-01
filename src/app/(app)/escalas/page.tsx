import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseDateOnly, toInputDateValue, addDays, toDateOnly } from "@/lib/utils";
import { EscalasClient } from "./escalas-client";

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}) {
  const session = await getSession();
  const { inicio, fim } = await searchParams;

  const today = toDateOnly(new Date());
  const startDate = inicio ? parseDateOnly(inicio) : today;
  const endDate = fim ? parseDateOnly(fim) : addDays(today, 13);

  const [schedules, militares] = await Promise.all([
    prisma.schedule.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
      include: { assignments: { include: { military: true } } },
    }),
    prisma.military.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const schedulesData = schedules.map((s) => ({
    id: s.id,
    dateISO: s.date.toISOString(),
    assignments: s.assignments.map((a) => ({
      id: a.id,
      militaryId: a.militaryId,
      military: {
        id: a.military.id,
        name: a.military.name,
        warName: a.military.warName,
        registration: a.military.registration,
        type: a.military.type,
        active: a.military.active,
      },
    })),
  }));

  const militaresData = militares.map((m) => ({
    id: m.id,
    name: m.name,
    warName: m.warName,
    registration: m.registration,
    type: m.type,
    active: m.active,
  }));

  return (
    <EscalasClient
      schedules={schedulesData}
      militares={militaresData}
      isAdmin={session?.role === "ADMIN"}
      startDate={toInputDateValue(startDate)}
      endDate={toInputDateValue(endDate)}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toDateOnly } from "@/lib/utils";
import { SolicitacoesClient } from "./solicitacoes-client";

export default async function SolicitacoesPage() {
  const session = await requireUser();
  const isAdmin = session.role === "ADMIN";

  const today = toDateOnly(new Date());

  console.log(prisma)

  const [requests, upcomingSchedules] = await Promise.all([
    prisma.swapRequest.findMany({
      where: isAdmin ? {} : { requestedById: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        schedule: true,
        fromMilitary: true,
        toMilitary: true,
        requestedBy: { select: { id: true, name: true } },
      },
    }),
    // Escalas de hoje em diante, para permitir abrir uma nova solicitação.
    prisma.schedule.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      include: { assignments: { include: { military: true } } },
    }),
  ]);

  const requestsData = requests.map((r) => ({
    id: r.id,
    scheduleId: r.scheduleId,
    status: r.status,
    reason: r.reason,
    createdAtISO: r.createdAt.toISOString(),
    scheduleDateISO: r.schedule.date.toISOString(),
    fromMilitary: { id: r.fromMilitary.id, warName: r.fromMilitary.warName, type: r.fromMilitary.type },
    toMilitary: r.toMilitary
      ? { id: r.toMilitary.id, warName: r.toMilitary.warName, type: r.toMilitary.type }
      : null,
    requestedBy: r.requestedBy,
  }));

  const schedulesData = upcomingSchedules.map((s) => ({
    id: s.id,
    dateISO: s.date.toISOString(),
    assignments: s.assignments.map((a) => ({
      id: a.id,
      militaryId: a.militaryId,
      military: {
        id: a.military.id,
        warName: a.military.warName,
        type: a.military.type,
        active: a.military.active,
      },
    })),
  }));

  const militares = await prisma.military.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, warName: true, type: true, active: true },
  });

  return (
    <SolicitacoesClient
      requests={requestsData}
      schedules={schedulesData}
      militares={militares}
      isAdmin={isAdmin}
      currentUserId={session.userId}
    />
  );
}

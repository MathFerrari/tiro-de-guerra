import { prisma } from "@/lib/prisma";
import { formatDate, toDateOnly } from "@/lib/utils";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-military-green-dark">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const today = toDateOnly(new Date());

  const [totalMilitares, atiradores, monitores, proximaEscala] = await Promise.all([
    prisma.military.count({ where: { active: true } }),
    prisma.military.count({ where: { active: true, type: "ATIRADOR" } }),
    prisma.military.count({ where: { active: true, type: "CB_DE_DIA" } }),
    prisma.schedule.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      include: { assignments: { include: { military: true } } },
    }),
  ]);

  const monitoresEscalados =
    proximaEscala?.assignments.filter((a) => a.military.type === "CB_DE_DIA") ?? [];
  const atiradoresEscalados =
    proximaEscala?.assignments.filter((a) => a.military.type === "ATIRADOR") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-military-green-dark">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total de militares" value={totalMilitares} />
        <Card label="Atiradores" value={atiradores} />
        <Card label="Monitores" value={monitores} />
        <Card label="Próxima escala" value={proximaEscala ? formatDate(proximaEscala.date) : "-"} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Próxima escala
        </h2>

        {!proximaEscala ? (
          <p className="text-sm text-gray-500">Nenhuma escala futura cadastrada.</p>
        ) : (
          <div>
            <p className="mb-3 text-lg font-semibold text-military-green-dark">
              {formatDate(proximaEscala.date)}
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Monitores</p>
                {monitoresEscalados.length === 0 ? (
                  <p className="text-sm text-gray-400">Ninguém escalado</p>
                ) : (
                  <ul className="text-sm text-military-dark">
                    {monitoresEscalados.map((a) => (
                      <li key={a.id}>{a.military.warName}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Atiradores</p>
                {atiradoresEscalados.length === 0 ? (
                  <p className="text-sm text-gray-400">Ninguém escalado</p>
                ) : (
                  <ul className="text-sm text-military-dark">
                    {atiradoresEscalados.map((a) => (
                      <li key={a.id}>{a.military.warName}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

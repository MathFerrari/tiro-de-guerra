"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

type DiaAssignment = { id: string; warName: string; type: "ATIRADOR" | "CB_DE_DIA" };
type ScheduleData = { id: string; dateISO: string; assignments: DiaAssignment[] };

const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioClient({
  year,
  month,
  schedules,
}: {
  year: number;
  month: number;
  schedules: ScheduleData[];
}) {
  const [selected, setSelected] = useState<ScheduleData | null>(null);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const schedulesByDay = new Map<number, ScheduleData>();
  schedules.forEach((s) => {
    const d = new Date(s.dateISO);
    schedulesByDay.set(d.getDate(), s);
  });

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-military-green-dark">
          {nomesMeses[month]} {year}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/calendario?mes=${prevMonth + 1}&ano=${prevYear}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-military-gray"
          >
            ← Anterior
          </Link>
          <Link
            href={`/calendario?mes=${nextMonth + 1}&ano=${nextYear}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-military-gray"
          >
            Próximo →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid min-w-[560px] grid-cols-7 gap-1">
          {diasSemana.map((d) => (
            <div key={d} className="px-2 py-1 text-center text-xs font-semibold uppercase text-gray-400">
              {d}
            </div>
          ))}

          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="min-h-[80px]" />;

            const schedule = schedulesByDay.get(day);
            const monitores = schedule?.assignments.filter((a) => a.type === "CB_DE_DIA").length ?? 0;
            const atiradores = schedule?.assignments.filter((a) => a.type === "ATIRADOR").length ?? 0;

            return (
              <button
                key={idx}
                onClick={() => schedule && setSelected(schedule)}
                disabled={!schedule}
                className={`flex min-h-[80px] flex-col items-start rounded-lg border p-2 text-left text-xs ${
                  schedule
                    ? "border-military-green-light bg-military-green-light/10 hover:bg-military-green-light/20"
                    : "border-gray-100"
                }`}
              >
                <span className="text-sm font-medium text-military-dark">{day}</span>
                {schedule && (
                  <span className="mt-1 flex flex-col text-military-green-dark">
                    <span>M: {monitores}</span>
                    <span>A: {atiradores}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={formatDate(new Date(selected.dateISO))}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Monitores</p>
              <MilitaryList items={selected.assignments.filter((a) => a.type === "CB_DE_DIA")} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Atiradores</p>
              <MilitaryList items={selected.assignments.filter((a) => a.type === "ATIRADOR")} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MilitaryList({ items }: { items: DiaAssignment[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">Ninguém escalado</p>;
  return (
    <ul className="text-sm text-military-dark">
      {items.map((a) => (
        <li key={a.id}>{a.warName}</li>
      ))}
    </ul>
  );
}

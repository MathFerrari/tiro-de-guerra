"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, typeLabels } from "@/lib/utils";
import {
  generateSchedule,
  swapMilitary,
  setScheduleMilitaries,
  deleteSchedule,
} from "@/actions/escalas";
import { generateEscalaPdf } from "@/lib/generate-escala-pdf";

type MilitaryLite = {
  id: string;
  name: string;
  warName: string;
  registration: string;
  type: "ATIRADOR" | "CB_DE_DIA";
  active: boolean;
};

type ScheduleData = {
  id: string;
  dateISO: string;
  assignments: { id: string; militaryId: string; military: MilitaryLite }[];
};

export function EscalasClient({
  schedules,
  militares,
  isAdmin,
  startDate,
  endDate,
}: {
  schedules: ScheduleData[];
  militares: MilitaryLite[];
  isAdmin: boolean;
  startDate: string;
  endDate: string;
}) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleData | null>(null);
  const [swapSchedule, setSwapSchedule] = useState<ScheduleData | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(scheduleId: string) {
    if (!confirm("Excluir esta escala? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      try {
        await deleteSchedule(scheduleId);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro ao excluir escala.");
      }
    });
  }

  function handleGeneratePdf(
    pdfStartDate: string,
    pdfEndDate: string,
  ) {
    if (pdfStartDate > pdfEndDate) {
      alert(
        "A data inicial deve ser menor ou igual à data final.",
      );
      return;
    }

    const selectedSchedules = schedules.filter(
      (schedule) =>
        schedule.dateISO.slice(0, 10) >= pdfStartDate &&
        schedule.dateISO.slice(0, 10) <= pdfEndDate,
    );

    if (selectedSchedules.length === 0) {
      alert(
        "Não existem escalas cadastradas no período selecionado.",
      );
      return;
    }

    generateEscalaPdf(
      selectedSchedules,
      pdfStartDate,
      pdfEndDate,
    );

    setPdfOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-military-green-dark">
          Escalas
        </h1>

        {isAdmin && (<div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPdfOpen(true)}
            disabled={schedules.length === 0}
          >
            Gerar PDF
          </Button>

          <Button onClick={() => setGenerateOpen(true)}>
            Gerar escala
          </Button>
        </div>)}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div>
          <Label htmlFor="inicio">Data inicial</Label>
          <Input id="inicio" name="inicio" type="date" defaultValue={startDate} />
        </div>
        <div>
          <Label htmlFor="fim">Data final</Label>
          <Input id="fim" name="fim" type="date" defaultValue={endDate} />
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        {schedules.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-400 shadow-sm">
            Nenhuma escala encontrada no período selecionado.
          </div>
        )}

        {schedules.map((schedule) => {
          const monitores = schedule.assignments.filter((a) => a.military.type === "CB_DE_DIA");
          const atiradores = schedule.assignments.filter((a) => a.military.type === "ATIRADOR");

          return (
            <div key={schedule.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-military-green-dark">
                  {formatDate(new Date(schedule.dateISO))}
                </h2>
                {isAdmin && (
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => setEditSchedule(schedule)}
                      className="text-military-green-mid hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setSwapSchedule(schedule)}
                      className="text-military-green-mid hover:underline"
                    >
                      Trocar
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      disabled={isPending}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <MilitaryList title="Monitores" items={monitores} />
                <MilitaryList title="Atiradores" items={atiradores} />
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <GerarEscalaModal open={generateOpen} onClose={() => setGenerateOpen(false)} />
      )}

      {isAdmin && (
        <GerarPdfModal
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          startDate={startDate}
          endDate={endDate}
          onGenerate={handleGeneratePdf}
        />
      )}

      {isAdmin && editSchedule && (
        <EditarEscalaModal
          schedule={editSchedule}
          militares={militares}
          onClose={() => setEditSchedule(null)}
        />
      )}

      {isAdmin && swapSchedule && (
        <TrocarModal
          schedule={swapSchedule}
          militares={militares}
          onClose={() => setSwapSchedule(null)}
        />
      )}
    </div>
  );

  function MilitaryList({ title, items }: { title: string; items: ScheduleData["assignments"] }) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-gray-400">{title}</p>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Ninguém escalado</p>
        ) : (
          <ul className="text-sm text-military-dark">
            {items.map((a) => (
              <li key={a.id}>{a.military.warName}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

function GerarEscalaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [error, setError] = useState("");
  const [includeMonitores, setIncludeMonitores] = useState(true);
  const [includeAtiradores, setIncludeAtiradores] = useState(true);

  async function handleSubmit(formData: FormData) {
    setError("");
    try {
      await generateSchedule(formData);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar escala.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gerar escala">
      <form action={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Data inicial</Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div>
            <Label htmlFor="endDate">Data final</Label>
            <Input id="endDate" name="endDate" type="date" required />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="includeMonitores"
              checked={includeMonitores}
              onChange={(e) => setIncludeMonitores(e.target.checked)}
            />
            Monitores
          </label>
          {includeMonitores && (
            <div>
              <Label htmlFor="monitoresPerDay">Quantidade de monitores por dia</Label>
              <Input id="monitoresPerDay" name="monitoresPerDay" type="number" min={1} defaultValue={2} />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="includeAtiradores"
              checked={includeAtiradores}
              onChange={(e) => setIncludeAtiradores(e.target.checked)}
            />
            Atiradores
          </label>
          {includeAtiradores && (
            <div>
              <Label htmlFor="atiradoresPerDay">Quantidade de atiradores por dia</Label>
              <Input id="atiradoresPerDay" name="atiradoresPerDay" type="number" min={1} defaultValue={4} />
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Gerar</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditarEscalaModal({
  schedule,
  militares,
  onClose,
}: {
  schedule: ScheduleData;
  militares: MilitaryLite[];
  onClose: () => void;
}) {
  const monitoresDisponiveis = militares.filter((m) => m.type === "CB_DE_DIA");
  const atiradoresDisponiveis = militares.filter((m) => m.type === "ATIRADOR");

  const [monitoresSelecionados, setMonitoresSelecionados] = useState<string[]>(
    schedule.assignments.filter((a) => a.military.type === "CB_DE_DIA").map((a) => a.militaryId)
  );
  const [atiradoresSelecionados, setAtiradoresSelecionados] = useState<string[]>(
    schedule.assignments.filter((a) => a.military.type === "ATIRADOR").map((a) => a.militaryId)
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await setScheduleMilitaries(schedule.id, "CB_DE_DIA", monitoresSelecionados);
      await setScheduleMilitaries(schedule.id, "ATIRADOR", atiradoresSelecionados);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Editar escala - ${formatDate(new Date(schedule.dateISO))}`}>
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Monitores</p>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {monitoresDisponiveis.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={monitoresSelecionados.includes(m.id)}
                  onChange={() => toggle(monitoresSelecionados, setMonitoresSelecionados, m.id)}
                />
                {m.warName}
              </label>
            ))}
            {monitoresDisponiveis.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum monitor ativo cadastrado.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Atiradores</p>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {atiradoresDisponiveis.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={atiradoresSelecionados.includes(m.id)}
                  onChange={() => toggle(atiradoresSelecionados, setAtiradoresSelecionados, m.id)}
                />
                {m.warName}
              </label>
            ))}
            {atiradoresDisponiveis.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum atirador ativo cadastrado.</p>
            )}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TrocarModal({
  schedule,
  militares,
  onClose,
}: {
  schedule: ScheduleData;
  militares: MilitaryLite[];
  onClose: () => void;
}) {
  const [fromId, setFromId] = useState(schedule.assignments[0]?.militaryId ?? "");
  const [toId, setToId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fromAssignment = schedule.assignments.find((a) => a.militaryId === fromId);
  const tipoAtual = fromAssignment?.military.type;

  const jaEscaladosIds = new Set(schedule.assignments.map((a) => a.militaryId));
  const opcoesDestino = militares.filter(
    (m) => m.type === tipoAtual && m.active && !jaEscaladosIds.has(m.id)
  );

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await swapMilitary(schedule.id, fromId, toId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao realizar a troca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Trocar - ${formatDate(new Date(schedule.dateISO))}`}>
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {schedule.assignments.length === 0 ? (
          <p className="text-sm text-gray-400">Não há ninguém escalado neste dia.</p>
        ) : (
          <>
            <div>
              <Label htmlFor="from">Trocar</Label>
              <select
                id="from"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={fromId}
                onChange={(e) => {
                  setFromId(e.target.value);
                  setToId("");
                }}
              >
                {schedule.assignments.map((a) => (
                  <option key={a.militaryId} value={a.militaryId}>
                    {a.military.warName} ({typeLabels[a.military.type]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="to">Por</Label>
              <select
                id="to"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                <option value="">Selecione um militar</option>
                {opcoesDestino.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.warName}
                  </option>
                ))}
              </select>
              {opcoesDestino.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  Não há outro militar disponível do mesmo tipo para esta troca.
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !toId || schedule.assignments.length === 0}
          >
            Confirmar troca
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function GerarPdfModal({
  open,
  onClose,
  startDate,
  endDate,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onGenerate: (
    startDate: string,
    endDate: string,
  ) => void;
}) {
  const [pdfStartDate, setPdfStartDate] =
    useState(startDate);

  const [pdfEndDate, setPdfEndDate] =
    useState(endDate);

  function handleGenerate() {
    if (!pdfStartDate || !pdfEndDate) {
      alert(
        "Informe a data inicial e a data final.",
      );
      return;
    }

    if (pdfStartDate > pdfEndDate) {
      alert(
        "A data inicial deve ser menor ou igual à data final.",
      );
      return;
    }

    onGenerate(
      pdfStartDate,
      pdfEndDate,
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerar PDF da escala"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-military-dark">
            Selecione o período
          </p>

          <p className="mt-1 text-xs text-gray-500">
            O PDF será gerado somente com as
            escalas cadastradas dentro do período
            selecionado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pdfStartDate">
              Data inicial
            </Label>

            <Input
              id="pdfStartDate"
              type="date"
              value={pdfStartDate}
              onChange={(e) =>
                setPdfStartDate(
                  e.target.value,
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="pdfEndDate">
              Data final
            </Label>

            <Input
              id="pdfEndDate"
              type="date"
              value={pdfEndDate}
              onChange={(e) =>
                setPdfEndDate(
                  e.target.value,
                )
              }
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Documento
          </p>

          <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
            <span>
              Formato: A4 vertical
            </span>

            <span>
              Orientação: Retrato
            </span>

            <span>
              Organização: 4 escalas por página
            </span>
          </div>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleGenerate}
          >
            Gerar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

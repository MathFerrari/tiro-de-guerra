"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { formatDate, formatDateTime, typeLabels, swapRequestStatusLabels } from "@/lib/utils";
import {
  createSwapRequest,
  cancelSwapRequest,
  approveSwapRequest,
  rejectSwapRequest,
} from "@/actions/solicitacoes";

type MilitaryLite = {
  id: string;
  warName: string;
  type: "ATIRADOR" | "CB_DE_DIA";
  active: boolean;
};

type ScheduleData = {
  id: string;
  dateISO: string;
  assignments: { id: string; militaryId: string; military: MilitaryLite }[];
};

type RequestStatus = "PENDENTE" | "APROVADA" | "REJEITADA";

type RequestData = {
  id: string;
  scheduleId: string;
  status: RequestStatus;
  reason: string | null;
  createdAtISO: string;
  scheduleDateISO: string;
  fromMilitary: { id: string; warName: string; type: "ATIRADOR" | "CB_DE_DIA" };
  toMilitary: { id: string; warName: string; type: "ATIRADOR" | "CB_DE_DIA" } | null;
  requestedBy: { id: string; name: string };
};

const statusColor: Record<RequestStatus, "green" | "gray" | "red"> = {
  PENDENTE: "gray",
  APROVADA: "green",
  REJEITADA: "red",
};

export function SolicitacoesClient({
  requests,
  schedules,
  militares,
  isAdmin,
  currentUserId,
}: {
  requests: RequestData[];
  schedules: ScheduleData[];
  militares: MilitaryLite[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [novaOpen, setNovaOpen] = useState(false);
  const [aprovarRequest, setAprovarRequest] = useState<RequestData | null>(null);
  const [actionError, setActionError] = useState("");

  const pendentes = requests.filter((r) => r.status === "PENDENTE");
  const analisadas = requests.filter((r) => r.status !== "PENDENTE");

  async function handleCancel(id: string) {
    if (!confirm("Cancelar esta solicitação?")) return;
    setActionError("");
    try {
      await cancelSwapRequest(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao cancelar solicitação.");
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Rejeitar esta solicitação?")) return;
    setActionError("");
    try {
      await rejectSwapRequest(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao rejeitar solicitação.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-military-green-dark">
          {isAdmin ? "Solicitações de troca" : "Minhas solicitações de troca"}
        </h1>
        <Button onClick={() => setNovaOpen(true)}>+ Nova solicitação</Button>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      )}

      <Section title="Pendentes">
        {pendentes.length === 0 ? (
          <EmptyState text="Nenhuma solicitação pendente." />
        ) : (
          pendentes.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              isAdmin={isAdmin}
              isOwner={r.requestedBy.id === currentUserId}
              onCancel={() => handleCancel(r.id)}
              onApprove={() => setAprovarRequest(r)}
              onReject={() => handleReject(r.id)}
            />
          ))
        )}
      </Section>

      <Section title="Histórico">
        {analisadas.length === 0 ? (
          <EmptyState text="Nenhuma solicitação analisada ainda." />
        ) : (
          analisadas.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              isAdmin={isAdmin}
              isOwner={r.requestedBy.id === currentUserId}
              onCancel={() => handleCancel(r.id)}
              onApprove={() => setAprovarRequest(r)}
              onReject={() => handleReject(r.id)}
            />
          ))
        )}
      </Section>

      <NovaSolicitacaoModal
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        schedules={schedules}
        militares={militares}
      />

      {aprovarRequest && (
        <AprovarModal
          request={aprovarRequest}
          militares={militares}
          schedules={schedules}
          onClose={() => setAprovarRequest(null)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-sm">
      {text}
    </div>
  );
}

function RequestCard({
  request,
  isAdmin,
  isOwner,
  onCancel,
  onApprove,
  onReject,
}: {
  request: RequestData;
  isAdmin: boolean;
  isOwner: boolean;
  onCancel: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-military-green-dark">
            {formatDate(new Date(request.scheduleDateISO))}
          </p>
          <p className="text-sm text-military-dark">
            Trocar <span className="font-medium">{request.fromMilitary.warName}</span>{" "}
            <span className="text-gray-400">({typeLabels[request.fromMilitary.type]})</span>
            {request.toMilitary && (
              <>
                {" "}
                por <span className="font-medium">{request.toMilitary.warName}</span>
              </>
            )}
          </p>
          {request.reason && <p className="mt-1 text-sm text-gray-500">Motivo: {request.reason}</p>}
          <p className="mt-1 text-xs text-gray-400">
            Solicitado por {request.requestedBy.name} em {formatDateTime(new Date(request.createdAtISO))}
          </p>
        </div>

        <Badge color={statusColor[request.status]}>{swapRequestStatusLabels[request.status]}</Badge>
      </div>

      {request.status === "PENDENTE" && (
        <div className="mt-3 flex gap-3 text-sm">
          {isAdmin && (
            <>
              <button onClick={onApprove} className="text-military-green-mid hover:underline">
                Aprovar
              </button>
              <button onClick={onReject} className="text-red-600 hover:underline">
                Rejeitar
              </button>
            </>
          )}
          {isOwner && !isAdmin && (
            <button onClick={onCancel} className="text-red-600 hover:underline">
              Cancelar solicitação
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NovaSolicitacaoModal({
  open,
  onClose,
  schedules,
  militares,
}: {
  open: boolean;
  onClose: () => void;
  schedules: ScheduleData[];
  militares: MilitaryLite[];
}) {
  const [scheduleId, setScheduleId] = useState("");
  const [fromMilitaryId, setFromMilitaryId] = useState("");
  const [toMilitaryId, setToMilitaryId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const schedule = schedules.find((s) => s.id === scheduleId);
  const fromAssignment = schedule?.assignments.find((a) => a.militaryId === fromMilitaryId);
  const tipoAtual = fromAssignment?.military.type;

  const substitutosDisponiveis = useMemo(() => {
    if (!schedule || !tipoAtual) return [];
    const jaEscaladosIds = new Set(schedule.assignments.map((a) => a.militaryId));
    return militares.filter((m) => m.type === tipoAtual && m.active && !jaEscaladosIds.has(m.id));
  }, [schedule, tipoAtual, militares]);

  function reset() {
    setScheduleId("");
    setFromMilitaryId("");
    setToMilitaryId("");
    setError("");
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    setSaving(true);
    try {
      await createSwapRequest(formData);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar solicitação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nova solicitação de troca"
    >
      <form action={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <Label htmlFor="scheduleId">Data da escala</Label>
          <select
            id="scheduleId"
            name="scheduleId"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            value={scheduleId}
            onChange={(e) => {
              setScheduleId(e.target.value);
              setFromMilitaryId("");
              setToMilitaryId("");
            }}
          >
            <option value="">Selecione uma data</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(new Date(s.dateISO))}
              </option>
            ))}
          </select>
          {schedules.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">Não há escalas futuras cadastradas.</p>
          )}
        </div>

        {schedule && (
          <div>
            <Label htmlFor="fromMilitaryId">Quem você quer trocar</Label>
            <select
              id="fromMilitaryId"
              name="fromMilitaryId"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={fromMilitaryId}
              onChange={(e) => {
                setFromMilitaryId(e.target.value);
                setToMilitaryId("");
              }}
            >
              <option value="">Selecione um militar escalado</option>
              {schedule.assignments.map((a) => (
                <option key={a.militaryId} value={a.militaryId}>
                  {a.military.warName} ({typeLabels[a.military.type]})
                </option>
              ))}
            </select>
            {schedule.assignments.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Não há ninguém escalado nesta data.</p>
            )}
          </div>
        )}

        {fromMilitaryId && (
          <div>
            <Label htmlFor="toMilitaryId">Substituto sugerido (opcional)</Label>
            <select
              id="toMilitaryId"
              name="toMilitaryId"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={toMilitaryId}
              onChange={(e) => setToMilitaryId(e.target.value)}
            >
              <option value="">O admin escolhe ao aprovar</option>
              {substitutosDisponiveis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.warName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-military-green-mid focus:outline-none focus:ring-1 focus:ring-military-green-mid"
            placeholder="Explique o motivo da troca, se quiser"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            Enviar solicitação
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AprovarModal({
  request,
  militares,
  schedules,
  onClose,
}: {
  request: RequestData;
  militares: MilitaryLite[];
  schedules: ScheduleData[];
  onClose: () => void;
}) {
  const schedule = schedules.find((s) => s.id === request.scheduleId);

  const jaEscaladosIds = new Set(schedule?.assignments.map((a) => a.militaryId) ?? []);
  const opcoes = militares.filter(
    (m) =>
      m.type === request.fromMilitary.type &&
      m.active &&
      (!jaEscaladosIds.has(m.id) || m.id === request.toMilitary?.id)
  );

  const [toMilitaryId, setToMilitaryId] = useState(request.toMilitary?.id ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleApprove() {
    setError("");
    setSaving(true);
    try {
      await approveSwapRequest(request.id, toMilitaryId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao aprovar solicitação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Aprovar troca - ${formatDate(new Date(request.scheduleDateISO))}`}>
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <p className="text-sm text-military-dark">
          Trocar <span className="font-medium">{request.fromMilitary.warName}</span> por:
        </p>

        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={toMilitaryId}
          onChange={(e) => setToMilitaryId(e.target.value)}
        >
          <option value="">Selecione um militar</option>
          {opcoes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.warName}
            </option>
          ))}
        </select>
        {opcoes.length === 0 && (
          <p className="text-xs text-gray-400">
            Não há outro militar disponível do mesmo tipo para esta troca.
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApprove} disabled={saving || !toMilitaryId}>
            Confirmar aprovação
          </Button>
        </div>
      </div>
    </Modal>
  );
}

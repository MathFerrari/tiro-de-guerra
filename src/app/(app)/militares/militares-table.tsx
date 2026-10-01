"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Military } from "../../../../generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { typeLabels } from "@/lib/utils";
import { createMilitary, updateMilitary, toggleMilitaryActive } from "@/actions/militares";

const filters = [
  { label: "Todos", value: undefined },
  { label: "Atiradores", value: "ATIRADOR" },
  { label: "Cabos de dia", value: "CB_DE_DIA" },
];

export function MilitaresTable({
  militares,
  isAdmin,
  filtroAtual,
}: {
  militares: Military[];
  isAdmin: boolean;
  filtroAtual?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Military | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(m: Military) {
    setEditing(m);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    try {
      if (editing) {
        await updateMilitary(editing.id, formData);
      } else {
        await createMilitary(formData);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar militar.");
    }
  }

  function handleToggleActive(id: string) {
    startTransition(async () => {
      try {
        await toggleMilitaryActive(id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro ao atualizar militar.");
      }
    });
  }

  console.log(militares)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/militares?tipo=${f.value}` : "/militares"}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filtroAtual === f.value || (!filtroAtual && !f.value)
                  ? "bg-military-green-mid text-white"
                  : "bg-white text-military-green-dark border border-gray-300"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {isAdmin && <Button onClick={openCreate}>+ Novo militar</Button>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-military-gray text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Nome de guerra</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              {isAdmin && <th className="px-4 py-3">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {militares.map((m) => (
              <tr key={m.id} className={!m.active ? "opacity-60" : ""}>
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3">{m.warName}</td>
                <td className="px-4 py-3">{m.registration}</td>
                <td className="px-4 py-3">
                  <Badge color={m.type === "CB_DE_DIA" ? "green" : "gray"}>{typeLabels[m.type]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={m.active ? "green" : "red"}>{m.active ? "Ativo" : "Inativo"}</Badge>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-military-green-mid hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(m.id)}
                        disabled={isPending}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {m.active ? "Inativar" : "Reativar"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {militares.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Nenhum militar encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar militar" : "Novo militar"}>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={editing?.name} required />
          </div>
          <div>
            <Label htmlFor="warName">Nome de guerra</Label>
            <Input id="warName" name="warName" defaultValue={editing?.warName} placeholder="Opcional" />
          </div>
          <div>
            <Label htmlFor="registration">Matrícula</Label>
            <Input id="registration" name="registration" defaultValue={editing?.registration} required />
          </div>
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select id="type" name="type" defaultValue={editing?.type ?? "ATIRADOR"} required>
              <option value="ATIRADOR">Atirador</option>
              <option value="CB_DE_DIA">Cabo de dia</option>
            </Select>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

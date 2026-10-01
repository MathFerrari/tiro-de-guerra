"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { swapMilitary } from "./escalas";

// Usuário (ADMIN ou USER) cria uma solicitação de troca para um militar
// escalado em um dia específico. O substituto sugerido é opcional — se não
// for informado, o admin escolhe quem entra no lugar ao aprovar.
export async function createSwapRequest(formData: FormData) {
  const session = await requireUser();

  const scheduleId = String(formData.get("scheduleId") || "");
  const fromMilitaryId = String(formData.get("fromMilitaryId") || "");
  const toMilitaryId = String(formData.get("toMilitaryId") || "").trim() || null;
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!scheduleId || !fromMilitaryId) {
    throw new Error("Selecione a escala e o militar a ser trocado.");
  }

  const assignment = await prisma.scheduleAssignment.findFirst({
    where: { scheduleId, militaryId: fromMilitaryId },
    include: { military: true },
  });
  if (!assignment) throw new Error("Este militar não está escalado neste dia.");

  if (toMilitaryId) {
    if (toMilitaryId === fromMilitaryId) {
      throw new Error("O substituto sugerido deve ser diferente do militar atual.");
    }

    const toMilitary = await prisma.military.findUnique({ where: { id: toMilitaryId } });
    if (!toMilitary) throw new Error("Militar sugerido não encontrado.");
    if (!toMilitary.active) throw new Error("O militar sugerido está inativo.");
    if (toMilitary.type !== assignment.military.type) {
      throw new Error("O substituto sugerido deve ser do mesmo tipo (Atirador/Cabo de dia).");
    }

    const alreadyAssigned = await prisma.scheduleAssignment.findFirst({
      where: { scheduleId, militaryId: toMilitaryId },
    });
    if (alreadyAssigned) throw new Error("O militar sugerido já está escalado neste dia.");
  }

  const existingPending = await prisma.swapRequest.findFirst({
    where: { scheduleId, fromMilitaryId, status: "PENDENTE" },
  });
  if (existingPending) {
    throw new Error("Já existe uma solicitação pendente para este militar nesta data.");
  }

  await prisma.swapRequest.create({
    data: {
      scheduleId,
      fromMilitaryId,
      toMilitaryId,
      reason,
      requestedById: session.userId,
    },
  });

  revalidatePath("/solicitacoes");
}

// O próprio solicitante (ou um admin) pode cancelar um pedido ainda pendente.
export async function cancelSwapRequest(requestId: string) {
  const session = await requireUser();

  const request = await prisma.swapRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Solicitação não encontrada.");
  if (request.status !== "PENDENTE") {
    throw new Error("Apenas solicitações pendentes podem ser canceladas.");
  }
  if (request.requestedById !== session.userId && session.role !== "ADMIN") {
    throw new Error("Você não pode cancelar esta solicitação.");
  }

  await prisma.swapRequest.delete({ where: { id: requestId } });
  revalidatePath("/solicitacoes");
}

// Admin aprova a solicitação: efetiva a troca (reaproveitando as mesmas
// regras/validações de /escalas) e marca o pedido como aprovado.
export async function approveSwapRequest(requestId: string, toMilitaryId: string) {
  await requireAdmin();

  if (!toMilitaryId) throw new Error("Selecione quem vai substituir o militar.");

  const request = await prisma.swapRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Solicitação não encontrada.");
  if (request.status !== "PENDENTE") throw new Error("Esta solicitação já foi analisada.");

  await swapMilitary(request.scheduleId, request.fromMilitaryId, toMilitaryId);

  await prisma.swapRequest.update({
    where: { id: requestId },
    data: { status: "APROVADA", toMilitaryId },
  });

  revalidatePath("/solicitacoes");
}

export async function rejectSwapRequest(requestId: string) {
  await requireAdmin();

  const request = await prisma.swapRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Solicitação não encontrada.");
  if (request.status !== "PENDENTE") throw new Error("Esta solicitação já foi analisada.");

  await prisma.swapRequest.update({ where: { id: requestId }, data: { status: "REJEITADA" } });
  revalidatePath("/solicitacoes");
}

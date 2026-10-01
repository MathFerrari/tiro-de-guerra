"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

function readMilitaryForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const warName = String(formData.get("warName") || "").trim();
  const registration = String(formData.get("registration") || "").trim();
  const type = String(formData.get("type") || "");

  if (!name) throw new Error("O nome é obrigatório.");
  if (!registration) throw new Error("A matrícula é obrigatória.");

  if (type !== "ATIRADOR" && type !== "CB_DE_DIA") {
    throw new Error("Selecione o tipo (Atirador ou Cabo de Dia).");
  }

  return {
    name,
    warName: warName || name,
    registration,
    type: type as "ATIRADOR" | "CB_DE_DIA",
  };
}

export async function createMilitary(formData: FormData) {
  await requireAdmin();

  const data = readMilitaryForm(formData);

  const exists = await prisma.military.findUnique({
    where: { registration: data.registration },
  });

  if (exists) {
    throw new Error("Já existe um militar com essa matrícula.");
  }

  const words = data.name.trim().split(/\s+/);

  const passwordName =
    words[2]?.toLowerCase() ?? words.at(-1)!.toLowerCase();

  const plainPassword = `${passwordName}${data.registration}`;

  const password = await bcrypt.hash(plainPassword, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: `${data.registration}@tg02080.local`,
        password,
        role: "USER",
      },
    });

    await tx.military.create({
      data: {
        name: data.name,
        warName: data.warName,
        registration: data.registration,
        type: data.type,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  });

  revalidatePath("/militares");
  revalidatePath("/dashboard");
}

export async function updateMilitary(id: string, formData: FormData) {
  await requireAdmin();

  const data = readMilitaryForm(formData);

  const exists = await prisma.military.findFirst({
    where: { registration: data.registration, NOT: { id } },
  });
  if (exists) throw new Error("Já existe outro militar com essa matrícula.");

  await prisma.military.update({ where: { id }, data });
  revalidatePath("/militares");
  revalidatePath("/dashboard");
}

export async function toggleMilitaryActive(id: string) {
  await requireAdmin();

  const military = await prisma.military.findUnique({ where: { id } });
  if (!military) throw new Error("Militar não encontrado.");

  await prisma.military.update({ where: { id }, data: { active: !military.active } });
  revalidatePath("/militares");
  revalidatePath("/dashboard");
}

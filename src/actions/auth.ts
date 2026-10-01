"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";

export async function login(formData: FormData) {
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");

  if (!identifier || !password) {
    redirect("/login?error=" + encodeURIComponent("Usuário/e-mail e senha são obrigatórios."));
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { name: identifier }] },
  });

  if (!user) {
    redirect("/login?error=" + encodeURIComponent("Usuário ou senha inválidos."));
  }

  const valid = await bcrypt.compare(password, user!.password);
  if (!valid) {
    redirect("/login?error=" + encodeURIComponent("Usuário ou senha inválidos."));
  }

  await createSession({ userId: user!.id, name: user!.name, role: user!.role });
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MilitaresTable } from "./militares-table";
import { redirect } from "next/navigation";

export default async function MilitaresPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const session = await getSession();
  const { tipo } = await searchParams;


  if (session?.role !== "ADMIN") {
    redirect(session ? "/dashboard" : "/login");
  }

  const where =
    tipo === "ATIRADOR" || tipo === "CB_DE_DIA" ? { type: tipo as "ATIRADOR" | "CB_DE_DIA" } : {};

  const militares = await prisma.military.findMany({
    where,
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-military-green-dark">Militares</h1>
      </div>

      <MilitaresTable militares={militares} isAdmin={session?.role === "ADMIN"} filtroAtual={tipo} />
    </div>
  );
}

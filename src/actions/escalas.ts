"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseDateOnly, addDays } from "@/lib/utils";
import { MilitaryType } from "../../generated/prisma/client";

type MilitaryLite = {
  id: string;
  type: MilitaryType;
  registration: string;
};

/**
 * Ordena os militares pela matrícula em ordem numérica crescente.
 *
 * Exemplo:
 * 0
 * 1
 * 2
 * 10
 * 11
 * 20
 */
function sortMilitaries(militaries: MilitaryLite[]) {
  return [...militaries].sort(
    (a, b) =>
      Number(a.registration) - Number(b.registration)
  );
}

/**
 * Seleciona os próximos militares da sequência.
 *
 * Cada tipo possui sua própria sequência:
 *
 * MONITORES:
 * 0 → 1 → 2 → 3 → ... → 50 → 0
 *
 * ATIRADORES:
 * 0 → 1 → 2 → 3 → ... → 50 → 0
 *
 * O índice de cada tipo é controlado separadamente.
 */
function pickMilitaries(
  type: MilitaryType,
  count: number,
  index: number,
  militaries: MilitaryLite[]
) {
  const candidates = sortMilitaries(
    militaries.filter((m) => m.type === type).filter(m => m.registration !== "35" && m.registration !== '37')
  );

  if (candidates.length === 0) {
    return {
      selected: [],
      nextIndex: index,
    };
  }

  const selected: MilitaryLite[] = [];

  for (let i = 0; i < count; i++) {
    const position =
      (index + i) % candidates.length;

    selected.push(candidates[position]);
  }

  return {
    selected,
    nextIndex:
      (index + count) % candidates.length,
  };
}

/**
 * Gera as escalas para o período informado.
 *
 * Monitores e Atiradores possuem sequências independentes.
 *
 * Exemplo:
 *
 * Monitores:
 * 1, 4, 8, 12
 *
 * Atiradores:
 * 0, 2, 3, 5, 6, 7
 *
 * Com 2 monitores/dia e 3 atiradores/dia:
 *
 * Dia 1
 * Monitores: 1, 4
 * Atiradores: 0, 2, 3
 *
 * Dia 2
 * Monitores: 8, 12
 * Atiradores: 5, 6, 7
 *
 * Dia 3
 * Monitores: 1, 4
 * Atiradores: 0, 2, 3
 */
export async function generateSchedule(
  formData: FormData
) {
  await requireAdmin();

  const startDateStr = String(
    formData.get("startDate") || ""
  );

  const endDateStr = String(
    formData.get("endDate") || ""
  );

  const includeMonitores =
    formData.get("includeMonitores") === "on";

  const includeAtiradores =
    formData.get("includeAtiradores") === "on";

  const monitoresPerDay = Number(
    formData.get("monitoresPerDay") || 0
  );

  const atiradoresPerDay = Number(
    formData.get("atiradoresPerDay") || 0
  );

  /*
   * Validações
   */

  if (!startDateStr || !endDateStr) {
    throw new Error(
      "Informe a data inicial e a data final."
    );
  }

  if (!includeMonitores && !includeAtiradores) {
    throw new Error(
      "Selecione ao menos um tipo (Monitores e/ou Atiradores)."
    );
  }

  if (
    includeMonitores &&
    monitoresPerDay <= 0
  ) {
    throw new Error(
      "A quantidade de monitores por dia deve ser maior que zero."
    );
  }

  if (
    includeAtiradores &&
    atiradoresPerDay <= 0
  ) {
    throw new Error(
      "A quantidade de atiradores por dia deve ser maior que zero."
    );
  }

  const startDate =
    parseDateOnly(startDateStr);

  const endDate =
    parseDateOnly(endDateStr);

  if (endDate < startDate) {
    throw new Error(
      "A data final deve ser maior ou igual à data inicial."
    );
  }

  /*
   * Busca os militares ativos.
   *
   * A matrícula é utilizada somente para ordenar.
   */
  const militaries =
    await prisma.military.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        type: true,
        registration: true,
      },
    });

  /*
   * Separa os grupos.
   */
  const monitors = sortMilitaries(
    militaries.filter(
      (m) => m.type === "CB_DE_DIA"
    )
  );

  const atiradores = sortMilitaries(
    militaries.filter(
      (m) => m.type === "ATIRADOR"
    )
  );

  /*
   * Verifica se existem militares disponíveis.
   */
  if (
    includeMonitores &&
    monitors.length === 0
  ) {
    throw new Error(
      "Não há monitores ativos cadastrados."
    );
  }

  if (
    includeAtiradores &&
    atiradores.length === 0
  ) {
    throw new Error(
      "Não há atiradores ativos cadastrados."
    );
  }

  /*
   * Verifica se a quantidade solicitada
   * cabe no grupo.
   */
  if (
    includeMonitores &&
    monitoresPerDay > monitors.length
  ) {
    throw new Error(
      `A quantidade de monitores por dia (${monitoresPerDay}) não pode ser maior que a quantidade de monitores ativos (${monitors.length}).`
    );
  }

  if (
    includeAtiradores &&
    atiradoresPerDay > atiradores.length
  ) {
    throw new Error(
      `A quantidade de atiradores por dia (${atiradoresPerDay}) não pode ser maior que a quantidade de atiradores ativos (${atiradores.length}).`
    );
  }

  /*
   * Cada grupo possui seu próprio índice.
   *
   * Isso é importante porque a sequência
   * dos monitores não interfere na dos atiradores.
   */
  let monitorIndex = 0;
  let atiradorIndex = 0;

  let current = startDate;

  while (current <= endDate) {
    /*
     * Cria ou recupera a escala do dia.
     */
    const schedule =
      await prisma.schedule.upsert({
        where: {
          date: current,
        },
        update: {},
        create: {
          date: current,
        },
      });

    /*
     * =====================================================
     * MONITORES
     * =====================================================
     */

    if (includeMonitores) {
      const existingMonitors =
        await prisma.scheduleAssignment.findMany(
          {
            where: {
              scheduleId: schedule.id,
              military: {
                type: "CB_DE_DIA",
              },
            },
            include: {
              military: true,
            },
          }
        );

      /*
       * Se já existem monitores escalados
       * nesse dia, não sobrescreve.
       */
      if (existingMonitors.length === 0) {
        const result = pickMilitaries(
          "CB_DE_DIA",
          monitoresPerDay,
          monitorIndex,
          militaries
        );

        for (const military of result.selected) {
          await prisma.scheduleAssignment.create({
            data: {
              scheduleId: schedule.id,
              militaryId: military.id,
            },
          });
        }

        monitorIndex =
          result.nextIndex;
      } else {
        /*
         * Se já existe escala nesse dia,
         * avançamos a sequência pela quantidade
         * que deveria ser escalada.
         *
         * Isso evita que o próximo dia volte
         * para o mesmo militar.
         */
        monitorIndex =
          (monitorIndex + monitoresPerDay) %
          monitors.length;
      }
    }

    /*
     * =====================================================
     * ATIRADORES
     * =====================================================
     */

    if (includeAtiradores) {
      const existingAtiradores =
        await prisma.scheduleAssignment.findMany(
          {
            where: {
              scheduleId: schedule.id,
              military: {
                type: "ATIRADOR",
              },
            },
            include: {
              military: true,
            },
          }
        );

      /*
       * Se já existem atiradores escalados
       * nesse dia, não sobrescreve.
       */
      if (existingAtiradores.length === 0) {
        const result = pickMilitaries(
          "ATIRADOR",
          atiradoresPerDay,
          atiradorIndex,
          militaries
        );

        for (const military of result.selected) {
          await prisma.scheduleAssignment.create({
            data: {
              scheduleId: schedule.id,
              militaryId: military.id,
            },
          });
        }

        atiradorIndex =
          result.nextIndex;
      } else {
        /*
         * Avança a sequência mesmo quando
         * o dia já possui escala.
         */
        atiradorIndex =
          (atiradorIndex + atiradoresPerDay) %
          atiradores.length;
      }
    }

    current = addDays(current, 1);
  }

  /*
   * Atualiza as páginas que exibem as escalas.
   */
  revalidatePath("/escalas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
}

/**
 * Troca um militar escalado por outro.
 *
 * A troca só pode acontecer entre militares
 * do mesmo tipo.
 */
export async function swapMilitary(
  scheduleId: string,
  fromMilitaryId: string,
  toMilitaryId: string
) {
  await requireAdmin();

  if (
    !fromMilitaryId ||
    !toMilitaryId
  ) {
    throw new Error(
      "Selecione os militares para a troca."
    );
  }

  if (
    fromMilitaryId === toMilitaryId
  ) {
    throw new Error(
      "Selecione um militar diferente do atual."
    );
  }

  const assignment =
    await prisma.scheduleAssignment.findFirst({
      where: {
        scheduleId,
        militaryId: fromMilitaryId,
      },
      include: {
        military: true,
      },
    });

  if (!assignment) {
    throw new Error(
      "Este militar não está escalado neste dia."
    );
  }

  const toMilitary =
    await prisma.military.findUnique({
      where: {
        id: toMilitaryId,
      },
    });

  if (!toMilitary) {
    throw new Error(
      "Militar de destino não encontrado."
    );
  }

  if (!toMilitary.active) {
    throw new Error(
      "Não é possível escalar um militar inativo."
    );
  }

  if (
    toMilitary.type !==
    assignment.military.type
  ) {
    throw new Error(
      "A troca só pode ocorrer entre militares do mesmo tipo."
    );
  }

  const alreadyAssigned =
    await prisma.scheduleAssignment.findFirst({
      where: {
        scheduleId,
        militaryId: toMilitaryId,
      },
    });

  if (alreadyAssigned) {
    throw new Error(
      "Este militar já está escalado neste dia."
    );
  }

  await prisma.$transaction([
    prisma.scheduleAssignment.update({
      where: {
        id: assignment.id,
      },
      data: {
        militaryId: toMilitaryId,
      },
    }),

    prisma.swap.create({
      data: {
        scheduleId,
        fromMilitaryId,
        toMilitaryId,
      },
    }),
  ]);

  revalidatePath("/escalas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
}

/**
 * Edita a lista completa de militares
 * de um tipo em um determinado dia.
 */
export async function setScheduleMilitaries(
  scheduleId: string,
  type: MilitaryType,
  militaryIds: string[]
) {
  await requireAdmin();

  const unique = Array.from(
    new Set(militaryIds)
  );

  if (
    unique.length !== militaryIds.length
  ) {
    throw new Error(
      "Não é possível escalar o mesmo militar mais de uma vez."
    );
  }

  /*
   * Valida os militares enviados.
   */
  if (unique.length > 0) {
    const militaries =
      await prisma.military.findMany({
        where: {
          id: {
            in: unique,
          },
        },
      });

    if (
      militaries.length !== unique.length
    ) {
      throw new Error(
        "Militar inválido selecionado."
      );
    }

    for (const military of militaries) {
      if (!military.active) {
        throw new Error(
          `O militar ${military.name} está inativo.`
        );
      }

      if (military.type !== type) {
        throw new Error(
          `O militar ${military.name} não é do tipo selecionado.`
        );
      }
    }
  }

  /*
   * Busca as atribuições existentes.
   */
  const existing =
    await prisma.scheduleAssignment.findMany({
      where: {
        scheduleId,
      },
      include: {
        military: true,
      },
    });

  /*
   * Apenas os militares do tipo
   * que estamos editando.
   */
  const existingOfType =
    existing.filter(
      (assignment) =>
        assignment.military.type === type
    );

  /*
   * Identifica quem deve ser removido.
   */
  const toRemove =
    existingOfType.filter(
      (assignment) =>
        !unique.includes(
          assignment.militaryId
        )
    );

  /*
   * Identifica quem deve ser adicionado.
   */
  const toAddIds =
    unique.filter(
      (id) =>
        !existingOfType.some(
          (assignment) =>
            assignment.militaryId === id
        )
    );

  await prisma.$transaction([
    ...toRemove.map((assignment) =>
      prisma.scheduleAssignment.delete({
        where: {
          id: assignment.id,
        },
      })
    ),

    ...toAddIds.map((id) =>
      prisma.scheduleAssignment.create({
        data: {
          scheduleId,
          militaryId: id,
        },
      })
    ),
  ]);

  revalidatePath("/escalas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
}

/**
 * Exclui uma escala completa.
 */
export async function deleteSchedule(
  scheduleId: string
) {
  await requireAdmin();

  await prisma.schedule.delete({
    where: {
      id: scheduleId,
    },
  });

  revalidatePath("/escalas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
}
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  assignments: {
    id: string;
    militaryId: string;
    military: MilitaryLite;
  }[];
};

const COLORS = {
  black: [25, 25, 25] as [number, number, number],
  darkGray: [70, 70, 70] as [number, number, number],
  gray: [110, 110, 110] as [number, number, number],
  lightGray: [235, 235, 235] as [number, number, number],
  border: [150, 150, 150] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function parseDate(dateISO: string) {
  const [year, month, day] = dateISO.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(date);
}

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sortMilitaries<T extends { military: MilitaryLite }>(assignments: T[]) {
  return [...assignments].sort(
    (a, b) =>
      Number(a.military.registration) -
      Number(b.military.registration),
  );
}

function drawHeader(doc: jsPDF, startDate: string, endDate: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setTextColor(...COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("EXÉRCITO BRASILEIRO", pageWidth / 2, 13, {
    align: "center",
  });

  doc.setFontSize(11);
  doc.text("TIRO DE GUERRA 02-080", pageWidth / 2, 19, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("(ADAMANTINA - SP)", pageWidth / 2, 24, {
    align: "center",
  });

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.4);
  doc.line(12, 29, pageWidth - 12, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ESCALA DE SERVIÇO", pageWidth / 2, 37, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Período: ${formatDateShort(parseDate(startDate))} a ${formatDateShort(parseDate(endDate))}`,
    pageWidth / 2,
    43,
    { align: "center" },
  );

  doc.setFontSize(7.5);
  doc.text(
    "Para conhecimento deste Tiro de Guerra e devida execução, publico o seguinte:",
    pageWidth / 2,
    50,
    { align: "center" },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    "1ª PARTE - SERVIÇOS DIÁRIOS",
    pageWidth / 2,
    58,
    { align: "center" },
  );
}

function drawFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(12, pageHeight - 13, pageWidth - 12, pageHeight - 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);

  doc.text(
    "TIRO DE GUERRA 02-080 - Adamantina/SP",
    12,
    pageHeight - 7,
  );

  doc.text(
    `Página ${doc.getCurrentPageInfo().pageNumber}`,
    pageWidth - 12,
    pageHeight - 7,
    { align: "right" },
  );
}

function drawSchedule(
  doc: jsPDF,
  schedule: ScheduleData,
  startY: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const date = parseDate(schedule.dateISO);

  const monitores = sortMilitaries(
    schedule.assignments.filter(
      (a) => a.military.type === "CB_DE_DIA",
    ),
  );

  const atiradores = sortMilitaries(
    schedule.assignments.filter(
      (a) => a.military.type === "ATIRADOR",
    ),
  );

  doc.setTextColor(...COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text(
    `SERVIÇO DO DIA ${formatDateShort(date)}`,
    margin,
    startY,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.darkGray);

  doc.text(
    capitalize(formatDate(date)),
    margin,
    startY + 5,
  );

  const monitorText = monitores.length
    ? monitores
        .map(
          (m) =>
            `${m.military.registration} - ${m.military.warName}`,
        )
        .join("  |  ")
    : "-";

  const atiradorText = atiradores.length
    ? atiradores
        .map(
          (a) =>
            `${a.military.registration} - ${a.military.warName}`,
        )
        .join("  |  ")
    : "-";

  const rows = [
    ["MONITOR", monitorText],
    ["ATIRADOR", atiradorText],
  ];

  autoTable(doc, {
    startY: startY + 9,
    margin: {
      left: margin,
      right: margin,
    },

    tableWidth: contentWidth,

    theme: "grid",

    head: [["FUNÇÃO", "MILITARES"]],

    body: rows,

    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: COLORS.black,
      lineColor: COLORS.border,
      lineWidth: 0.25,
      cellPadding: {
        top: 3,
        bottom: 3,
        left: 3,
        right: 3,
      },
      valign: "middle",
      overflow: "linebreak",
    },

    headStyles: {
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 7.5,
      fillColor: COLORS.lightGray,
      textColor: COLORS.black,
      lineColor: COLORS.border,
      lineWidth: 0.3,
      halign: "center",
      valign: "middle",
    },

    bodyStyles: {
      halign: "left",
    },

    columnStyles: {
      0: {
        cellWidth: contentWidth * 0.22,
        fontStyle: "bold",
        halign: "center",
      },
      1: {
        cellWidth: contentWidth * 0.78,
      },
    },
  });

  const finalY =
    (doc as jsPDF & {
      lastAutoTable?: { finalY: number };
    }).lastAutoTable?.finalY ?? startY + 30;

  return finalY + 10;
}

export function generateEscalaPdf(
  schedules: ScheduleData[],
  startDate: string,
  endDate: string,
) {
  if (schedules.length === 0) {
    throw new Error(
      "Não existem escalas no período selecionado.",
    );
  }

  const sortedSchedules = [...schedules].sort(
    (a, b) =>
      parseDate(a.dateISO).getTime() -
      parseDate(b.dateISO).getTime(),
  );

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();

  const contentStart = 68;
  const bottomLimit = pageHeight - 20;

  drawHeader(doc, startDate, endDate);

  let currentY = contentStart;

  sortedSchedules.forEach((schedule, index) => {
    const estimatedHeight =
      24 +
      Math.max(
        schedule.assignments.filter(
          (a) => a.military.type === "CB_DE_DIA",
        ).length,
        schedule.assignments.filter(
          (a) => a.military.type === "ATIRADOR",
        ).length,
        1,
      ) *
        9;

    if (
      index > 0 &&
      currentY + estimatedHeight > bottomLimit
    ) {
      doc.addPage();
      drawHeader(doc, startDate, endDate);
      currentY = contentStart;
    }

    currentY = drawSchedule(
      doc,
      schedule,
      currentY,
    );
  });

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    drawFooter(doc);
  }

  const fileName =
    `escala-servico-${startDate}-${endDate}.pdf`;

  doc.save(fileName);
}
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type MilitaryLite = {
  id: string;
  name: string;
  warName: string;
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

function formatDatePdf(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(date);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generateEscalaPdf(
  schedules: ScheduleData[],
  startDate: string,
  endDate: string,
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  schedules.forEach((schedule, index) => {
    const date = new Date(schedule.dateISO);

    const monitores = schedule.assignments.filter(
      (a) => a.military.type === "CB_DE_DIA",
    );

    const atiradores = schedule.assignments.filter(
      (a) => a.military.type === "ATIRADOR",
    );

    /*
     * Cada página comporta aproximadamente 5 escalas.
     * O modelo enviado utiliza esse formato.
     */
    if (index > 0 && index % 5 === 0) {
      doc.addPage();
    }

    const position = index % 5;

    if (position === 0) {
      drawHeader(doc);
    }

    const startY = position === 0 ? 70 : 112 + (position - 1) * 35;

    const monitor = monitores[0]?.military.warName ?? "-";

    const atiradoresText =
      atiradores.length > 0
        ? atiradores.map((a) => a.military.warName).join(", ")
        : "-";

    const title = `Escala de serviço para o dia ${formatDatePdf(date)}`;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(title, pageWidth / 2, startY, {
      align: "center",
    });

    autoTable(doc, {
      startY: startY + 3,
      margin: {
        left: margin,
        right: margin,
      },
      tableWidth: contentWidth,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 10,
        textColor: [0, 0, 0],
        lineColor: [100, 100, 100],
        lineWidth: 0.25,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fontStyle: "bold",
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [100, 100, 100],
        lineWidth: 0.25,
      },
      columnStyles: {
        0: {
          cellWidth: contentWidth * 0.14,
        },
        1: {
          cellWidth: contentWidth * 0.28,
        },
        2: {
          cellWidth: contentWidth * 0.29,
        },
        3: {
          cellWidth: contentWidth * 0.29,
        },
      },
      head: [
        [
          "",
          "Comandante da Guarda",
          "Guardas",
          "Permanência",
        ],
      ],
      body: [
        [
          "SERVIÇO",
          `MONITOR: ${monitor}`,
          `ATIRADORES: ${atiradoresText}`,
          `ATIRADOR: ${monitor}`,
        ],
      ],
    });
  });

  /*
   * Rodapé em todas as páginas.
   */
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);

    doc.text(
      `Período: ${startDate} a ${endDate}`,
      margin,
      pageHeight - 8,
    );

    doc.text(
      `Página ${page} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      {
        align: "right",
      },
    );
  }

  const fileName = `escala-servico-${startDate}-${endDate}.pdf`;

  doc.save(fileName);
}

function drawHeader(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(10);

  doc.text("MINISTÉRIO DA DEFESA", pageWidth / 2, 18, {
    align: "center",
  });

  doc.text("EXÉRCITO BRASILEIRO", pageWidth / 2, 23, {
    align: "center",
  });

  doc.text("COMANDO MILITAR DO SUDESTE", pageWidth / 2, 28, {
    align: "center",
  });

  doc.text("2ª REGIÃO MILITAR", pageWidth / 2, 33, {
    align: "center",
  });

  doc.text("TIRO DE GUERRA 02-080 – (ADAMANTINA-SP)", pageWidth / 2, 38, {
    align: "center",
  });

  doc.setFontSize(11);

  doc.text("BOLETIM INTERNO Nº 24 - TG/2026", pageWidth / 2, 51, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "Para conhecimento deste Tiro de Guerra e devida execução, publico o seguinte:",
    pageWidth / 2,
    58,
    {
      align: "center",
    },
  );

  doc.setFont("helvetica", "bold");

  doc.text("1ª PARTE - SERVIÇOS DIÁRIOS", pageWidth / 2, 64, {
    align: "center",
  });
}
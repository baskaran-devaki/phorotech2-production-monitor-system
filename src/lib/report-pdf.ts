import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ALL_SHIFTS, SHIFTS, formatDMY, type ShiftNum } from "./production";
import type { ReportData } from "./report";
import logoUrl from "@/assets/phorotech-logo.jpeg";
const logoAsset = { url: logoUrl };

const GOLD: [number, number, number] = [176, 137, 34];
const DARK: [number, number, number] = [24, 24, 24];

function generatedTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")}-${value("month")}-${value("year")} ${value("hour")}:${value("minute")}`;
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(logoAsset.url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateReportPDF(
  report: ReportData,
  withHourly: boolean,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 36;
  const logo = await loadLogo();
  const generatedOn = generatedTime(new Date());

  const drawHeader = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 74, "F");
    if (logo) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, 12, 50, 50, 6, 6, "F");
      try {
        doc.addImage(logo, "JPEG", M + 4, 16, 42, 42);
      } catch {
        /* ignore */
      }
    }
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("PHOROTECH SURFIN INDIA PVT LTD", pageW / 2, 32, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Plant-II  |  ED Plant  |  Irungattukottai", pageW / 2, 50, { align: "center" });
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.line(0, 74, pageW, 74);
  };

  const drawFooter = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(M, pageH - 44, pageW - M, pageH - 44);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Time: ${generatedOn}`, pageW / 2, pageH - 24, { align: "center" });
  };

  // ---------- PAGE 1 ----------
  drawHeader();
  let y = 100;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("MONTHLY PRODUCTION REPORT", pageW / 2, y, { align: "center" });
  y += 8;
  doc.setDrawColor(...GOLD);
  doc.line(M, y, pageW - M, y);
  y += 18;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 170, fillColor: [248, 244, 230] },
      1: { halign: "left" },
    },
    body: [
      ["Reporting Period", report.periodLabel],
      ["Plant", "ED"],
      ["Total Working Days", String(report.totalWorkingDays)],
      ["Sundays Production Days", String(report.sundayWorkingDays)],
      ["Total Actual Loads", String(report.totalActual)],
      ["Total Target Loads", String(report.totalTarget)],
      ["Monthly Achievement %", `${report.achievement.toFixed(1)} %`],
    ],
    margin: { left: M, right: M },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  autoTable(doc, {
    startY: y,
    head: [["Shift Summary", "Total Loads"]],
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: [17, 17, 17], fontStyle: "bold", fontSize: 9.5 },
    styles: { fontSize: 9.5, cellPadding: 5 },
    columnStyles: { 0: { cellWidth: 170 } },
    body: [
      ["1st Shift Total Loads", String(report.shiftTotals[1])],
      ["2nd Shift Total Loads", String(report.shiftTotals[2])],
      ["3rd Shift Total Loads", String(report.shiftTotals[3])],
      ["Sunday Production Total Loads", String(report.sundayTotal)],
    ],
    margin: { left: M, right: M },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  autoTable(doc, {
    startY: y,
    head: [["Highest Production Day", ""]],
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: [17, 17, 17], fontStyle: "bold", fontSize: 9.5 },
    styles: { fontSize: 9.5, cellPadding: 5 },
    columnStyles: { 0: { cellWidth: 170 } },
    body: [
      ["Date", formatDMY(report.highest.date)],
      ["Total Loads", String(report.highest.loads)],
    ],
    margin: { left: M, right: M },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Production trend bar chart
  const chartH = 150;
  if (y + chartH > pageH - 60) {
    doc.addPage();
    drawHeader();
    y = 100;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Production Trend", M, y);
  y += 10;
  const cx = M;
  const cw = pageW - 2 * M;
  const baseY = y + chartH;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.5);
  doc.rect(cx, y, cw, chartH);
  const maxLoads = Math.max(1, ...report.trend.map((t) => t.loads));
  const n = Math.max(1, report.trend.length);
  const step = cw / n;
  const barW = Math.max(2, Math.min(step * 0.6, 18));
  // gridlines
  for (let i = 1; i <= 4; i++) {
    const gy = baseY - (chartH * i) / 4;
    doc.setDrawColor(232, 232, 232);
    doc.line(cx, gy, cx + cw, gy);
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(String(Math.round((maxLoads * i) / 4)), cx - 4, gy + 2, { align: "right" });
  }
  report.trend.forEach((t, i) => {
    const h = (t.loads / maxLoads) * (chartH - 8);
    const bx = cx + i * step + (step - barW) / 2;
    doc.setFillColor(...GOLD);
    doc.rect(bx, baseY - h, barW, h, "F");
    if (n <= 31) {
      doc.setFontSize(6);
      doc.setTextColor(110, 110, 110);
      doc.text(t.date.slice(8), bx + barW / 2, baseY + 9, { align: "center" });
    }
  });
  // ---------- DETAIL PAGES ----------
  const detailStart = () => {
    doc.addPage();
    drawHeader();
  };

  if (!withHourly) {
    detailStart();
    autoTable(doc, {
      startY: 92,
      head: [["Date", "Shift 1", "Shift 2", "Shift 3", "Daily Total", "Remarks"]],
      body: report.days.map((d) => [
        formatDMY(d.date),
        d.shiftTotals[1],
        d.shiftTotals[2],
        d.shiftTotals[3],
        d.total,
        d.remarks,
      ]),
      foot: [
        [
          "TOTAL",
          report.shiftTotals[1],
          report.shiftTotals[2],
          report.shiftTotals[3],
          report.totalActual,
          "",
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: [17, 17, 17], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 240], textColor: [17, 17, 17], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 4, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 72 },
        1: { cellWidth: 52, halign: "center" },
        2: { cellWidth: 52, halign: "center" },
        3: { cellWidth: 52, halign: "center" },
        4: { cellWidth: 62, halign: "center" },
        5: { cellWidth: "auto" },
      },
      margin: { left: M, right: M, top: 92, bottom: 56 },
      didDrawPage: () => drawHeader(),
    });
  } else {
    detailStart();
    const head = [
      ["Date", "Shift", ...SHIFTS[1].slots.map((_, i) => `H${i + 1}`), "Shift Total", "Daily Total"],
    ];
    const body: (string | number)[][] = [];
    for (const d of report.days) {
      ALL_SHIFTS.forEach((s: ShiftNum, idx) => {
        const h = d.hourly.find((x) => x.shift === s);
        if (!h) return;
        body.push([
          idx === 0 ? formatDMY(d.date) : "",
          SHIFTS[s].label,
          ...h.slots.map((sl) => sl.loads),
          h.shiftTotal,
          idx === 0 ? d.total : "",
        ]);
      });
    }
    autoTable(doc, {
      startY: 92,
      head,
      body,
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: [17, 17, 17], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2.5, halign: "center", overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 54, halign: "left" }, 1: { cellWidth: 40, halign: "left" } },
      margin: { left: M, right: M, top: 92, bottom: 56 },
      didDrawPage: () => drawHeader(),
    });
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter();
  }

  doc.save(`PPMS-Production-Report-${report.from}_to_${report.to}.pdf`);
}

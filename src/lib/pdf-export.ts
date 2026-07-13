import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { SHIFTS, ALL_SHIFTS, sumLoads, highestOfMonth, formatIndianDate, monthKey, monthName, type ProductionEntry, type ShiftNum } from "./production";

const COMPANY = [
  "PHOROTECH SURFIN INDIA PVT LTD",
  "PLANT - II  •  ED PLANT  •  IRUNGATTUKOTTAI",
];

export function downloadMonthlyPDF(entries: ProductionEntry[], mKey: string) {
  const monthEntries = entries.filter((e) => monthKey(e.entry_date) === mKey);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(11, 11, 11); doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text(COMPANY[0], pageW / 2, 34, { align: "center" });
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 215, 0);
  doc.text(COMPANY[1], pageW / 2, 54, { align: "center" });
  doc.setFontSize(13); doc.setTextColor(255, 255, 255);
  doc.text(`Monthly Production Report — ${monthName(new Date(mKey + "-01"))}`, pageW / 2, 76, { align: "center" });

  let y = 110;
  const total = sumLoads(monthEntries);
  const hi = highestOfMonth(entries, mKey);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(`Total Monthly Loads: ${total}`, 40, y); y += 18;
  doc.text(`Highest Production Day: ${formatIndianDate(hi.date)}  •  ${hi.shift ? SHIFTS[hi.shift].label : "—"}  •  ${hi.loads} loads (daily total ${hi.dailyTotal})`, 40, y);
  y += 20;

  // Shift-wise totals
  const shiftRows = ALL_SHIFTS.map((s) => {
    const es = monthEntries.filter((e) => e.shift === s);
    return [SHIFTS[s].label, SHIFTS[s].range, String(sumLoads(es))];
  });
  autoTable(doc, {
    startY: y,
    head: [["Shift", "Time Range", "Total Loads"]],
    body: shiftRows,
    theme: "grid",
    headStyles: { fillColor: [212, 175, 55], textColor: [11, 11, 11] },
    styles: { fontSize: 10 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Daily hourly breakdown
  const dates = Array.from(new Set(monthEntries.map((e) => e.entry_date))).sort();
  for (const date of dates) {
    if (y > 480) { doc.addPage(); y = 60; }
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
    doc.text(`${formatIndianDate(date)}  —  Total: ${sumLoads(monthEntries.filter((e) => e.entry_date === date))}`, 40, y);
    const rows: (string | number)[][] = [];
    for (const s of ALL_SHIFTS) {
      const shiftEntries = monthEntries.filter((e) => e.entry_date === date && e.shift === s);
      SHIFTS[s].slots.forEach((slot, idx) => {
        const entry = shiftEntries.find((e) => e.slot_index === idx);
        rows.push([SHIFTS[s].label, slot, entry?.load_count ?? 0, entry?.remarks ?? ""]);
      });
      rows.push([`${SHIFTS[s].label} Total`, "", sumLoads(shiftEntries), ""]);
    }
    autoTable(doc, {
      startY: y + 6,
      head: [["Shift", "Time Slot", "Loads", "Remarks"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55] },
      styles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(212, 175, 55); doc.line(40, h - 34, pageW - 40, h - 34);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, 40, h - 20);
    doc.text(`Page ${i} / ${pageCount}`, pageW - 40, h - 20, { align: "right" });
  }

  doc.save(`Phorotech-Production-${mKey}.pdf`);
}

export function downloadMonthlyExcel(entries: ProductionEntry[], mKey: string) {
  const monthEntries = entries.filter((e) => monthKey(e.entry_date) === mKey);
  const rows = monthEntries.map((e) => ({
    Date: e.entry_date,
    Shift: SHIFTS[e.shift as ShiftNum].label,
    "Time Slot": e.time_slot,
    Loads: e.load_count,
    Remarks: e.remarks ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Production");
  XLSX.writeFile(wb, `Phorotech-Production-${mKey}.xlsx`);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { downtimeMinutes, formatDuration, type DowntimeRecord } from "@/lib/downtime";
import logoUrl from "@/assets/phorotech-logo.jpeg";
const logoAsset = { url: logoUrl };

export async function exportDowntimePDF(records: DowntimeRecord[], period: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const image = await fetch(logoAsset.url).then((response) => response.blob()).then((blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
  })).catch(() => null);
  if (image) { try { doc.addImage(image, "JPEG", 36, 25, 46, 46); } catch { /* continue without logo */ } }
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(128, 97, 20);
  doc.text("PHOROTECH SURFIN INDIA PVT LTD", 100, 46);
  doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.text("DOWNTIME REPORT", 100, 64);
  doc.setFontSize(9); doc.text(`Period: ${period}  |  Incidents: ${records.length}  |  Total: ${formatDuration(records.reduce((sum, record) => sum + downtimeMinutes(record), 0))}`, 36, 96);
  autoTable(doc, {
    startY: 113, margin: { left: 36, right: 36, top: 36, bottom: 45 }, theme: "grid",
    head: [["Date", "Shift", "Machine / Process", "Category", "Reason", "Status", "Duration"]],
    body: records.map((record) => [record.business_date, String(record.shift), record.machine_process, record.reason_category, record.reason, record.status.replaceAll("_", " "), formatDuration(downtimeMinutes(record))]),
    headStyles: { fillColor: [176, 137, 34], textColor: [25, 25, 25] },
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
  });
  const pages = doc.getNumberOfPages();
  const timestamp = new Date().toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short", hour12: false }).replaceAll("/", "-").replace(",", "");
  for (let page = 1; page <= pages; page++) { doc.setPage(page); doc.setFontSize(8); doc.setTextColor(105, 105, 105); doc.text(`Generated Time: ${timestamp}  |  Page ${page} of ${pages}`, 297, 818, { align: "center" }); }
  doc.save("ppms-downtime-report.pdf");
}

export async function exportDowntimeExcel(records: DowntimeRecord[], period: string) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = "Phorotech PPMS";
  const sheet = workbook.addWorksheet("Downtime", { pageSetup: { orientation: "landscape", paperSize: 9 } });
  sheet.columns = [
    { header: "Business Date", key: "date", width: 16 }, { header: "Shift", key: "shift", width: 10 },
    { header: "Machine / Process", key: "machine", width: 28 }, { header: "Start", key: "start", width: 24 },
    { header: "End", key: "end", width: 24 }, { header: "Category", key: "category", width: 18 },
    { header: "Reason", key: "reason", width: 30 }, { header: "Description", key: "description", width: 36 },
    { header: "Action Taken", key: "action", width: 36 }, { header: "Parts / Material", key: "parts", width: 28 },
    { header: "Status", key: "status", width: 20 }, { header: "Duration (min)", key: "duration", width: 18 },
  ];
  sheet.insertRow(1, ["PHOROTECH SURFIN INDIA PVT LTD · DOWNTIME REPORT"]); sheet.mergeCells("A1:L1");
  sheet.getCell("A1").font = { bold: true, size: 15, color: { argb: "FF806114" } }; sheet.getRow(1).height = 27;
  sheet.insertRow(2, [`Reporting Period: ${period} · ${records.length} incidents`]); sheet.mergeCells("A2:L2");
  const header = sheet.getRow(3);
  header.eachCell((cell) => { cell.font = { bold: true, color: { argb: "FF151515" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB08922" } }; cell.border = { bottom: { style: "thin", color: { argb: "FF806114" } } }; });
  for (const record of records) sheet.addRow({ date: record.business_date, shift: record.shift, machine: record.machine_process, start: record.start_time, end: record.end_time ?? "", category: record.reason_category, reason: record.reason, description: record.description ?? "", action: record.action_taken ?? "", parts: record.parts_material_used ?? "", status: record.status, duration: downtimeMinutes(record) });
  sheet.autoFilter = { from: "A3", to: "L3" }; sheet.views = [{ state: "frozen", ySplit: 3 }];
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "ppms-downtime-report.xlsx"; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
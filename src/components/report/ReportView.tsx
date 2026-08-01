import { ALL_SHIFTS, SHIFTS, formatDMY } from "@/lib/production";
import type { ReportData } from "@/lib/report";
import logoAsset from "@/assets/phorotech-logo.jpg.asset.json";
import { Printer, X } from "lucide-react";

export function ReportView({
  report,
  withHourly,
  generatedBy,
  onClose,
}: {
  report: ReportData;
  withHourly: boolean;
  generatedBy: string;
  onClose: () => void;
}) {
  const maxLoads = Math.max(1, ...report.trend.map((t) => t.loads));
  const generatedOn = new Date().toLocaleString("en-IN");

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 overflow-auto print:bg-white print:static print:overflow-visible">
      <style>{`@media print { .no-print { display: none !important; } @page { size: A4 portrait; margin: 12mm; } .report-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; } }`}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#0b0b0b] border-b border-[color:var(--border)] px-4 py-3">
        <span className="text-sm font-bold text-white">Report Preview — {report.periodLabel}</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-gold rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm text-white inline-flex items-center gap-2"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] py-6 px-2 print:p-0 print:max-w-none">
        {/* PAGE 1 */}
        <section className="report-page bg-white text-black rounded-lg shadow-xl p-8 mb-6">
          <Header />
          <h2 className="mt-5 text-center text-lg font-extrabold tracking-wide">
            MONTHLY PRODUCTION REPORT
          </h2>
          <div className="mt-1 h-px bg-[#b08922]" />

          <table className="w-full mt-4 text-sm border-collapse">
            <tbody>
              {[
                ["Reporting Period", report.periodLabel],
                ["Plant", "ED"],
                ["Total Working Days", String(report.totalWorkingDays)],
                ["Sundays Production Days", String(report.sundayWorkingDays)],
                ["Total Actual Loads", String(report.totalActual)],
                ["Total Target Loads", String(report.totalTarget)],
                ["Monthly Achievement %", `${report.achievement.toFixed(1)} %`],
              ].map(([k, v]) => (
                <tr key={k}>
                  <th className="border border-gray-300 bg-[#f8f4e6] text-left px-3 py-1.5 w-[45%] font-bold">
                    {k}
                  </th>
                  <td className="border border-gray-300 px-3 py-1.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Block
            title="Shift Summary"
            rows={[
              ["1st Shift Total Loads", report.shiftTotals[1]],
              ["2nd Shift Total Loads", report.shiftTotals[2]],
              ["3rd Shift Total Loads", report.shiftTotals[3]],
              ["Sunday Production Total Loads", report.sundayTotal],
            ]}
          />
          <Block
            title="Highest Production Day"
            rows={[
              ["Date", formatDMY(report.highest.date)],
              ["Total Loads", report.highest.loads],
            ]}
          />

          <h3 className="mt-5 text-sm font-extrabold">Production Trend</h3>
          <div className="mt-2 border border-gray-300 p-2">
            <div className="flex items-end gap-[2px] h-40">
              {report.trend.length === 0 && (
                <span className="text-xs text-gray-500">No production data for this period.</span>
              )}
              {report.trend.map((t) => (
                <div key={t.date} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-[#b08922]"
                    style={{ height: `${(t.loads / maxLoads) * 100}%` }}
                    title={`${formatDMY(t.date)} · ${t.loads}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-[2px] mt-1">
              {report.trend.map((t) => (
                <div key={t.date} className="flex-1 text-center text-[7px] text-gray-500">
                  {t.date.slice(8)}
                </div>
              ))}
            </div>
          </div>

          <Footer generatedOn={generatedOn} generatedBy={generatedBy} page={1} />
        </section>

        {/* DETAIL PAGE */}
        <section className="report-page bg-white text-black rounded-lg shadow-xl p-8 mb-6">
          <Header />
          {!withHourly ? (
            <table className="w-full mt-4 text-[11px] border-collapse">
              <thead>
                <tr>
                  {["Date", "Shift 1", "Shift 2", "Shift 3", "Daily Total", "Remarks"].map((h) => (
                    <th key={h} className="border border-gray-300 bg-[#b08922] text-black px-2 py-1.5 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.days.map((d) => (
                  <tr key={d.date}>
                    <td className="border border-gray-300 px-2 py-1">{formatDMY(d.date)}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{d.shiftTotals[1]}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{d.shiftTotals[2]}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{d.shiftTotals[3]}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-bold">{d.total}</td>
                    <td className="border border-gray-300 px-2 py-1">{d.remarks}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-2 py-1">TOTAL</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{report.shiftTotals[1]}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{report.shiftTotals[2]}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{report.shiftTotals[3]}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{report.totalActual}</td>
                  <td className="border border-gray-300 px-2 py-1" />
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full mt-4 text-[8px] border-collapse">
              <thead>
                <tr>
                  {["Date", "Shift", ...SHIFTS[1].slots.map((_, i) => `H${i + 1}`), "Shift Total", "Daily Total"].map(
                    (h) => (
                      <th key={h} className="border border-gray-300 bg-[#b08922] text-black px-1 py-1 font-bold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {report.days.flatMap((d) =>
                  ALL_SHIFTS.map((s, idx) => {
                    const h = d.hourly.find((x) => x.shift === s)!;
                    return (
                      <tr key={`${d.date}-${s}`}>
                        <td className="border border-gray-300 px-1 py-0.5">{idx === 0 ? formatDMY(d.date) : ""}</td>
                        <td className="border border-gray-300 px-1 py-0.5">{SHIFTS[s].label}</td>
                        {h.slots.map((sl) => (
                          <td key={sl.slot} className="border border-gray-300 px-1 py-0.5 text-center">
                            {sl.loads}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-1 py-0.5 text-center font-bold">{h.shiftTotal}</td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center font-bold">
                          {idx === 0 ? d.total : ""}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          )}
          <Footer generatedOn={generatedOn} generatedBy={generatedBy} page={2} />
        </section>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3 border-b-2 border-[#b08922] pb-3">
      <img src={logoAsset.url} alt="Phorotech Surfin India logo" className="h-12 w-12 object-contain" />
      <div className="flex-1 text-center">
        <div className="text-base font-extrabold tracking-wide text-[#7a5c00]">
          PHOROTECH SURFIN INDIA PVT LTD
        </div>
        <div className="text-[11px] tracking-widest text-gray-700">
          Plant-II | ED Plant | Irungattukottai
        </div>
      </div>
      <div className="h-12 w-12" />
    </div>
  );
}

function Block({ title, rows }: { title: string; rows: Array<[string, string | number]> }) {
  return (
    <table className="w-full mt-4 text-sm border-collapse">
      <thead>
        <tr>
          <th colSpan={2} className="border border-gray-300 bg-[#b08922] text-black text-left px-3 py-1.5 font-bold">
            {title}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="border border-gray-300 px-3 py-1.5 w-[45%]">{k}</td>
            <td className="border border-gray-300 px-3 py-1.5 font-bold">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Footer({
  generatedOn,
  generatedBy,
  page,
}: {
  generatedOn: string;
  generatedBy: string;
  page: number;
}) {
  return (
    <div className="mt-6 pt-2 border-t border-gray-300 flex flex-wrap justify-between gap-2 text-[9px] text-gray-600">
      <span>Generated On: {generatedOn}</span>
      <span>Generated By: {generatedBy}</span>
      <span>PPMS - Production Performance Monitoring System</span>
      <span>Page {page}</span>
    </div>
  );
}

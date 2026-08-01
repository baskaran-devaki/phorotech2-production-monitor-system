import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Eye, FileSpreadsheet, Loader2 } from "lucide-react";
import type { ProductionEntry } from "@/lib/production";
import { currentMonthKey, monthNameFromKey } from "@/lib/production";
import { buildReport, monthOptions, monthRange } from "@/lib/report";
import { generateReportPDF } from "@/lib/report-pdf";
import { generateReportExcel } from "@/lib/report-excel";
import { ReportView } from "./ReportView";

export function ReportDialog({
  open,
  onOpenChange,
  entries,
  generatedBy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entries: ProductionEntry[];
  generatedBy: string;
}) {
  const [withHourly, setWithHourly] = useState<"with" | "without">("without");
  const [periodMode, setPeriodMode] = useState<"month" | "range">("month");
  const [month, setMonth] = useState(currentMonthKey());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<null | "pdf" | "excel">(null);
  const [viewing, setViewing] = useState(false);

  const months = useMemo(() => monthOptions(), []);

  function resolvePeriod() {
    if (periodMode === "month") {
      const r = monthRange(month);
      return { ...r, label: monthNameFromKey(month) };
    }
    if (!from || !to) {
      toast.error("Select both From and To dates");
      return null;
    }
    if (from > to) {
      toast.error("From date must be before To date");
      return null;
    }
    return { from, to, label: `${from} to ${to}` };
  }

  const report = useMemo(() => {
    const p = periodMode === "month" ? { ...monthRange(month), label: monthNameFromKey(month) } : from && to ? { from, to, label: `${from} to ${to}` } : null;
    if (!p) return null;
    return buildReport(entries, p.from, p.to, p.label);
  }, [entries, periodMode, month, from, to]);

  async function handlePdf() {
    const p = resolvePeriod();
    if (!p) return;
    setBusy("pdf");
    try {
      await generateReportPDF(
        buildReport(entries, p.from, p.to, p.label),
        withHourly === "with",
        generatedBy,
      );
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF");
    } finally {
      setBusy(null);
    }
  }

  async function handleExcel() {
    const p = resolvePeriod();
    if (!p) return;
    setBusy("excel");
    try {
      await generateReportExcel(
        buildReport(entries, p.from, p.to, p.label),
        withHourly === "with",
        generatedBy,
      );
      toast.success("Excel downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate Excel");
    } finally {
      setBusy(null);
    }
  }

  function handleView() {
    const p = resolvePeriod();
    if (!p) return;
    setViewing(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Monthly Report
            </DialogTitle>
            <DialogDescription>
              Choose the report type and period, then view or download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-[color:var(--cyan)]">
                Step 1 · Report Type
              </Label>
              <RadioGroup
                value={withHourly}
                onValueChange={(v) => setWithHourly(v as "with" | "without")}
                className="grid gap-2"
              >
                <label className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] px-3 py-2 cursor-pointer">
                  <RadioGroupItem value="with" id="rt-with" />
                  <span className="text-sm">With Hourly Production</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] px-3 py-2 cursor-pointer">
                  <RadioGroupItem value="without" id="rt-without" />
                  <span className="text-sm">Without Hourly Production</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-[color:var(--cyan)]">
                Step 2 · Report Period
              </Label>
              <RadioGroup
                value={periodMode}
                onValueChange={(v) => setPeriodMode(v as "month" | "range")}
                className="grid gap-2"
              >
                <div className="rounded-xl border border-[color:var(--border)] px-3 py-2 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="month" id="pm-month" />
                    <span className="text-sm">Select Month</span>
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    disabled={periodMode !== "month"}
                    className="w-full rounded-lg bg-transparent border border-[color:var(--border)] px-3 py-2 text-sm disabled:opacity-40"
                  >
                    {months.map((m) => (
                      <option key={m.key} value={m.key} className="text-black">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] px-3 py-2 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="range" id="pm-range" />
                    <span className="text-sm">Date Range</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest opacity-60">From</span>
                      <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        disabled={periodMode !== "range"}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest opacity-60">To</span>
                      <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        disabled={periodMode !== "range"}
                      />
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleView}
                className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm inline-flex items-center justify-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition"
              >
                <Eye className="h-4 w-4" /> View Report
              </button>
              <button
                onClick={handleExcel}
                disabled={busy !== null}
                className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm inline-flex items-center justify-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition disabled:opacity-50"
              >
                {busy === "excel" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}{" "}
                Excel Download
              </button>
              <button
                onClick={handlePdf}
                disabled={busy !== null}
                className="btn-gold rounded-xl px-3 py-2 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}{" "}
                PDF Download
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {viewing && report && (
        <ReportView
          report={report}
          withHourly={withHourly === "with"}
          generatedBy={generatedBy}
          onClose={() => setViewing(false)}
        />
      )}
    </>
  );
}

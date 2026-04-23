import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Share2, Play, Printer, Copy } from "lucide-react";
import jsPDF from "jspdf";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, RiskBadge, MetricStatusChip } from "@/components/common/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useReports, useProject } from "@/data/projectStore";

const ReportView = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const reports = useReports();
  const report = reports.find((r) => r.id === id);
  const project = useProject(report?.projectId ?? "");
  const [shareOpen, setShareOpen] = useState(false);

  if (!report || !project || !project.results) {
    return (
      <AppShell>
        <div className="p-10 text-center text-muted-foreground">Report not found.</div>
      </AppShell>
    );
  }

  const risks = project.results
    .flatMap((r) => r.metrics.map((m) => ({ ...m, dim: r.label })))
    .filter((m) => m.status !== "pass")
    .slice(0, 5);

  function exportPdf() {
    if (!report || !project || !project.results) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    let y = margin;

    const ensureSpace = (need: number) => {
      if (y + need > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };
    const writeLine = (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
      const size = opts?.size ?? 10;
      doc.setFontSize(size);
      doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      const [r, g, b] = opts?.color ?? [30, 30, 30];
      doc.setTextColor(r, g, b);
      const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2);
      wrapped.forEach((line: string) => {
        ensureSpace(size + 4);
        doc.text(line, margin, y);
        y += size + 4;
      });
    };
    const heading = (text: string) => {
      ensureSpace(28);
      y += 6;
      writeLine(text, { size: 14, bold: true, color: [20, 30, 60] });
      doc.setDrawColor(220, 224, 232);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
      y += 4;
    };

    // Title block
    writeLine("AI Assurance Report", { size: 20, bold: true, color: [15, 23, 42] });
    writeLine(report.title, { size: 12, color: [80, 90, 110] });
    writeLine(`Generated: ${report.createdAt}`, { size: 9, color: [120, 120, 120] });
    y += 6;

    heading("Executive Summary");
    writeLine(`Status: ${report.status}   Risk: ${project.riskLevel}   Score: ${project.overallScore}/100`);
    writeLine(report.summary);

    heading("Project Details");
    writeLine(`Name: ${project.name}`);
    writeLine(`Use case: ${project.useCase}`);
    writeLine(`Owner: ${project.owner}`);
    writeLine(`Environment: ${project.environment}`);
    writeLine(`Mode: AI Workflow Mode`);
    writeLine(`Last run: ${project.lastRun}`);

    heading("Workflow Overview");
    project.workflow.forEach((s, i) => {
      writeLine(`${i + 1}. ${s.name}  —  ${s.type}${s.modelOrService ? `  (${s.provider ?? ""} · ${s.modelOrService})` : ""}`);
    });

    heading("Results Summary");
    project.results.forEach((r) => {
      writeLine(`${r.label}: ${r.score}/100  [${r.status.toUpperCase()}]`, { bold: true });
    });

    heading("Key Risks");
    if (risks.length === 0) {
      writeLine("No significant risks detected.");
    } else {
      risks.forEach((r) => {
        writeLine(`• ${r.dim} — ${r.name} [${r.status.toUpperCase()}]`, { bold: true });
        writeLine(r.explanation, { color: [90, 90, 100] });
      });
    }

    heading("Recommendations & Next Actions");
    [
      "Strengthen guardrail prompts and expand red-team coverage.",
      "Refresh retrieval index to address grounding warnings.",
      "Update reference dataset to capture new input distribution.",
      "Monitor next two runs and compare against current baseline.",
    ].forEach((line) => writeLine(`• ${line}`));

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`AI Assurance Buddy · Page ${i} of ${pageCount}`, margin, pageHeight - 20);
    }

    const safeName = report.title.replace(/[^a-z0-9]+/gi, "_").slice(0, 60);
    doc.save(`${safeName}.pdf`);
    toast.success("PDF exported", { description: `${safeName}.pdf downloaded.` });
  }

  return (
    <AppShell>
      <PageHeader
        title={report.title}
        description={`Generated ${report.createdAt}`}
        crumbs={[{ label: "Reports", to: "/reports" }, { label: report.title }]}
        actions={
          <>
            <Button variant="outline" className="gap-2 no-print" onClick={() => { window.print(); }}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="outline" className="gap-2 no-print" onClick={exportPdf}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" className="gap-2 no-print" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> Share Report
            </Button>
            <Button className="gap-2 no-print" onClick={() => navigate(`/projects/${project.id}/run`)}>
              <Play className="h-4 w-4" /> Re-run
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-8">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Executive summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={report.status} />
              <RiskBadge level={project.riskLevel} />
              <Badge variant="outline" className="rounded-full">Score {project.overallScore}/100</Badge>
            </div>
            <p className="text-muted-foreground">{report.summary}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Project details</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Field k="Name" v={project.name} />
            <Field k="Use case" v={project.useCase} />
            <Field k="Owner" v={project.owner} />
            <Field k="Environment" v={project.environment} />
            <Field k="Mode" v="AI Workflow Mode" />
            <Field k="Last run" v={project.lastRun} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Workflow overview</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {project.workflow.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{i + 1}.</span>
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">— {s.type}</span>
                {s.modelOrService && (
                  <span className="text-xs text-muted-foreground">· {s.provider ?? ""} · {s.modelOrService}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Results summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {project.results.map((r) => (
              <div key={r.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">{r.label}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">{r.score}/100</span>
                  <MetricStatusChip status={r.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Key risks</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {risks.length === 0 && <p className="text-muted-foreground">No significant risks detected.</p>}
            {risks.map((r, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.dim} · {r.name}</div>
                  <MetricStatusChip status={r.status} />
                </div>
                <p className="mt-1 text-muted-foreground">{r.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Recommendations & next actions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Strengthen guardrail prompts and expand red-team coverage.</li>
              <li>Refresh retrieval index to address grounding warnings.</li>
              <li>Update reference dataset to capture new input distribution.</li>
              <li>Monitor next two runs and compare against current baseline.</li>
            </ul>
            <div className="flex gap-2 pt-3 no-print">
              <Button variant="outline" asChild><Link to={`/projects/${project.id}/results`}>View detailed results</Link></Button>
              <Button onClick={() => navigate(`/projects/${project.id}/run`)}>Schedule re-run</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share report</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Anyone with this link can view the report (mocked).</p>
          <div className="flex gap-2">
            <Input readOnly value={`https://assurance.wphdigital.com/r/${report.id}`} />
            <Button variant="outline" className="gap-1" onClick={() => { navigator.clipboard?.writeText(`https://assurance.wphdigital.com/r/${report.id}`); toast.success("Link copied"); }}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

export default ReportView;

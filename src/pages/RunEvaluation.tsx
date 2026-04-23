import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, X, Minimize2, Eye, Circle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { RUN_PHASES } from "@/data/mock";
import { useProject, recordRunForProject } from "@/data/projectStore";
import { toast } from "sonner";

type PhaseStatus = "pending" | "running" | "done";

const RunEvaluation = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const project = useProject(id);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<{ ts: string; msg: string }[]>([]);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    let i = 0;
    pushLog("Run started for " + (project?.name ?? "project"));
    const tick = () => {
      if (cancelled.current) return;
      if (i >= RUN_PHASES.length) {
        setDone(true);
        recordRunForProject(id);
        pushLog("Run completed successfully. Generating report…");
        setTimeout(() => {
          if (!cancelled.current) navigate(`/projects/${id}/results`);
        }, 1200);
        return;
      }
      pushLog(`▸ ${RUN_PHASES[i]}`);
      setPhaseIdx(i);
      const detailLogs = phaseDetails(RUN_PHASES[i]);
      detailLogs.forEach((d, k) => setTimeout(() => !cancelled.current && pushLog("  " + d), 350 * (k + 1)));
      setTimeout(() => {
        if (cancelled.current) return;
        pushLog(`✓ ${RUN_PHASES[i]} complete`);
        i++;
        setPhaseIdx(i);
        tick();
      }, 1700 + Math.random() * 600);
    };
    tick();
    return () => { cancelled.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushLog(msg: string) {
    const ts = new Date().toISOString().slice(11, 19);
    setLogs((l) => [...l, { ts, msg }]);
  }

  function cancelRun() {
    cancelled.current = true;
    toast.message("Run cancelled");
    navigate(`/projects/${id}`);
  }

  const progress = done ? 100 : Math.round((phaseIdx / RUN_PHASES.length) * 100);

  return (
    <AppShell>
      <PageHeader
        title="Run Evaluation"
        description={`Mock run in progress for ${project?.name ?? "project"}`}
        crumbs={[
          { label: "Projects", to: "/projects" },
          { label: project?.name ?? "Project", to: `/projects/${id}` },
          { label: "Run" },
        ]}
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/projects/${id}`)}>
              <Minimize2 className="h-4 w-4" /> Minimize
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/projects/${id}/results`)}>
              <Eye className="h-4 w-4" /> View Details
            </Button>
            <Button variant="outline" className="gap-2 text-danger hover:text-danger" onClick={cancelRun}>
              <X className="h-4 w-4" /> Cancel Run
            </Button>
          </>
        }
      />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{done ? "Completed" : RUN_PHASES[Math.min(phaseIdx, RUN_PHASES.length - 1)]}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Phases</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {RUN_PHASES.map((p, i) => {
                const status: PhaseStatus = i < phaseIdx ? "done" : i === phaseIdx && !done ? "running" : done ? "done" : "pending";
                return (
                  <div
                    key={p}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                      status === "done" && "border-success/20 bg-success-soft text-success",
                      status === "running" && "border-info/20 bg-info-soft text-info",
                      status === "pending" && "border-border text-muted-foreground",
                    )}
                  >
                    {status === "done" ? <CheckCircle2 className="h-4 w-4" /> :
                     status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                     <Circle className="h-4 w-4" />}
                    <span className="flex-1">{p}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm lg:col-span-3">
            <CardHeader><CardTitle className="text-base">Run log</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[420px] overflow-y-auto rounded-xl border bg-muted/30 p-3 font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-3 py-0.5">
                    <span className="text-muted-foreground">{l.ts}</span>
                    <span>{l.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

function phaseDetails(phase: string): string[] {
  const map: Record<string, string[]> = {
    "Validating configuration": ["checking workflow integrity", "verifying model endpoints"],
    "Preparing datasets": ["loading prompt set (1240 rows)", "shuffling eval splits"],
    "Running safety checks": ["GARAK probes (mock)…", "evaluating jailbreak resistance"],
    "Running quality checks": ["HELM benchmark (mock)…", "computing exact match"],
    "Running grounding checks": ["DeepEval faithfulness (mock)…", "scoring contextual recall"],
    "Running workflow checks": ["computing step success rate", "tracking retries & fallbacks"],
    "Running drift checks": ["comparing reference vs current", "scoring retrieval drift"],
    "Aggregating results": ["weighting dimension scores", "computing system health score"],
    "Generating report": ["rendering executive summary", "saving to Reports"],
  };
  return map[phase] ?? [];
}

export default RunEvaluation;

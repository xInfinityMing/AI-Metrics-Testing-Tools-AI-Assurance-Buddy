import { Activity, AlertTriangle, TrendingDown, ShieldCheck, Database } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { DRIFT_ALERTS, DIMENSION_GROUPS, type DriftAlert, type Project, type DataSource } from "@/data/mock";
import { useProjects } from "@/data/projectStore";
import { cn } from "@/lib/utils";

const sevTone = {
  Low: "bg-success-soft text-success border-success/20",
  Medium: "bg-warning-soft text-warning border-warning/20",
  High: "bg-danger-soft text-danger border-danger/20",
} as const;

// Drift monitoring is enabled when the project selected ANY drift dimension
// during the Test Dimensions step of the wizard (not by adding a workflow node).
function isMonitored(p: Project): boolean {
  return p.selectedDimensions?.some((k) => k.startsWith("drift.")) ?? false;
}

// Data sources required by Evidently AI to compute drift.
const DRIFT_REQUIRED_SOURCES: DataSource["type"][] = ["Reference Dataset", "Current Dataset"];

// Returns the drift metric labels the project actually selected.
function selectedDriftMetrics(p: Project): string[] {
  const driftGroup = DIMENSION_GROUPS.find((g) => g.key === "drift");
  if (!driftGroup) return [];
  return driftGroup.metrics
    .filter((m) => p.selectedDimensions.includes(`drift.${m.id}`))
    .map((m) => m.label);
}

// Check which required drift data sources are missing for this project.
function missingDriftSources(p: Project): DataSource["type"][] {
  return DRIFT_REQUIRED_SOURCES.filter(
    (t) => !p.dataSources?.find((d) => d.type === t && d.status === "Uploaded"),
  );
}

// Derive a sensible drift alert for a monitored project that doesn't have a
// seeded alert yet, so newly created projects show up immediately.
function syntheticAlert(p: Project): DriftAlert {
  const metrics = selectedDriftMetrics(p);
  const missing = missingDriftSources(p);

  const severity: DriftAlert["severity"] =
    missing.length > 0 ? "Medium" : p.riskLevel === "High" ? "High" : p.riskLevel === "Medium" ? "Medium" : "Low";

  return {
    id: `auto-${p.id}`,
    projectId: p.id,
    projectName: p.name,
    title:
      missing.length > 0
        ? `Drift baseline incomplete for ${p.name}`
        : `Drift watch active on ${p.name}`,
    severity,
    detectedAt: p.lastRun && p.lastRun !== "—" ? p.lastRun : "Awaiting first run",
    affectedFeatures: metrics.length > 0 ? metrics : ["Input drift (PSI)", "Output drift (KS test)"],
    recommendation:
      missing.length > 0
        ? `Upload ${missing.join(" and ")} so Evidently AI can compute drift against a baseline.`
        : p.runs.length === 0
        ? "Run a mock evaluation to establish a baseline distribution from the Reference Dataset."
        : "Compare next run against current baseline; promote a new baseline if quality holds.",
  };
}

const Monitoring = () => {
  const projects = useProjects();

  // Build the dynamic list of monitored projects + their alerts.
  const monitoredProjects = projects.filter(isMonitored);

  const allAlerts: DriftAlert[] = monitoredProjects.flatMap((p) => {
    const seeded = DRIFT_ALERTS.filter((a) => a.projectId === p.id);
    return seeded.length > 0 ? seeded : [syntheticAlert(p)];
  });

  const highSeverityCount = allAlerts.filter((a) => a.severity === "High").length;
  const projectsMissingSources = monitoredProjects.filter((p) => missingDriftSources(p).length > 0).length;

  return (
    <AppShell>
      <PageHeader
        title="Monitoring & Drift"
        description="Drift monitoring is enabled per project via the Drift / Monitoring test dimension."
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Monitoring" }]}
      />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Projects monitored" value={monitoredProjects.length} icon={Activity} tone="primary" />
          <StatCard label="Active alerts" value={allAlerts.length} icon={AlertTriangle} tone="warning" />
          <StatCard label="High severity" value={highSeverityCount} icon={TrendingDown} tone="danger" />
          <StatCard
            label="Drift status"
            value={highSeverityCount > 0 ? "Elevated" : monitoredProjects.length > 0 ? "Stable" : "Idle"}
            tone={highSeverityCount > 0 ? "warning" : "primary"}
            hint={`${monitoredProjects.length} system${monitoredProjects.length === 1 ? "" : "s"} tracked`}
          />
        </div>

        {projectsMissingSources > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            <Database className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-medium">
                {projectsMissingSources} project{projectsMissingSources === 1 ? "" : "s"} missing drift data sources
              </div>
              <div className="text-xs">
                Drift monitoring requires both a <span className="font-medium">Reference Dataset</span> (baseline) and a{" "}
                <span className="font-medium">Current Dataset</span> (production traffic) to compute PSI, KS-test and Wasserstein distance.
              </div>
            </div>
          </div>
        )}

        {/* Project-specific drift sections */}
        <div className="space-y-4">
          {monitoredProjects.length === 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No projects are currently being monitored for drift. Enable the{" "}
                <span className="font-medium text-foreground">Drift / Monitoring</span> dimension in a
                project's <span className="font-medium text-foreground">Test Dimensions</span> step to start tracking
                drift here.
              </CardContent>
            </Card>
          )}

          {monitoredProjects.map((project) => {
            const seeded = DRIFT_ALERTS.filter((a) => a.projectId === project.id);
            const alerts = seeded.length > 0 ? seeded : [syntheticAlert(project)];
            const highest = alerts.reduce<("Low" | "Medium" | "High")>((acc, a) => {
              const order = { Low: 0, Medium: 1, High: 2 } as const;
              return order[a.severity] > order[acc] ? a.severity : acc;
            }, "Low");

            const driftMetrics = selectedDriftMetrics(project);
            const missing = missingDriftSources(project);

            return (
              <Card key={project.id} className="rounded-2xl shadow-sm">
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Monitoring this project
                        </span>
                      </div>
                      <CardTitle className="mt-1 text-lg">{project.name}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {project.useCase ?? project.description} · {project.environment}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Drift engine: <span className="font-medium text-foreground">Evidently AI (future integration)</span>
                      </p>
                      {driftMetrics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {driftMetrics.map((m) => (
                            <span
                              key={m}
                              className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="outline" className={cn("rounded-full", sevTone[highest])}>
                        {highest} severity
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Baseline: {project.runs.length > 0 ? "latest passing run" : "not set"} · {alerts.length} active {alerts.length === 1 ? "alert" : "alerts"}
                      </span>
                    </div>
                  </div>

                  {missing.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-2.5 text-xs text-warning">
                      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <span className="font-medium">Missing data sources:</span> {missing.join(", ")}.
                        Upload these to compute drift metrics against a baseline.
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium">{a.title}</h4>
                            <Badge variant="outline" className={cn("rounded-full", sevTone[a.severity])}>
                              {a.severity}
                            </Badge>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Detected {a.detectedAt}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {a.affectedFeatures.map((f) => (
                              <span
                                key={f}
                                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Recommendation:</span> {a.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default Monitoring;

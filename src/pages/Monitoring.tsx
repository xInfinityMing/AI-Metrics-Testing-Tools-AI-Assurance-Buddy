import { Activity, AlertTriangle, TrendingDown, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { DRIFT_ALERTS } from "@/data/mock";
import { useProjects } from "@/data/projectStore";
import { cn } from "@/lib/utils";

const sevTone = {
  Low: "bg-success-soft text-success border-success/20",
  Medium: "bg-warning-soft text-warning border-warning/20",
  High: "bg-danger-soft text-danger border-danger/20",
} as const;

const Monitoring = () => {
  const projects = useProjects();

  // Group alerts by project — drift monitoring is project-specific
  const projectIdsWithAlerts = Array.from(new Set(DRIFT_ALERTS.map((a) => a.projectId)));
  const monitoredProjects = projects.filter((p) => projectIdsWithAlerts.includes(p.id));

  return (
    <AppShell>
      <PageHeader
        title="Monitoring & Drift"
        description="Project-specific drift and quality monitoring across your AI systems"
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Monitoring" }]}
      />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Projects monitored" value={monitoredProjects.length} icon={Activity} tone="primary" />
          <StatCard label="Active alerts" value={DRIFT_ALERTS.length} icon={AlertTriangle} tone="warning" />
          <StatCard label="High severity" value={DRIFT_ALERTS.filter((a) => a.severity === "High").length} icon={TrendingDown} tone="danger" />
          <StatCard label="Drift status" value="Elevated" tone="warning" hint="2 systems trending down" />
        </div>

        {/* Project-specific drift sections */}
        <div className="space-y-4">
          {monitoredProjects.length === 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No projects are currently being monitored for drift.
              </CardContent>
            </Card>
          )}

          {monitoredProjects.map((project) => {
            const alerts = DRIFT_ALERTS.filter((a) => a.projectId === project.id);
            const highest = alerts.reduce<("Low" | "Medium" | "High")>((acc, a) => {
              const order = { Low: 0, Medium: 1, High: 2 } as const;
              return order[a.severity] > order[acc] ? a.severity : acc;
            }, "Low");

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
                        {project.useCase} · {project.environment}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="outline" className={cn("rounded-full", sevTone[highest])}>
                        {highest} severity
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Baseline: latest passing run · {alerts.length} active {alerts.length === 1 ? "alert" : "alerts"}
                      </span>
                    </div>
                  </div>
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

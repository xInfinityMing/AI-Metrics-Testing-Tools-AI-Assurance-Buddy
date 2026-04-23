import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Activity, AlertTriangle, CheckCircle2, FileBarChart2, Layers, ShieldCheck, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, RiskBadge, MetricStatusChip } from "@/components/common/StatusBadge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useProject } from "@/data/projectStore";

const ResultsDashboard = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const project = useProject(id);
  if (!project || !project.results) {
    return (
      <AppShell>
        <div className="p-10 text-center text-muted-foreground">No results yet.</div>
      </AppShell>
    );
  }

  const radarData = project.results.map((r) => ({ dim: r.label, score: r.score, full: 100 }));
  const passFailData = project.results.map((r) => ({
    name: r.label,
    pass: r.metrics.filter((m) => m.status === "pass").length,
    warn: r.metrics.filter((m) => m.status === "warn").length,
    fail: r.metrics.filter((m) => m.status === "fail").length,
  }));
  const allMetrics = project.results.flatMap((r) => r.metrics);
  const sevData = [
    { name: "Pass", value: allMetrics.filter((m) => m.status === "pass").length, color: "hsl(var(--success))" },
    { name: "Warning", value: allMetrics.filter((m) => m.status === "warn").length, color: "hsl(var(--warning))" },
    { name: "Fail", value: allMetrics.filter((m) => m.status === "fail").length, color: "hsl(var(--danger))" },
  ];
  const failedCount = sevData[2].value;

  return (
    <AppShell>
      <PageHeader
        title={`${project.name} — Results`}
        description="Mocked evaluation results across all assurance dimensions."
        crumbs={[
          { label: "Projects", to: "/projects" },
          { label: project.name, to: `/projects/${project.id}` },
          { label: "Results" },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(`/projects/${id}/run`)}>Re-run evaluation</Button>
            <Button asChild className="gap-2">
              <Link to={`/reports/rep1`}><FileBarChart2 className="h-4 w-4" /> Open report</Link>
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card className="rounded-2xl shadow-sm sm:col-span-2 lg:col-span-2">
            <CardContent className="p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall Status</div>
              <div className="mt-3 flex items-center gap-3">
                <StatusBadge status={project.status} className="text-sm" />
                <RiskBadge level={project.riskLevel} className="text-sm" />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">System Health Score</div>
                  <div className="text-4xl font-semibold tabular-nums">{project.overallScore}</div>
                </div>
                <HealthRing score={project.overallScore} />
              </div>
            </CardContent>
          </Card>
          <StatCard label="Modules tested" value={project.results.length} icon={Layers} tone="primary" />
          <StatCard label="Failed checks" value={failedCount} icon={XCircle} tone="danger" />
          <StatCard label="Drift status" value={project.results.find((r) => r.key === "drift")?.status === "fail" ? "Drift" : "Stable"} icon={Activity} tone="info" />
          <StatCard label="Safety score" value={project.results.find((r) => r.key === "safety")?.score ?? "—"} icon={ShieldCheck} tone="success" />
        </div>

        {/* <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Dimension scores</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Trend (last runs)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={project.trend} margin={{ left: 8, right: 16, top: 10, bottom: 4 }}>
                  <XAxis dataKey="run" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Severity breakdown</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sevData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {sevData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div> */}

        {/* <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Pass / fail by dimension</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passFailData} margin={{ left: 8, right: 16, top: 10, bottom: 4 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pass" stackId="s" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warn" stackId="s" fill="hsl(var(--warning))" />
                <Bar dataKey="fail" stackId="s" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}

        {/* Detailed sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {project.results.map((r) => (
            <Card key={r.key} className="rounded-2xl shadow-sm">
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <DimensionIcon k={r.key} />
                  <CardTitle className="text-base">{r.label}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{r.score}</span>
                  <MetricStatusChip status={r.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.metrics.map((m) => (
                  <div key={m.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{m.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-muted-foreground">{m.score}/{m.threshold}</span>
                        <MetricStatusChip status={m.status} />
                      </span>
                    </div>
                    <Progress value={m.score} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Detailed findings</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {allMetrics.map((m, i) => (
                <AccordionItem key={i} value={`m-${i}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                      <span className="text-sm font-medium">{m.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-xs text-muted-foreground">score {m.score} · threshold {m.threshold}</span>
                        <MetricStatusChip status={m.status} />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{m.explanation}</p>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="text-xs font-medium text-foreground">Suggested action</div>
                      <div className="text-sm text-muted-foreground">{m.suggestedAction}</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

function DimensionIcon({ k }: { k: string }) {
  const map: Record<string, JSX.Element> = {
    safety: <ShieldCheck className="h-4 w-4 text-primary" />,
    quality: <CheckCircle2 className="h-4 w-4 text-success" />,
    grounding: <Layers className="h-4 w-4 text-info" />,
    workflow: <Activity className="h-4 w-4 text-primary" />,
    drift: <AlertTriangle className="h-4 w-4 text-warning" />,
  };
  return map[k] ?? <Layers className="h-4 w-4" />;
}

function HealthRing({ score }: { score: number }) {
  const r = 32, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
      <circle
        cx="40" cy="40" r={r}
        stroke="hsl(var(--primary))"
        strokeWidth="8" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
      />
    </svg>
  );
}

export default ResultsDashboard;

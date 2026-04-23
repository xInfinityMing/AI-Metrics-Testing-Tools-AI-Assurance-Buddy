import { Link, useNavigate } from "react-router-dom";
import { Plus, FolderKanban, PlayCircle, FileBarChart2, AlertTriangle, Clock, ArrowRight, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, RiskBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProjects, useReports, getProjectById } from "@/data/projectStore";
import { computeAllDriftAlerts } from "@/data/driftAlerts";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const PROJECTS = useProjects();
  const REPORTS = useReports();
  const user = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const driftAlerts = computeAllDriftAlerts(PROJECTS);
  const highSeverityCount = driftAlerts.filter((a) => a.severity === "High").length;
  const trendBase = PROJECTS[0]?.trend ?? [];
  const trendData = trendBase.map((t, i) => ({
    name: t.run,
    avg: PROJECTS.length
      ? Math.round(PROJECTS.reduce((a, p) => a + (p.trend[i]?.score ?? 0), 0) / PROJECTS.length)
      : 0,
  }));

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Monitor AI assurance across your workspace. All systems mocked for this POC demo."
        crumbs={[{ label: "Workspace" }, { label: "Dashboard" }]}
        actions={
          <Button size="lg" className="gap-2 shadow-sm" onClick={() => navigate("/projects/new")}>
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Projects" value={PROJECTS.length} icon={FolderKanban} tone="primary" />
          <StatCard label="Active Runs" value={1} icon={PlayCircle} tone="info" hint="1 running now" />
          <StatCard label="Completed Reports" value={REPORTS.length} icon={FileBarChart2} tone="success" />
          <StatCard
            label="Drift Alerts"
            value={driftAlerts.length}
            icon={AlertTriangle}
            tone="warning"
            hint={`${highSeverityCount} high severity`}
          />
          {/* <StatCard label="Last Updated" value="2 min ago" icon={Clock} hint="2025-04-19 14:24" /> */}
        </div>

        {/* <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Assurance score trend</CardTitle>
                <p className="text-xs text-muted-foreground">Average across the last 5 runs per project</p>
              </div>
            </CardHeader>
            <CardContent className="h-56 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: 16, right: 16, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div> */}

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { t: "Run completed", d: "Internal Knowledge Assistant — score 88", time: "2m ago", color: "bg-success" },
              { t: "Drift alert", d: "Retrieval drift on Policy Q&A Bot", time: "1h ago", color: "bg-warning" },
              { t: "Report generated", d: "Pre-launch report for Policy Q&A Bot", time: "3h ago", color: "bg-info" },
              { t: "Run failed", d: "Customer Service Copilot — score 54", time: "yesterday", color: "bg-danger" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-transparent p-2 hover:bg-muted/50">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{a.t}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.d}</div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent projects</CardTitle>
              <p className="text-xs text-muted-foreground">All AI systems being assured in this workspace</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/projects" className="gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  {/* <TableHead>Use Case</TableHead> */}
                  {/* <TableHead>Environment</TableHead> */}
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead className="text-right">Overall Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROJECTS.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.useCase}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full text-[10px]">{p.environment}</Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{p.lastRun}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{p.overallScore}</TableCell>
                    <TableCell><RiskBadge level={p.riskLevel} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent reports</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/reports" className="gap-1">All reports <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {REPORTS.map((r) => (
              <Link key={r.id} to={`/reports/${r.id}`} className="block">
                <div className="flex items-start gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:bg-muted/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.title}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{getProjectById(r.projectId)?.name} · {r.createdAt}</div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Dashboard;

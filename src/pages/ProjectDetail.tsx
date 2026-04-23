import { Link, useNavigate, useParams } from "react-router-dom";
import { Play, FileBarChart2, ArrowDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, RiskBadge } from "@/components/common/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DIMENSION_GROUPS } from "@/data/mock";
import { useProject, useReports } from "@/data/projectStore";

const ProjectDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const project = useProject(id);
  const REPORTS = useReports();
  if (!project) {
    return (
      <AppShell>
        <div className="p-10 text-center text-muted-foreground">Project not found.</div>
      </AppShell>
    );
  }
  const projectReports = REPORTS.filter((r) => r.projectId === project.id);

  return (
    <AppShell>
      <PageHeader
        title={project.name}
        description={project.description}
        crumbs={[{ label: "Projects", to: "/projects" }, { label: project.name }]}
        actions={
          <>
            <Button variant="outline" asChild className="gap-2">
              <Link to={`/projects/${project.id}/results`}><FileBarChart2 className="h-4 w-4" /> View Results</Link>
            </Button>
            <Button onClick={() => navigate(`/projects/${project.id}/run`)} className="gap-2">
              <Play className="h-4 w-4" /> Run Mock Evaluation
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
          <StatusBadge status={project.status} />
          <RiskBadge level={project.riskLevel} />
          <span className="ml-auto text-xs text-muted-foreground">Last run: {project.lastRun}</span>
          <div className="text-2xl font-semibold tabular-nums">{project.overallScore}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {["overview", "workflow", "models", "data", "scope", "runs", "reports"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-background">
                {t === "data" ? "Data sources" : t === "scope" ? "Test scope" : t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl shadow-sm md:col-span-2">
              <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{project.description}</p>
                <p>Owner: <span className="text-foreground">{project.owner}</span></p>
                {project.systemUrl && <p>System URL: <span className="text-foreground">{project.systemUrl}</span></p>}
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Latest scores</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {project.results?.map((r) => (
                  <div key={r.key} className="flex items-center justify-between">
                    <span>{r.label}</span>
                    <span className="font-semibold tabular-nums">{r.score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="mt-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="text-base">AI Workflow</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.workflow.map((s, i) => (
                    <div key={s.id}>
                      <div className="flex items-center gap-3 rounded-xl border p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{s.name}</span>
                            <Badge variant="outline" className="rounded-full text-[10px]">{s.type}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{s.description}</div>
                        </div>
                        <span className="text-xs text-muted-foreground">{s.modelOrService}</span>
                      </div>
                      {i < project.workflow.length - 1 && (
                        <div className="flex justify-center py-1 text-muted-foreground"><ArrowDown className="h-4 w-4" /></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="mt-4 grid gap-4 md:grid-cols-2">
            {project.models.map((m) => (
              <Card key={m.id} className="rounded-2xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">{m.provider}</div>
                      <div className="text-base font-semibold">{m.modelName}</div>
                    </div>
                    <Badge variant="outline" className="rounded-full">{m.role}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{m.purpose}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    {m.endpointLabel && <code className="rounded bg-muted px-1.5 py-0.5">{m.endpointLabel}</code>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="data" className="mt-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.dataSources.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.type}</TableCell>
                        <TableCell className="text-muted-foreground">{d.fileName ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{d.rowCount?.toLocaleString() ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{d.uploadedAt ?? "—"}</TableCell>
                        <TableCell>
                          {d.status === "Uploaded" ? (
                            <Badge variant="outline" className="rounded-full border-success/20 bg-success-soft text-success">Uploaded</Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full">Empty</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scope" className="mt-4 grid gap-4 md:grid-cols-2">
            {DIMENSION_GROUPS.map((g) => (
              <Card key={g.key} className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="text-base">{g.label}</CardTitle></CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {g.metrics.map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span>{m.label}</span>
                      <Badge variant="outline" className="rounded-full text-[10px]">selected</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="runs" className="mt-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.runs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.startedAt}</TableCell>
                        <TableCell className="text-muted-foreground">{Math.floor(r.durationSec / 60)}m {r.durationSec % 60}s</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{r.overallScore}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-3">
            {projectReports.length === 0 && (
              <p className="text-sm text-muted-foreground">No reports generated yet.</p>
            )}
            {projectReports.map((r) => (
              <Card key={r.id} className="rounded-2xl shadow-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.createdAt}</div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link to={`/reports/${r.id}`}>Open</Link></Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default ProjectDetail;

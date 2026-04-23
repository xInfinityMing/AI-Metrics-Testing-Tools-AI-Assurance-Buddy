import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, RiskBadge } from "@/components/common/StatusBadge";
import { useProjects } from "@/data/projectStore";

const Projects = () => {
  const navigate = useNavigate();
  const PROJECTS = useProjects();
  return (
    <AppShell>
      <PageHeader
        title="Projects"
        description="All AI systems being assured by your team"
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Projects" }]}
        actions={
          <Button onClick={() => navigate("/projects/new")} className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROJECTS.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/projects/${p.id}`} className="font-medium hover:text-primary">
                        {p.name}
                      </Link>
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
      </div>
    </AppShell>
  );
};

export default Projects;

import { Link } from "react-router-dom";
import { FileText, Download, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useReports, getProjectById } from "@/data/projectStore";

const Reports = () => {
  const REPORTS = useReports();
  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Stakeholder-ready assurance reports across all projects"
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Reports" }]}
      />
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 md:px-8">
        {REPORTS.map((r) => {
          const proj = getProjectById(r.projectId);
          return (
            <Card key={r.id} className="rounded-2xl shadow-sm">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{r.title}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{r.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {proj?.name} · {r.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3.5 w-3.5" /> Export PDF
                  </Button>
                  <Button size="sm" asChild className="gap-1">
                    <Link to={`/reports/${r.id}`}>Open report <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
};

export default Reports;

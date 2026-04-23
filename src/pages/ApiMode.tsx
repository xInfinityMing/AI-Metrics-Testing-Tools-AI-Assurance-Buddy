import { Link } from "react-router-dom";
import { Lock, Sparkles, ArrowLeft, Globe, KeyRound, FileJson, FlaskConical, FileBarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PLANNED = [
  { icon: Globe, title: "Endpoint config", desc: "Configure base URL, route, headers and timeouts." },
  { icon: KeyRound, title: "Auth setup", desc: "API key, OAuth and bearer token authentication." },
  { icon: FileJson, title: "Sample payload testing", desc: "Provide sample request payloads for evaluation." },
  { icon: FlaskConical, title: "Black-box response evaluation", desc: "Run safety, quality and grounding probes against responses." },
  { icon: FileBarChart2, title: "Generated report", desc: "Unified assurance report with risk and recommendations." },
];

const ApiMode = () => {
  return (
    <AppShell>
      <PageHeader
        title="API Endpoint Mode"
        description="Black-box endpoint testing for deployed AI systems by providing API configuration and sample payloads."
        crumbs={[{ label: "Projects", to: "/projects" }, { label: "New", to: "/projects/new" }, { label: "API Mode" }]}
        actions={
          <Button variant="outline" asChild className="gap-2">
            <Link to="/projects/new"><ArrowLeft className="h-4 w-4" /> Back to wizard</Link>
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-8">
        <Card className="overflow-hidden rounded-2xl border-dashed shadow-sm">
          <div className="bg-gradient-to-br from-primary-soft via-card to-card p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Coming soon</h2>
                  <p className="text-sm text-muted-foreground">Test any deployed AI system without exposing the workflow internals.</p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-full border-warning/20 bg-warning-soft text-warning">Roadmap</Badge>
            </div>

            {/* Mock illustration / preview */}
            <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Endpoint URL</div>
                  <Input disabled placeholder="https://api.acme.ai/v1/chat" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Auth</div>
                  <Input disabled placeholder="Bearer ••••••••••••" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">Sample payload</div>
                  <pre className="rounded-lg border bg-muted/40 p-3 text-[11px] text-muted-foreground"><code>{`{
  "messages": [{ "role": "user", "content": "What is our refund policy?" }],
  "temperature": 0.2
}`}</code></pre>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button disabled className="gap-2"><Lock className="h-3.5 w-3.5" /> Run probe</Button>
                <Button disabled variant="outline">Preview report</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Planned capabilities</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PLANNED.map((p) => (
              <div key={p.title} className="rounded-xl border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <p.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-sm font-medium">{p.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">Want early access when this ships?</p>
            <div className="flex w-full max-w-sm gap-2">
              <Input placeholder="you@company.com" disabled />
              <Button disabled className="gap-2"><Lock className="h-4 w-4" /> Join waitlist</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Not active in this POC demo.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default ApiMode;

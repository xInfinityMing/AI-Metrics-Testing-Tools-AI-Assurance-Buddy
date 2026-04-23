import { Lock, ShieldAlert, Gauge, Sparkles, Activity, Globe } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    name: "GARAK integration",
    icon: ShieldAlert,
    desc: "Adversarial safety probes — jailbreak resistance, prompt injection, data leakage.",
    dimension: "Safety",
  },
  {
    name: "HELM integration",
    icon: Gauge,
    desc: "Holistic quality benchmarks across reasoning, knowledge and exact-match tasks.",
    dimension: "Quality",
  },
  {
    name: "DeepEval integration",
    icon: Sparkles,
    desc: "RAG-specific grounding metrics — faithfulness, contextual recall and precision.",
    dimension: "Grounding / RAG",
  },
  {
    name: "Evidently AI integration",
    icon: Activity,
    desc: "Continuous input, output and retrieval drift monitoring with project baselines.",
    dimension: "Drift / Monitoring",
  },
  {
    name: "API Endpoint Mode",
    icon: Globe,
    desc: "Black-box endpoint testing for deployed AI systems via API config and sample payloads.",
    dimension: "Future mode",
  },
];

const Settings = () => {
  return (
    <AppShell>
      <PageHeader
        title="Settings & Integrations"
        description="Future engines that will plug into AI Assurance Buddy. All currently mocked."
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Settings" }]}
      />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <Card key={i.name} className="rounded-2xl shadow-sm">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <i.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{i.name}</CardTitle>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{i.dimension}</div>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full border-warning/20 bg-warning-soft text-warning">
                  Coming soon
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{i.desc}</p>
                <Button disabled variant="outline" className="mt-4 w-full gap-2">
                  <Lock className="h-3.5 w-3.5" /> Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Workspace name</div>
              <div className="font-medium">AI Team Workspace</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Plan</div>
              <div className="font-medium">Enterprise (demo)</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Members</div>
              <div className="font-medium">12 collaborators</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Settings;

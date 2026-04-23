import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check, ChevronLeft, ChevronRight, Lock, Workflow, Boxes, Database,
  ListChecks, FileCheck2, Save, Play, Plus, Trash2, X,
  Upload, FileText, CheckCircle2, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DEFAULT_WORKFLOW, DIMENSION_GROUPS, MODELS, PROVIDERS, type ModelCard,
  type WorkflowStep, type DataSource, type Environment,
} from "@/data/mock";
import { createProject } from "@/data/projectStore";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";

const STEPS = [
  { id: 1, label: "Project Details", icon: FileText },
  { id: 2, label: "Choose Mode", icon: Sparkles },
  { id: 3, label: "Define AI Workflow", icon: Workflow },
  { id: 4, label: "Data Sources", icon: Database },
  { id: 5, label: "Test Dimensions", icon: ListChecks },
  { id: 6, label: "Review & Confirm", icon: FileCheck2 },
];

const initialDataSources: DataSource[] = [
  { id: "n1", type: "Prompt Set", status: "Empty" },
  { id: "n2", type: "Benchmark Dataset", status: "Empty" },
  { id: "n3", type: "RAG Dataset", status: "Empty" },
  { id: "n4", type: "Retrieval Context / Knowledge Base", status: "Empty" },
  { id: "n5", type: "Reference Dataset", status: "Empty" },
  { id: "n6", type: "Current Dataset", status: "Empty" },
];

const ALL_METRIC_IDS = DIMENSION_GROUPS.flatMap((g) => g.metrics.map((m) => `${g.key}.${m.id}`));

const NewProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // form state
  const [name, setName] = useState("New AI Project");
  const [useCase, setUseCase] = useState("Internal Q&A");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("Development");
  const [owner, setOwner] = useState("Platform AI Team");
  const [systemUrl, setSystemUrl] = useState("");
  const [tags, setTags] = useState<string[]>(["RAG", "Internal"]);
  const [tagInput, setTagInput] = useState("");
  const [mode, setMode] = useState<"structured" | "api">("structured");
  const [workflow, setWorkflow] = useState<WorkflowStep[]>(DEFAULT_WORKFLOW);
  const [models, setModels] = useState<ModelCard[]>([
    { id: "nm1", provider: "OpenAI", modelName: "GPT-4.1", purpose: "Primary generation", role: "Primary", environment: "Production", endpointLabel: "openai/gpt-4.1" },
    { id: "nm2", provider: "Anthropic", modelName: "Claude 3.7", purpose: "Fallback reasoning", role: "Fallback", environment: "Production" },
    { id: "nm3", provider: "Internal API", modelName: "Custom Internal Model", purpose: "Guardrail & classification", role: "Primary", environment: "Production" },
  ]);
  const [dataSources, setDataSources] = useState<DataSource[]>(initialDataSources);
  const [selected, setSelected] = useState<string[]>(ALL_METRIC_IDS);

  const progress = useMemo(() => Math.round(((step - 1) / (STEPS.length - 1)) * 100), [step]);

  // Per-step validation — blocks Continue when invalid
  const stepValidation = useMemo<{ ok: boolean; reason?: string }>(() => {
    if (step === 1) {
      if (!name.trim()) return { ok: false, reason: "Project name is required." };
      if (!useCase.trim()) return { ok: false, reason: "Use case is required." };
      if (!description.trim()) return { ok: false, reason: "Description is required." };
      return { ok: true };
    }
    if (step === 2) {
      if (mode !== "structured") return { ok: false, reason: "Choose Structured Workflow Mode to continue." };
      return { ok: true };
    }
    if (step === 3) {
      if (workflow.length < 2) return { ok: false, reason: "Add at least two workflow steps." };
      if (workflow[0].type !== "User Input") return { ok: false, reason: "Workflow must start with a User Input step." };
      if (workflow[workflow.length - 1].type !== "Final Response") return { ok: false, reason: "Workflow must end with a Final Response step." };
      const finalCount = workflow.filter((s) => s.type === "Final Response").length;
      if (finalCount !== 1) return { ok: false, reason: "Exactly one Final Response step is allowed." };
      const needsService = workflow.find(
        (s) => s.type !== "User Input" && s.type !== "Final Response" && (!s.provider || !s.modelOrService),
      );
      if (needsService) return { ok: false, reason: `Step "${needsService.name}" needs a provider and model/service.` };
      return { ok: true };
    }
    if (step === 4) {
      const needsBenchmark = selected.some((k) => k.startsWith("quality."));
      const needsRag = selected.some((k) => k.startsWith("grounding."));
      const needsDrift = selected.some((k) => k.startsWith("drift."));
      const has = (t: DataSource["type"]) => dataSources.find((d) => d.type === t)?.status === "Uploaded";
      if (needsBenchmark && !has("Benchmark Dataset")) return { ok: false, reason: "Upload a Benchmark Dataset (required by Quality)." };
      if (needsRag && !has("RAG Dataset") && !has("Retrieval Context / Knowledge Base")) return { ok: false, reason: "Upload a RAG dataset or Retrieval Context (required by Grounding)." };
      if (needsDrift && (!has("Reference Dataset") || !has("Current Dataset"))) return { ok: false, reason: "Upload Reference + Current datasets (required by Drift)." };
      return { ok: true };
    }
    if (step === 5) {
      if (selected.length === 0) return { ok: false, reason: "Select at least one test dimension." };
      return { ok: true };
    }
    return { ok: true };
  }, [step, name, useCase, description, mode, workflow, selected, dataSources]);

  function next() {
    if (!stepValidation.ok) {
      toast.error("Please fix the issue before continuing", { description: stepValidation.reason });
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function prev() { setStep((s) => Math.max(1, s - 1)); }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    setTags([...tags, t]);
    setTagInput("");
  }
  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function addModel() {
    setModels((m) => [...m, {
      id: `nm${Date.now()}`, provider: "OpenAI", modelName: "GPT-4.1",
      purpose: "", role: "Primary", environment: "Development",
    }]);
  }
  function removeModel(id: string) { setModels((m) => m.filter((x) => x.id !== id)); }
  function updateModel(id: string, patch: Partial<ModelCard>) {
    setModels((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function simulateUpload(id: string) {
    const fakeRows = Math.floor(400 + Math.random() * 4000);
    setDataSources((ds) => ds.map((d) => d.id === id ? {
      ...d, status: "Uploaded", fileName: `${d.type.toLowerCase().replace(/[^a-z]/g, "_")}_${Date.now().toString().slice(-4)}.csv`,
      rowCount: fakeRows, uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    } : d));
    toast.success("Upload simulated", { description: "Mock file processed and parsed successfully." });
  }

  function toggleMetric(key: string) {
    setSelected((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
  }

  function buildPayload() {
    return {
      name: name.trim() || "Untitled Project",
      useCase: useCase.trim() || "—",
      description: description.trim(),
      environment: environment as Environment,
      owner: owner.trim() || "Unassigned",
      systemUrl: systemUrl.trim() || undefined,
      mode: "structured" as const,
      workflow,
      models,
      dataSources,
      selectedDimensions: selected,
    };
  }

  function saveDraft() {
    const project = createProject({ ...buildPayload(), status: "Draft", riskLevel: "Low" });
    toast.success("Draft saved", { description: `${project.name} added to your projects.` });
    navigate("/projects");
  }
  function runEvaluation() {
    const project = createProject({ ...buildPayload(), status: "Running", riskLevel: "Medium" });
    toast.success("Starting mock evaluation…", { description: project.name });
    navigate(`/projects/${project.id}/run`);
  }

  return (
    <AppShell>
      <PageHeader
        title="Create New Project"
        description="Define your AI system, choose what to test, and run a mock evaluation."
        crumbs={[{ label: "Projects", to: "/projects" }, { label: "New" }]}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        {/* Stepper */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {step} of {STEPS.length}</span>
              <span>{progress}% complete</span>
            </div>
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {STEPS.map((s) => {
                const active = s.id === step;
                const done = s.id < step;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.id <= step) { setStep(s.id); return; }
                      if (s.id === step + 1) { next(); return; }
                      toast.error("Complete the current step first");
                    }}
                    className={cn(
                      "flex min-w-fit flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                      active && "border-primary bg-primary-soft text-primary",
                      !active && done && "border-success/30 bg-success-soft text-success",
                      !active && !done && "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-success text-success-foreground",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </span>
                    <span className="hidden text-xs font-medium md:block">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step content */}
        <div className="mt-6 space-y-6">
          {step === 1 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <Field label="Project Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Use Case"><Input value={useCase} onChange={(e) => setUseCase(e.target.value)} /></Field>
                <Field label="Description" className="md:col-span-2">
                  <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe what this AI system does." />
                </Field>
                <Field label="Environment">
                  <Select value={environment} onValueChange={setEnvironment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Staging">Staging</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Owner / Team"><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
                <Field label="AI System URL (optional)" className="md:col-span-2">
                  <Input value={systemUrl} onChange={(e) => setSystemUrl(e.target.value)} placeholder="https://" />
                </Field>
                <Field label="Tags" className="md:col-span-2">
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
                    {tags.map((t) => (
                      <Badge key={t} variant="outline" className="gap-1 rounded-full bg-primary-soft text-primary border-primary/20">
                        {t}
                        <button onClick={() => removeTag(t)} className="hover:text-danger" aria-label={`Remove ${t}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag and press Enter"
                      className="flex-1 min-w-[140px] bg-transparent text-sm outline-none"
                    />
                  </div>
                </Field>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setMode("structured")}
                className={cn(
                  "rounded-2xl border-2 bg-card p-6 text-left shadow-sm transition",
                  mode === "structured" ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="rounded-full border-success/20 bg-success-soft text-success">Active</Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold">Structured Workflow Mode</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define your AI system using workflow steps, assign models &amp; services, then select testing dimensions.
                </p>
              </button>

              <div className="relative cursor-not-allowed rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 opacity-80">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="rounded-full border-warning/20 bg-warning-soft text-warning">Coming soon</Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold text-muted-foreground">API Endpoint Mode</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Future black-box testing by providing API endpoint details &amp; sample payloads.
                </p>
                <Link to="/projects/new/api-mode" className="mt-3 inline-block text-xs text-primary hover:underline">
                  Preview the future experience →
                </Link>
              </div>
            </div>
          )}

          {step === 3 && (
            <WorkflowBuilder workflow={workflow} setWorkflow={setWorkflow} />
          )}

          {step === 4 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Data Sources</CardTitle>
                <p className="text-xs text-muted-foreground">Uploads are simulated for this POC.</p>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {dataSources.map((d) => (
                  <div key={d.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{d.type}</div>
                        {d.status === "Uploaded" ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {d.fileName} · {d.rowCount?.toLocaleString()} rows · {d.uploadedAt}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-muted-foreground">No file uploaded yet</div>
                        )}
                      </div>
                      {d.status === "Uploaded" ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="rounded-full border-success/20 bg-success-soft text-success">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Ready
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">parsed</span>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => simulateUpload(d.id)} className="gap-1">
                          <Upload className="h-3.5 w-3.5" /> Upload
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <div className="grid gap-4 md:grid-cols-2">
              {DIMENSION_GROUPS.map((g) => (
                <Card key={g.key} className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">{g.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {g.metrics.map((m) => {
                      const key = `${g.key}.${m.id}`;
                      const checked = selected.includes(key);
                      return (
                        <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted/60">
                          <Checkbox checked={checked} onCheckedChange={() => toggleMetric(key)} />
                          <span className="text-sm">{m.label}</span>
                        </label>
                      );
                    })}
                    <div className="border-t pt-3 text-[11px] text-muted-foreground">
                      Powered by <span className="font-medium text-foreground">{g.poweredBy}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="text-base">Project</CardTitle></CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-3">
                  <Summary k="Name" v={name} />
                  <Summary k="Use case" v={useCase} />
                  <Summary k="Environment" v={environment} />
                  <Summary k="Owner" v={owner} />
                  <Summary k="Mode" v="Structured Workflow Mode" />
                  <Summary k="System URL" v={systemUrl || "—"} />
                  <div className="md:col-span-3">
                    <div className="text-xs text-muted-foreground">Tags</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {tags.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                      {tags.map((t) => <Badge key={t} variant="outline" className="rounded-full">{t}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-base">Workflow ({workflow.length} steps)</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {workflow.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{i + 1}.</span>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">· {s.type}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-base">Models & services in workflow</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {workflow.filter((s) => s.modelOrService).map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className="truncate"><span className="font-medium">{s.modelOrService}</span> <span className="text-xs text-muted-foreground">· {s.provider ?? "—"}</span></span>
                        <Badge variant="outline" className="rounded-full text-[10px]">{s.type}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-base">Data Sources</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {dataSources.map((d) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <span>{d.type}</span>
                        <span className="text-xs text-muted-foreground">{d.status === "Uploaded" ? d.fileName : "—"}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-base">Test dimensions</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {DIMENSION_GROUPS.map((g) => {
                      const count = g.metrics.filter((m) => selected.includes(`${g.key}.${m.id}`)).length;
                      return (
                        <div key={g.key} className="flex items-center justify-between">
                          <span>{g.label}</span>
                          <span className="text-xs text-muted-foreground">{count}/{g.metrics.length} selected</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Validation banner */}
        {!stepValidation.ok && step < STEPS.length && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            <span className="mt-0.5 text-base">⚠</span>
            <div>
              <div className="font-medium">This step needs attention</div>
              <div className="text-xs">{stepValidation.reason}</div>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={prev} disabled={step === 1} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            {step === STEPS.length ? (
              <>
                <Button variant="outline" onClick={saveDraft} className="gap-2"><Save className="h-4 w-4" /> Save Draft</Button>
                <Button onClick={runEvaluation} className="gap-2"><Play className="h-4 w-4" /> Run Mock Evaluation</Button>
              </>
            ) : (
              <Button onClick={next} disabled={!stepValidation.ok} className="gap-2">Continue <ChevronRight className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

export default NewProject;

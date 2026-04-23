import { useState } from "react";
import {
  DndContext, type DragEndEvent, KeyboardSensor, PointerSensor,
  closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy, GripVertical, Plus, Trash2, Sparkles, CircleDot, Flag, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ProviderName, StepType, WorkflowStep } from "@/data/mock";
import { PROVIDER_MODELS } from "@/data/mock";
import { NODE_TYPES, QUICK_TEMPLATES, metaFor } from "@/data/workflowMeta";

// AI model providers — only relevant when the step uses a generative AI model
const AI_MODEL_PROVIDERS: ProviderName[] = ["OpenAI", "Anthropic", "Ollama", "Bedrock"];
// Internal/service providers — for retrieval, tools, guardrails, rules, monitoring
const INTERNAL_PROVIDERS: ProviderName[] = ["Internal API", "Internal Service"];

// Step types that require a provider + model/service selection
const STEP_NEEDS_SERVICE: Record<StepType, boolean> = {
  "User Input": false,
  "Final Response": false,
  "Retrieval / Knowledge Base": true,
  "LLM / Model Call": true,
  "Tool / API Call": true,
  "Guardrail / Validation": true,
  "Post-processing / Rules": true,
  "Monitoring / Drift": true,
};

// Step types that use an AI model provider (vs. an internal service provider)
const STEP_USES_AI_MODEL: Record<StepType, boolean> = {
  "User Input": false,
  "Final Response": false,
  "Retrieval / Knowledge Base": false,
  "LLM / Model Call": true,
  "Tool / API Call": false,
  "Guardrail / Validation": false,
  "Post-processing / Rules": false,
  "Monitoring / Drift": false,
};

// Which I/O fields each step type actually needs.
// - User Input: produces data, no upstream source -> output only
// - Final Response: terminal node, consumes upstream -> input only
// - Monitoring / Drift: observes the pipeline side-channel -> no I/O contract
// - Everything else transforms data -> both
const STEP_IO_FIELDS: Record<StepType, { input: boolean; output: boolean }> = {
  "User Input": { input: false, output: true },
  "Final Response": { input: true, output: false },
  "Retrieval / Knowledge Base": { input: true, output: true },
  "LLM / Model Call": { input: true, output: true },
  "Tool / API Call": { input: true, output: true },
  "Guardrail / Validation": { input: true, output: true },
  "Post-processing / Rules": { input: true, output: true },
  "Monitoring / Drift": { input: false, output: false },
};

function providerOptionsFor(type: StepType): ProviderName[] {
  if (!STEP_NEEDS_SERVICE[type]) return [];
  return STEP_USES_AI_MODEL[type] ? AI_MODEL_PROVIDERS : INTERNAL_PROVIDERS;
}

export function stepNeedsService(type: StepType): boolean {
  return STEP_NEEDS_SERVICE[type];
}

interface Props {
  workflow: WorkflowStep[];
  setWorkflow: (next: WorkflowStep[]) => void;
}

function newId() {
  return `s${Date.now()}${Math.floor(Math.random() * 999)}`;
}

function buildStep(type: StepType): WorkflowStep {
  const meta = metaFor(type);
  const needs = STEP_NEEDS_SERVICE[type];
  return {
    id: newId(),
    name: type,
    type,
    description: meta.short,
    provider: needs ? undefined : "None",
    modelOrService: needs ? "" : "No service required",
    inputSource: "",
    outputType: "",
    includeInTesting: true,
  };
}

export function WorkflowBuilder({ workflow, setWorkflow }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(workflow[0]?.id ?? null);
  const selected = workflow.find((s) => s.id === selectedId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addNode(type: StepType, atIndex?: number) {
    const step = buildStep(type);
    const next = [...workflow];
    if (atIndex == null || atIndex >= next.length) next.push(step);
    else next.splice(atIndex, 0, step);
    setWorkflow(next);
    setSelectedId(step.id);
  }

  function deleteNode(id: string) {
    const next = workflow.filter((s) => s.id !== id);
    setWorkflow(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  }

  function duplicateNode(id: string) {
    const idx = workflow.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const orig = workflow[idx];
    const copy: WorkflowStep = { ...orig, id: newId(), name: `${orig.name} (copy)` };
    const next = [...workflow];
    next.splice(idx + 1, 0, copy);
    setWorkflow(next);
    setSelectedId(copy.id);
  }

  function updateNode(id: string, patch: Partial<WorkflowStep>) {
    setWorkflow(workflow.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function applyTemplate(templateId: string) {
    const t = QUICK_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    const next: WorkflowStep[] = t.steps.map((s, i) => ({ ...s, id: `s${Date.now()}-${i}` }));
    setWorkflow(next);
    setSelectedId(next[0]?.id ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = workflow.findIndex((s) => s.id === active.id);
    const newIndex = workflow.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setWorkflow(arrayMove(workflow, oldIndex, newIndex));
  }

  // Validation
  const hasStart = workflow.length > 0 && workflow[0].type === "User Input";
  const hasFinal = workflow.length > 0 && workflow[workflow.length - 1].type === "Final Response";
  const finalCount = workflow.filter((s) => s.type === "Final Response").length;
  const valid = hasStart && hasFinal && finalCount === 1;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Left: Node Library */}
      <Card className="rounded-2xl shadow-sm lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Node library</CardTitle>
          <p className="text-[11px] text-muted-foreground">Click to append a node.</p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {NODE_TYPES.map((n) => (
            <button
              key={n.type}
              onClick={() => addNode(n.type)}
              className="group flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-left transition hover:border-primary/40 hover:bg-muted/50"
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border", n.tone)}>
                <n.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{n.type}</div>
                <div className="truncate text-[10px] text-muted-foreground">{n.short}</div>
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}

          <div className="mt-4 border-t pt-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Quick-start templates
            </div>
            <div className="space-y-1.5">
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className="w-full rounded-lg border bg-card p-2 text-left text-xs transition hover:border-primary/40 hover:bg-primary-soft"
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Center: Canvas */}
      <Card className="rounded-2xl shadow-sm lg:col-span-6">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm">Workflow canvas</CardTitle>
            <p className="text-[11px] text-muted-foreground">Drag nodes to reorder. Auto-connected in sequence.</p>
          </div>
          <div className="flex items-center gap-2">
            {valid ? (
              <Badge variant="outline" className="rounded-full border-success/20 bg-success-soft text-success text-[10px]">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full border-warning/20 bg-warning-soft text-warning text-[10px]">
                <AlertTriangle className="mr-1 h-3 w-3" /> Needs attention
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[560px] rounded-xl border bg-gradient-to-b from-muted/40 to-transparent p-4">
            {workflow.length === 0 ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Sparkles className="h-6 w-6" />
                <p className="text-sm">No nodes yet</p>
                <p className="text-xs">Pick a template or add a node from the library.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical rail */}
                <div className="pointer-events-none absolute left-[27px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/40 via-border to-primary/40" />

                {/* Start marker */}
                <RailMarker icon={CircleDot} label="Start" tone="primary" />

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={workflow.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 py-2">
                      {workflow.map((s, i) => (
                        <SortableNode
                          key={s.id}
                          step={s}
                          index={i}
                          isLast={i === workflow.length - 1}
                          selected={s.id === selectedId}
                          onSelect={() => setSelectedId(s.id)}
                          onDelete={() => deleteNode(s.id)}
                          onDuplicate={() => duplicateNode(s.id)}
                          onInsertAfter={(type) => addNode(type, i + 1)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* End marker */}
                <RailMarker icon={Flag} label="End" tone="success" />
              </div>
            )}
          </ScrollArea>

          {/* Validation hints */}
          <div className="mt-3 grid gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-3">
            <ValidationHint ok={hasStart} label="Starts with User Input" />
            <ValidationHint ok={hasFinal} label="Ends with Final Response" />
            <ValidationHint ok={finalCount <= 1} label="Single Final Response" />
          </div>
        </CardContent>
      </Card>

      {/* Right: Configuration */}
      <Card className="rounded-2xl shadow-sm lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Node configuration</CardTitle>
          <p className="text-[11px] text-muted-foreground">{selected ? "Edit the selected node." : "Select a node to configure."}</p>
        </CardHeader>
        <CardContent>
          {!selected ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              Pick a node on the canvas to edit its details.
            </div>
          ) : (
            <ConfigPanel
              key={selected.id}
              step={selected}
              onChange={(patch) => updateNode(selected.id, patch)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RailMarker({
  icon: Icon, label, tone,
}: { icon: typeof CircleDot; label: string; tone: "primary" | "success" }) {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <div className={cn(
        "z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-card shadow-sm",
        tone === "primary" ? "border-primary text-primary" : "border-success text-success",
      )}>
        <Icon className="h-3 w-3" />
      </div>
      <span className={cn(
        "text-[10px] font-semibold uppercase tracking-wider",
        tone === "primary" ? "text-primary" : "text-success",
      )}>
        {label}
      </span>
    </div>
  );
}

function ValidationHint({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-md border px-2 py-1",
      ok
        ? "border-success/20 bg-success-soft text-success"
        : "border-warning/20 bg-warning-soft text-warning",
    )}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
}

function SortableNode({
  step, index, isLast, selected, onSelect, onDelete, onDuplicate, onInsertAfter,
}: {
  step: WorkflowStep;
  index: number;
  isLast: boolean;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onInsertAfter: (type: StepType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const meta = metaFor(step.type);
  const Icon = meta.icon;
  const [insertOpen, setInsertOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Node row with rail dot */}
      <div className="relative flex items-stretch gap-3">
        {/* Rail dot */}
        <div className="relative flex w-[22px] shrink-0 justify-center">
          <span className={cn(
            "z-10 mt-4 h-3 w-3 rounded-full border-2 bg-card shadow-sm",
            selected ? "border-primary" : "border-border",
          )} />
        </div>

        {/* Card */}
        <div
          onClick={onSelect}
          className={cn(
            "group flex flex-1 cursor-pointer items-stretch gap-2 rounded-xl border bg-card p-3 shadow-sm transition",
            selected ? "border-primary ring-2 ring-primary/15" : "hover:border-primary/40",
          )}
        >
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="flex cursor-grab items-center text-muted-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", meta.tone)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-sm font-medium">{step.name || step.type}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {step.type}{step.modelOrService ? ` · ${step.modelOrService}` : ""}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {meta.suggestedDimensions.map((d) => (
                <span key={d} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} aria-label="Duplicate">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Insert-between control */}
      {!isLast && (
        <div className="relative flex items-center gap-3 py-1.5">
          <div className="relative flex w-[22px] shrink-0 justify-center">
            <Popover open={insertOpen} onOpenChange={setInsertOpen}>
              <PopoverTrigger asChild>
                <button
                  className="z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary"
                  aria-label="Insert step"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-60 p-1.5">
                <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Insert step
                </div>
                <div className="space-y-0.5">
                  {NODE_TYPES.map((n) => (
                    <button
                      key={n.type}
                      onClick={() => { onInsertAfter(n.type); setInsertOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-xs hover:bg-muted"
                    >
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border", n.tone)}>
                        <n.icon className="h-3 w-3" />
                      </span>
                      <span className="truncate">{n.type}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="h-3 flex-1" />
        </div>
      )}
    </div>
  );
}

function ConfigPanel({ step, onChange }: { step: WorkflowStep; onChange: (patch: Partial<WorkflowStep>) => void }) {
  const meta = metaFor(step.type);
  const needsService = STEP_NEEDS_SERVICE[step.type];
  return (
    <div className="space-y-3">
      <Field label="Step name">
        <Input value={step.name} onChange={(e) => onChange({ name: e.target.value })} />
      </Field>
      <Field label="Step type">
        <Select
          value={step.type}
          onValueChange={(v) => {
            const nextType = v as StepType;
            const nextNeeds = STEP_NEEDS_SERVICE[nextType];
            const allowed = providerOptionsFor(nextType);
            const keepProvider = step.provider && allowed.includes(step.provider);
            const io = STEP_IO_FIELDS[nextType];
            onChange({
              type: nextType,
              provider: nextNeeds ? (keepProvider ? step.provider : undefined) : "None",
              modelOrService: nextNeeds
                ? (keepProvider ? step.modelOrService : "")
                : "No service required",
              inputSource: io.input ? step.inputSource : "",
              outputType: io.output ? step.outputType : "",
            });
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {NODE_TYPES.map((n) => (
              <SelectItem key={n.type} value={n.type}>{n.type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Description">
        <Textarea rows={2} value={step.description} onChange={(e) => onChange({ description: e.target.value })} />
      </Field>

      {needsService ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label={STEP_USES_AI_MODEL[step.type] ? "AI model provider" : "Service provider"}>
            <Select
              value={step.provider ?? ""}
              onValueChange={(v) => {
                const provider = v as ProviderName;
                const firstModel = PROVIDER_MODELS[provider]?.[0] ?? "";
                onChange({ provider, modelOrService: firstModel });
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={STEP_USES_AI_MODEL[step.type] ? "Select AI provider" : "Select service provider"}
                />
              </SelectTrigger>
              <SelectContent>
                {providerOptionsFor(step.type).map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={STEP_USES_AI_MODEL[step.type] ? "AI model" : "Service"}>
            <Select
              value={step.modelOrService}
              onValueChange={(v) => onChange({ modelOrService: v })}
              disabled={!step.provider}
            >
              <SelectTrigger>
                <SelectValue placeholder={step.provider ? (STEP_USES_AI_MODEL[step.type] ? "Select model" : "Select service") : "Pick provider first"} />
              </SelectTrigger>
              <SelectContent>
                {(step.provider ? PROVIDER_MODELS[step.provider] : []).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3 text-[11px] text-muted-foreground">
          This step type does not require a provider or model/service.
        </div>
      )}

      {(() => {
        const io = STEP_IO_FIELDS[step.type];
        if (!io.input && !io.output) return null;
        return (
          <div className={cn("grid gap-2", io.input && io.output ? "grid-cols-2" : "grid-cols-1")}>
            {io.input && (
              <Field label="Input source">
                <Input value={step.inputSource} onChange={(e) => onChange({ inputSource: e.target.value })} />
              </Field>
            )}
            {io.output && (
              <Field label="Output type">
                <Input value={step.outputType} onChange={(e) => onChange({ outputType: e.target.value })} />
              </Field>
            )}
          </div>
        );
      })()}

      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] font-medium text-foreground">Suggested test dimensions</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {meta.suggestedDimensions.map((d) => (
            <Badge key={d} variant="outline" className="rounded-full text-[10px]">{d}</Badge>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground">
          Auto-suggested based on node type. Adjust dimensions later in step 5.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

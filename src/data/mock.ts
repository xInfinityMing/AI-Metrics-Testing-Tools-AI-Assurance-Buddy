export type Status = "Pass" | "Conditional Pass" | "Fail" | "Draft" | "Running";
export type RiskLevel = "Low" | "Medium" | "High";
export type StepType =
  | "User Input"
  | "Retrieval / Knowledge Base"
  | "LLM / Model Call"
  | "Tool / API Call"
  | "Guardrail / Validation"
  | "Post-processing / Rules"
  | "Final Response"
  | "Monitoring / Drift";

export type ProviderName = "OpenAI" | "Anthropic" | "Ollama" | "Bedrock" | "Internal API" | "Internal Service" | "None";

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  description: string;
  provider?: ProviderName;
  modelOrService: string;
  inputSource: string;
  outputType: string;
  includeInTesting: boolean;
  notes?: string;
}

// Provider → available models/services mapping
export const PROVIDER_MODELS: Record<ProviderName, string[]> = {
  OpenAI: ["GPT-4.1", "GPT-4o", "GPT-3.5 Turbo"],
  Anthropic: ["Claude 3.7", "Claude 3.5 Sonnet", "Claude 3 Haiku"],
  Ollama: ["Llama 3.1", "DeepSeek R1", "Mistral 7B"],
  Bedrock: ["Titan Text", "Claude 3 (Bedrock)", "Llama 3 (Bedrock)"],
  "Internal API": ["Custom Internal Model", "Internal Retriever", "Policy Rules Engine"],
  "Internal Service": ["Internal Guardrail", "Compliance Guardrail", "Evidently AI Monitoring"],
  None: ["No service required"],
};

export interface ModelCard {
  id: string;
  provider: "OpenAI" | "Anthropic" | "Ollama" | "Bedrock" | "Internal API";
  modelName: string;
  purpose: string;
  role: "Primary" | "Fallback";
  endpointLabel?: string;
}

export interface DataSource {
  id: string;
  type:
    | "Prompt Set"
    | "Benchmark Dataset"
    | "RAG Dataset"
    | "Retrieval Context / Knowledge Base"
    | "Reference Dataset"
    | "Current Dataset";
  fileName?: string;
  status: "Empty" | "Uploaded";
  rowCount?: number;
  uploadedAt?: string;
}

export interface MetricResult {
  name: string;
  score: number; // 0-100
  threshold: number;
  status: "pass" | "warn" | "fail";
  explanation: string;
  suggestedAction: string;
}

export interface DimensionResult {
  key: "safety" | "quality" | "grounding" | "workflow" | "drift";
  label: string;
  score: number;
  status: "pass" | "warn" | "fail";
  metrics: MetricResult[];
}

export interface RunRecord {
  id: string;
  startedAt: string;
  durationSec: number;
  overallScore: number;
  status: Status;
}

export interface Project {
  id: string;
  name: string;
  useCase: string;
  description: string;
  mode: "structured" | "api";
  status: Status;
  riskLevel: RiskLevel;
  overallScore: number;
  lastRun: string;
  workflow: WorkflowStep[];
  models: ModelCard[];
  dataSources: DataSource[];
  selectedDimensions: string[]; // metric keys
  runs: RunRecord[];
  results?: DimensionResult[];
  trend: { run: string; score: number }[];
}

export interface DriftAlert {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  detectedAt: string;
  affectedFeatures: string[];
  recommendation: string;
}

export interface ReportRecord {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  status: Status;
  summary: string;
}

export const PROVIDERS = ["OpenAI", "Anthropic", "Ollama", "Bedrock", "Internal API"] as const;
export const MODELS = ["GPT-4.1", "Claude 3.7", "Llama 3.1", "DeepSeek R1", "Custom Internal Model"] as const;

export const DIMENSION_GROUPS = [
  {
    key: "safety",
    label: "Safety",
    poweredBy: "GARAK (future integration)",
    metrics: [
      { id: "jailbreak", label: "Jailbreak resistance" },
      { id: "prompt_injection", label: "Prompt injection resistance" },
      { id: "toxicity", label: "Toxicity" },
      { id: "data_leakage", label: "Data leakage / PII exposure" },
    ],
  },
  {
    key: "quality",
    label: "Quality",
    poweredBy: "HELM (future integration)",
    metrics: [
      { id: "accuracy", label: "Accuracy" },
      { id: "robustness", label: "Robustness" },
      { id: "calibration", label: "Calibration" },
      { id: "fairness", label: "Fairness / bias" },
    ],
  },
  {
    key: "grounding",
    label: "Grounding / RAG",
    poweredBy: "DeepEval (future integration)",
    metrics: [
      { id: "faithfulness", label: "Faithfulness" },
      { id: "answer_relevancy", label: "Answer relevancy" },
      { id: "contextual_recall", label: "Contextual recall" },
      { id: "contextual_precision", label: "Contextual precision" },
    ],
  },
  {
    key: "drift",
    label: "Drift / Monitoring",
    poweredBy: "Evidently AI (future integration)",
    metrics: [
      { id: "input_drift", label: "Input data drift (PSI)" },
      { id: "output_drift", label: "Output / prediction drift (KS test)" },
      { id: "embedding_drift", label: "Embedding drift (Wasserstein)" },
      { id: "retrieval_drift", label: "Retrieval distribution drift" },
    ],
  },
] as const;

export const DEFAULT_WORKFLOW: WorkflowStep[] = [
  {
    id: "s1",
    name: "User asks question",
    type: "User Input",
    description: "Captures the natural language query from the user.",
    provider: "None",
    modelOrService: "No service required",
    inputSource: "End user",
    outputType: "Text",
    includeInTesting: true,
  },
  {
    id: "s2",
    name: "Retrieve knowledge base context",
    type: "Retrieval / Knowledge Base",
    description: "Hybrid search across internal docs and policies.",
    provider: "Internal API",
    modelOrService: "Internal Retriever",
    inputSource: "User query",
    outputType: "Context chunks",
    includeInTesting: true,
  },
  {
    id: "s3",
    name: "LLM generates answer",
    type: "LLM / Model Call",
    description: "Primary model synthesizes a grounded answer.",
    provider: "OpenAI",
    modelOrService: "GPT-4.1",
    inputSource: "Query + context",
    outputType: "Text",
    includeInTesting: true,
  },
  {
    id: "s4",
    name: "Guardrail validates response",
    type: "Guardrail / Validation",
    description: "Toxicity, PII and policy compliance checks.",
    provider: "Internal Service",
    modelOrService: "Internal Guardrail",
    inputSource: "LLM output",
    outputType: "Validated text",
    includeInTesting: true,
  },
  {
    id: "s5",
    name: "Final response returned",
    type: "Final Response",
    description: "Streamed response back to the user with citations.",
    provider: "None",
    modelOrService: "No service required",
    inputSource: "Validated text",
    outputType: "Text + citations",
    includeInTesting: false,
  },
];

const SAMPLE_MODELS: ModelCard[] = [
  {
    id: "m1",
    provider: "OpenAI",
    modelName: "GPT-4.1",
    purpose: "Primary answer generation",
    role: "Primary",
    endpointLabel: "openai/gpt-4.1",
  },
  {
    id: "m2",
    provider: "Anthropic",
    modelName: "Claude 3.7",
    purpose: "Fallback reasoning",
    role: "Fallback",
    endpointLabel: "anthropic/claude-3.7",
  },
  {
    id: "m3",
    provider: "Internal API",
    modelName: "Custom Internal Model",
    purpose: "Guardrail + classification",
    role: "Primary",
  },
];

const SAMPLE_DATA_SOURCES: DataSource[] = [
  { id: "d1", type: "Prompt Set", status: "Uploaded", fileName: "prompts_v3.csv", rowCount: 1240, uploadedAt: "2025-04-12 09:14" },
  { id: "d2", type: "Benchmark Dataset", status: "Uploaded", fileName: "mmlu_subset.json", rowCount: 800, uploadedAt: "2025-04-10 16:02" },
  { id: "d3", type: "RAG Dataset", status: "Uploaded", fileName: "rag_eval.jsonl", rowCount: 540, uploadedAt: "2025-04-11 11:48" },
  { id: "d4", type: "Retrieval Context / Knowledge Base", status: "Uploaded", fileName: "policies_kb.zip", rowCount: 12400, uploadedAt: "2025-03-28 08:30" },
  { id: "d5", type: "Reference Dataset", status: "Empty" },
  { id: "d6", type: "Current Dataset", status: "Uploaded", fileName: "prod_traces_apr.jsonl", rowCount: 5821, uploadedAt: "2025-04-18 22:10" },
];

const ALL_METRIC_IDS = DIMENSION_GROUPS.flatMap((g) => g.metrics.map((m) => `${g.key}.${m.id}`));

function buildResults(seed: number): DimensionResult[] {
  const rng = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 31) * 10000;
    return x - Math.floor(x);
  };
  return DIMENSION_GROUPS.map((g, gi) => {
    const metrics: MetricResult[] = g.metrics.map((m, mi) => {
      const score = Math.round(45 + rng(gi * 10 + mi) * 55);
      const threshold = 70;
      const status: MetricResult["status"] = score >= threshold ? "pass" : score >= 55 ? "warn" : "fail";
      return {
        name: m.label,
        score,
        threshold,
        status,
        explanation:
          status === "pass"
            ? `${m.label} performance is within acceptable range across the evaluation set.`
            : status === "warn"
            ? `${m.label} shows borderline performance with intermittent regressions on edge cases.`
            : `${m.label} is below the acceptable threshold and requires attention before release.`,
        suggestedAction: suggestedActionFor(g.key, m.id, status),
      };
    });
    const avg = Math.round(metrics.reduce((a, b) => a + b.score, 0) / metrics.length);
    const status: DimensionResult["status"] = avg >= 75 ? "pass" : avg >= 60 ? "warn" : "fail";
    return { key: g.key as DimensionResult["key"], label: g.label, score: avg, status, metrics };
  });
}

function suggestedActionFor(group: string, metric: string, status: MetricResult["status"]): string {
  if (status === "pass") return "No action required. Continue monitoring next run.";
  const map: Record<string, string> = {
    safety: "Strengthen guardrail prompts and expand red-team coverage.",
    quality: "Update benchmark dataset and review prompt templates.",
    grounding: "Review retrieval context quality and chunking strategy.",
    workflow: "Reduce fallback dependency and add retry budget.",
    drift: "Investigate drifted inputs and refresh reference dataset.",
  };
  return map[group] ?? "Investigate the root cause and re-run evaluation.";
}

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Internal Knowledge Assistant",
    useCase: "Employee Q&A over internal docs",
    description: "RAG assistant that answers employee questions from internal HR, IT and policy documents.",
    mode: "structured",
    status: "Pass",
    riskLevel: "Low",
    overallScore: 88,
    lastRun: "2025-04-19 14:22",
    workflow: DEFAULT_WORKFLOW,
    models: SAMPLE_MODELS,
    dataSources: SAMPLE_DATA_SOURCES,
    selectedDimensions: ALL_METRIC_IDS,
    runs: [
      { id: "r1", startedAt: "2025-04-19 14:22", durationSec: 412, overallScore: 88, status: "Pass" },
      { id: "r0", startedAt: "2025-04-12 10:05", durationSec: 388, overallScore: 84, status: "Pass" },
    ],
    results: buildResults(1),
    trend: [
      { run: "Run -4", score: 78 },
      { run: "Run -3", score: 82 },
      { run: "Run -2", score: 84 },
      { run: "Run -1", score: 85 },
      { run: "Latest", score: 88 },
    ],
  },
  {
    id: "p2",
    name: "Policy Q&A Bot",
    useCase: "Compliance-grade policy answers",
    description: "Customer-facing chatbot that answers regulatory and policy questions with citations.",
    mode: "structured",
    status: "Conditional Pass",
    riskLevel: "Medium",
    overallScore: 72,
    lastRun: "2025-04-18 09:51",
    workflow: DEFAULT_WORKFLOW,
    models: SAMPLE_MODELS,
    dataSources: SAMPLE_DATA_SOURCES,
    selectedDimensions: ALL_METRIC_IDS,
    runs: [
      { id: "r2", startedAt: "2025-04-18 09:51", durationSec: 502, overallScore: 72, status: "Conditional Pass" },
    ],
    results: buildResults(7),
    trend: [
      { run: "Run -4", score: 68 },
      { run: "Run -3", score: 70 },
      { run: "Run -2", score: 71 },
      { run: "Run -1", score: 69 },
      { run: "Latest", score: 72 },
    ],
  },
  {
    id: "p3",
    name: "Customer Service Copilot",
    useCase: "Agent assist for support tickets",
    description: "Suggests responses and next-best-action for support agents handling customer tickets.",
    mode: "structured",
    status: "Fail",
    riskLevel: "High",
    overallScore: 54,
    lastRun: "2025-04-17 18:33",
    workflow: DEFAULT_WORKFLOW,
    models: SAMPLE_MODELS,
    dataSources: SAMPLE_DATA_SOURCES,
    selectedDimensions: ALL_METRIC_IDS,
    runs: [
      { id: "r3", startedAt: "2025-04-17 18:33", durationSec: 611, overallScore: 54, status: "Fail" },
    ],
    results: buildResults(13),
    trend: [
      { run: "Run -4", score: 62 },
      { run: "Run -3", score: 60 },
      { run: "Run -2", score: 58 },
      { run: "Run -1", score: 55 },
      { run: "Latest", score: 54 },
    ],
  },
];

export const REPORTS: ReportRecord[] = [
  {
    id: "rep1",
    projectId: "p1",
    title: "Internal Knowledge Assistant — April Assurance Report",
    createdAt: "2025-04-19 14:32",
    status: "Pass",
    summary:
      "All five assurance dimensions passed. Minor warning on contextual precision; overall release-ready.",
  },
  {
    id: "rep2",
    projectId: "p2",
    title: "Policy Q&A Bot — Pre-launch Assurance Report",
    createdAt: "2025-04-18 10:14",
    status: "Conditional Pass",
    summary:
      "Conditional pass. Faithfulness and prompt injection resistance need remediation before production rollout.",
  },
];

export const DRIFT_ALERTS: DriftAlert[] = [
  {
    id: "a1",
    projectId: "p2",
    projectName: "Policy Q&A Bot",
    title: "Retrieval context drift detected",
    severity: "High",
    detectedAt: "2025-04-19 03:14",
    affectedFeatures: ["policy_section_id", "doc_recency", "embedding_distribution"],
    recommendation: "Refresh retrieval index and re-run grounding evaluation.",
  },
  {
    id: "a2",
    projectId: "p3",
    projectName: "Customer Service Copilot",
    title: "Input distribution shifted",
    severity: "Medium",
    detectedAt: "2025-04-18 21:02",
    affectedFeatures: ["ticket_category", "language_mix"],
    recommendation: "Update reference dataset to include new ticket categories.",
  },
  {
    id: "a3",
    projectId: "p1",
    projectName: "Internal Knowledge Assistant",
    title: "Quality score trending down",
    severity: "Low",
    detectedAt: "2025-04-17 12:40",
    affectedFeatures: ["benchmark_score"],
    recommendation: "Monitor next two runs; investigate if trend continues.",
  },
];

export const RUN_PHASES = [
  "Validating configuration",
  "Preparing datasets",
  "Running safety checks",
  "Running quality checks",
  "Running grounding checks",
  "Running workflow checks",
  "Running drift checks",
  "Aggregating results",
  "Generating report",
] as const;

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getReport(id: string): ReportRecord | undefined {
  return REPORTS.find((r) => r.id === id);
}

export { buildResults };

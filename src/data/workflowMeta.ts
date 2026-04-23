import {
  MessageSquare, Database, Brain, Wrench, ShieldCheck, Sparkles, Send, Activity,
  type LucideIcon,
} from "lucide-react";
import type { StepType, WorkflowStep } from "@/data/mock";

export interface NodeTypeMeta {
  type: StepType;
  icon: LucideIcon;
  short: string;
  tone: string; // tailwind classes for chip
  suggestedDimensions: string[];
}

export const NODE_TYPES: NodeTypeMeta[] = [
  {
    type: "User Input",
    icon: MessageSquare,
    short: "Capture user query",
    tone: "bg-info-soft text-info border-info/20",
    suggestedDimensions: ["Input", "Workflow"],
  },
  {
    type: "Retrieval / Knowledge Base",
    icon: Database,
    short: "Fetch grounding context",
    tone: "bg-primary-soft text-primary border-primary/20",
    suggestedDimensions: ["Grounding / RAG"],
  },
  {
    type: "LLM / Model Call",
    icon: Brain,
    short: "Generate model response",
    tone: "bg-accent text-accent-foreground border-primary/20",
    suggestedDimensions: ["Safety", "Quality"],
  },
  {
    type: "Tool / API Call",
    icon: Wrench,
    short: "Invoke external service",
    tone: "bg-warning-soft text-warning border-warning/20",
    suggestedDimensions: ["Workflow", "Reliability"],
  },
  {
    type: "Guardrail / Validation",
    icon: ShieldCheck,
    short: "Policy & safety checks",
    tone: "bg-success-soft text-success border-success/20",
    suggestedDimensions: ["Safety"],
  },
  {
    type: "Post-processing / Rules",
    icon: Sparkles,
    short: "Apply rules & formatting",
    tone: "bg-muted text-muted-foreground border-border",
    suggestedDimensions: ["Workflow"],
  },
  {
    type: "Final Response",
    icon: Send,
    short: "Return to user",
    tone: "bg-primary-soft text-primary border-primary/20",
    suggestedDimensions: ["Quality", "Grounding"],
  },
  {
    type: "Monitoring / Drift",
    icon: Activity,
    short: "Observe drift & quality",
    tone: "bg-danger-soft text-danger border-danger/20",
    suggestedDimensions: ["Drift", "Monitoring"],
  },
];

export function metaFor(type: StepType): NodeTypeMeta {
  return NODE_TYPES.find((n) => n.type === type) ?? NODE_TYPES[0];
}

export interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  steps: Omit<WorkflowStep, "id">[];
}

export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: "chatbot",
    name: "Chatbot",
    description: "Simple conversational assistant with safety guardrail.",
    steps: [
      { name: "User asks question", type: "User Input", description: "Captures the user message.", provider: "None", modelOrService: "No service required", inputSource: "End user", outputType: "Text", includeInTesting: true },
      { name: "LLM generates reply", type: "LLM / Model Call", description: "Generates a conversational response.", provider: "OpenAI", modelOrService: "GPT-4.1", inputSource: "User message", outputType: "Text", includeInTesting: true },
      { name: "Guardrail validates response", type: "Guardrail / Validation", description: "Toxicity & policy checks.", provider: "Internal Service", modelOrService: "Internal Guardrail", inputSource: "LLM output", outputType: "Validated text", includeInTesting: true },
      { name: "Final response returned", type: "Final Response", description: "Send response to user.", provider: "None", modelOrService: "No service required", inputSource: "Validated text", outputType: "Text", includeInTesting: false },
    ],
  },
  {
    id: "rag",
    name: "RAG Assistant",
    description: "Retrieval-augmented assistant grounded in internal docs.",
    steps: [
      { name: "User asks question", type: "User Input", description: "Captures the natural language query.", provider: "None", modelOrService: "No service required", inputSource: "End user", outputType: "Text", includeInTesting: true },
      { name: "Retrieve knowledge base context", type: "Retrieval / Knowledge Base", description: "Hybrid search over internal docs.", provider: "Internal API", modelOrService: "Internal Retriever", inputSource: "User query", outputType: "Context chunks", includeInTesting: true },
      { name: "LLM generates answer", type: "LLM / Model Call", description: "Synthesizes a grounded answer with citations.", provider: "OpenAI", modelOrService: "GPT-4.1", inputSource: "Query + context", outputType: "Text", includeInTesting: true },
      { name: "Guardrail validates response", type: "Guardrail / Validation", description: "Toxicity, PII and grounding checks.", provider: "Internal Service", modelOrService: "Internal Guardrail", inputSource: "LLM output", outputType: "Validated text", includeInTesting: true },
      { name: "Final response returned", type: "Final Response", description: "Stream the response with citations.", provider: "None", modelOrService: "No service required", inputSource: "Validated text", outputType: "Text + citations", includeInTesting: false },
    ],
  },
  {
    id: "policy",
    name: "Policy Q&A Bot",
    description: "Compliance-grade policy answers with strict guardrails.",
    steps: [
      { name: "User asks policy question", type: "User Input", description: "Customer policy query.", provider: "None", modelOrService: "No service required", inputSource: "End user", outputType: "Text", includeInTesting: true },
      { name: "Retrieve policy context", type: "Retrieval / Knowledge Base", description: "Search policy knowledge base.", provider: "Internal API", modelOrService: "Internal Retriever", inputSource: "User query", outputType: "Policy chunks", includeInTesting: true },
      { name: "LLM drafts answer", type: "LLM / Model Call", description: "Drafts a grounded policy answer.", provider: "Anthropic", modelOrService: "Claude 3.7", inputSource: "Query + policy", outputType: "Text", includeInTesting: true },
      { name: "Compliance guardrail", type: "Guardrail / Validation", description: "Compliance and tone validation.", provider: "Internal Service", modelOrService: "Compliance Guardrail", inputSource: "Draft answer", outputType: "Validated text", includeInTesting: true },
      { name: "Post-processing rules", type: "Post-processing / Rules", description: "Apply legal disclaimers.", provider: "Internal API", modelOrService: "Policy Rules Engine", inputSource: "Validated text", outputType: "Text", includeInTesting: true },
      { name: "Final response returned", type: "Final Response", description: "Return final answer.", provider: "None", modelOrService: "No service required", inputSource: "Final text", outputType: "Text + citations", includeInTesting: false },
    ],
  },
  {
    id: "support",
    name: "Customer Support Copilot",
    description: "Agent-assist with tool calls and fallback model.",
    steps: [
      { name: "Agent loads ticket", type: "User Input", description: "Support ticket context.", provider: "None", modelOrService: "No service required", inputSource: "Ticket system", outputType: "Structured", includeInTesting: true },
      { name: "Lookup customer data", type: "Tool / API Call", description: "CRM tool call.", provider: "Internal API", modelOrService: "Custom Internal Model", inputSource: "Customer ID", outputType: "Customer record", includeInTesting: true },
      { name: "LLM suggests reply", type: "LLM / Model Call", description: "Suggests next-best-action.", provider: "OpenAI", modelOrService: "GPT-4.1", inputSource: "Ticket + record", outputType: "Suggested reply", includeInTesting: true },
      { name: "Guardrail validates suggestion", type: "Guardrail / Validation", description: "Tone and policy checks.", provider: "Internal Service", modelOrService: "Internal Guardrail", inputSource: "Suggested reply", outputType: "Validated text", includeInTesting: true },
      { name: "Final suggestion to agent", type: "Final Response", description: "Render suggestion in agent UI.", provider: "None", modelOrService: "No service required", inputSource: "Validated text", outputType: "Text", includeInTesting: false },
    ],
  },
];

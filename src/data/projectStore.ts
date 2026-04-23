import { useSyncExternalStore } from "react";
import {
  PROJECTS as SEED_PROJECTS,
  REPORTS as SEED_REPORTS,
  buildResults,
  type Project,
  type ReportRecord,
  type RunRecord,
  type Status,
  type RiskLevel,
} from "./mock";

const STORAGE_KEY = "aab.projects.v1";
const REPORTS_KEY = "aab.reports.v1";

type State = {
  projects: Project[];
  reports: ReportRecord[];
};

function load(): State {
  if (typeof window === "undefined") {
    return { projects: SEED_PROJECTS, reports: SEED_REPORTS };
  }
  try {
    const p = localStorage.getItem(STORAGE_KEY);
    const r = localStorage.getItem(REPORTS_KEY);
    return {
      projects: p ? (JSON.parse(p) as Project[]) : SEED_PROJECTS,
      reports: r ? (JSON.parse(r) as ReportRecord[]) : SEED_REPORTS,
    };
  } catch {
    return { projects: SEED_PROJECTS, reports: SEED_REPORTS };
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProjects(): Project[] {
  return useSyncExternalStore(
    subscribe,
    () => state.projects,
    () => state.projects,
  );
}

export function useReports(): ReportRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => state.reports,
    () => state.reports,
  );
}

export function useProject(id: string): Project | undefined {
  const projects = useProjects();
  return projects.find((p) => p.id === id);
}

export function getProjectById(id: string): Project | undefined {
  return state.projects.find((p) => p.id === id);
}

export function getReportById(id: string): ReportRecord | undefined {
  return state.reports.find((r) => r.id === id);
}

export function getAllProjects(): Project[] {
  return state.projects;
}

export function getAllReports(): ReportRecord[] {
  return state.reports;
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function genId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export function createProject(input: Omit<Project, "id" | "status" | "riskLevel" | "overallScore" | "lastRun" | "runs" | "results" | "trend"> & {
  status?: Status;
  riskLevel?: RiskLevel;
}): Project {
  const id = genId("p");
  const project: Project = {
    id,
    status: input.status ?? "Draft",
    riskLevel: input.riskLevel ?? "Low",
    overallScore: 0,
    lastRun: "—",
    runs: [],
    results: undefined,
    trend: [
      { run: "Run -4", score: 0 },
      { run: "Run -3", score: 0 },
      { run: "Run -2", score: 0 },
      { run: "Run -1", score: 0 },
      { run: "Latest", score: 0 },
    ],
    ...input,
  };
  state = { ...state, projects: [project, ...state.projects] };
  emit();
  return project;
}

export function recordRunForProject(id: string): Project | undefined {
  const project = state.projects.find((p) => p.id === id);
  if (!project) return undefined;
  const seed = Math.floor(Math.random() * 1000) + 1;
  const results = buildResults(seed);
  const overall = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
  const status: Status = overall >= 80 ? "Pass" : overall >= 65 ? "Conditional Pass" : "Fail";
  const risk: RiskLevel = overall >= 80 ? "Low" : overall >= 65 ? "Medium" : "High";
  const run: RunRecord = {
    id: genId("r"),
    startedAt: nowStamp(),
    durationSec: 380 + Math.floor(Math.random() * 240),
    overallScore: overall,
    status,
  };
  const updated: Project = {
    ...project,
    status,
    riskLevel: risk,
    overallScore: overall,
    lastRun: run.startedAt,
    runs: [run, ...project.runs],
    results,
    trend: [
      ...project.trend.slice(1, 5).map((t, i) => ({ run: `Run -${4 - i}`, score: t.score || overall - 6 + i * 2 })),
      { run: "Latest", score: overall },
    ],
  };
  const report: ReportRecord = {
    id: genId("rep"),
    projectId: project.id,
    title: `${project.name} — Assurance Report`,
    createdAt: nowStamp(),
    status,
    summary:
      status === "Pass"
        ? "All assurance dimensions passed. System is release-ready."
        : status === "Conditional Pass"
        ? "Conditional pass. Address flagged dimensions before production rollout."
        : "Failed evaluation. Multiple dimensions require remediation before release.",
  };
  state = {
    projects: state.projects.map((p) => (p.id === id ? updated : p)),
    reports: [report, ...state.reports],
  };
  emit();
  return updated;
}

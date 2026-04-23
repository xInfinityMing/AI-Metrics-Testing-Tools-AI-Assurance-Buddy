import {
  DRIFT_ALERTS,
  DIMENSION_GROUPS,
  type DriftAlert,
  type Project,
  type DataSource,
} from "@/data/mock";

// Drift monitoring is enabled when the project selected ANY drift dimension
// during the Test Dimensions step of the wizard (not by adding a workflow node).
export function isMonitored(p: Project): boolean {
  return p.selectedDimensions?.some((k) => k.startsWith("drift.")) ?? false;
}

// Data sources required by Evidently AI to compute drift.
export const DRIFT_REQUIRED_SOURCES: DataSource["type"][] = [
  "Reference Dataset",
  "Current Dataset",
];

// Returns the drift metric labels the project actually selected.
export function selectedDriftMetrics(p: Project): string[] {
  const driftGroup = DIMENSION_GROUPS.find((g) => g.key === "drift");
  if (!driftGroup) return [];
  return driftGroup.metrics
    .filter((m) => p.selectedDimensions.includes(`drift.${m.id}`))
    .map((m) => m.label);
}

// Check which required drift data sources are missing for this project.
export function missingDriftSources(p: Project): DataSource["type"][] {
  return DRIFT_REQUIRED_SOURCES.filter(
    (t) => !p.dataSources?.find((d) => d.type === t && d.status === "Uploaded"),
  );
}

// Derive a sensible drift alert for a monitored project that doesn't have a
// seeded alert yet, so newly created projects show up immediately.
export function syntheticAlert(p: Project): DriftAlert {
  const metrics = selectedDriftMetrics(p);
  const missing = missingDriftSources(p);

  const severity: DriftAlert["severity"] =
    missing.length > 0
      ? "Medium"
      : p.riskLevel === "High"
      ? "High"
      : p.riskLevel === "Medium"
      ? "Medium"
      : "Low";

  return {
    id: `auto-${p.id}`,
    projectId: p.id,
    projectName: p.name,
    title:
      missing.length > 0
        ? `Drift baseline incomplete for ${p.name}`
        : `Drift watch active on ${p.name}`,
    severity,
    detectedAt: p.lastRun && p.lastRun !== "—" ? p.lastRun : "Awaiting first run",
    affectedFeatures:
      metrics.length > 0 ? metrics : ["Input drift (PSI)", "Output drift (KS test)"],
    recommendation:
      missing.length > 0
        ? `Upload ${missing.join(" and ")} so Evidently AI can compute drift against a baseline.`
        : p.runs.length === 0
        ? "Run a mock evaluation to establish a baseline distribution from the Reference Dataset."
        : "Compare next run against current baseline; promote a new baseline if quality holds.",
  };
}

// Compute the same alert list both Monitoring and Dashboard rely on, so the
// "Drift Alerts" stat and the Monitoring page never disagree.
export function computeAllDriftAlerts(projects: Project[]): DriftAlert[] {
  const monitored = projects.filter(isMonitored);
  return monitored.flatMap((p) => {
    const seeded = DRIFT_ALERTS.filter((a) => a.projectId === p.id);
    return seeded.length > 0 ? seeded : [syntheticAlert(p)];
  });
}

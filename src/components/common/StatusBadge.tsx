import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel, Status } from "@/data/mock";
import { CheckCircle2, AlertTriangle, XCircle, FileEdit, Loader2 } from "lucide-react";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const map: Record<Status, { cls: string; Icon: typeof CheckCircle2 }> = {
    Pass: { cls: "bg-success-soft text-success border-success/20", Icon: CheckCircle2 },
    "Conditional Pass": { cls: "bg-warning-soft text-warning border-warning/20", Icon: AlertTriangle },
    Fail: { cls: "bg-danger-soft text-danger border-danger/20", Icon: XCircle },
    Draft: { cls: "bg-muted text-muted-foreground border-border", Icon: FileEdit },
    Running: { cls: "bg-info-soft text-info border-info/20", Icon: Loader2 },
  };
  const { cls, Icon } = map[status];
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full border px-2 py-0.5 font-medium", cls, className)}>
      <Icon className={cn("h-3 w-3", status === "Running" && "animate-spin")} />
      {status}
    </Badge>
  );
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const map: Record<RiskLevel, string> = {
    Low: "bg-success-soft text-success border-success/20",
    Medium: "bg-warning-soft text-warning border-warning/20",
    High: "bg-danger-soft text-danger border-danger/20",
  };
  return (
    <Badge variant="outline" className={cn("rounded-full border px-2 py-0.5 font-medium", map[level], className)}>
      {level} risk
    </Badge>
  );
}

export function MetricStatusChip({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: { cls: "bg-success-soft text-success border-success/20", label: "Pass" },
    warn: { cls: "bg-warning-soft text-warning border-warning/20", label: "Warning" },
    fail: { cls: "bg-danger-soft text-danger border-danger/20", label: "Fail" },
  } as const;
  const m = map[status];
  return (
    <Badge variant="outline" className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", m.cls)}>
      {m.label}
    </Badge>
  );
}

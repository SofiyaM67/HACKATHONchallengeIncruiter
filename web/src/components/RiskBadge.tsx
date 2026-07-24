import type { RiskLevel } from "../shared/types";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const cls =
    level === "high" ? "badge badge-high" : level === "suspicious" ? "badge badge-suspicious" : "badge badge-clean";
  const label = level === "high" ? "High risk" : level === "suspicious" ? "Suspicious" : "Clean";
  return <span className={cls}>{label}</span>;
}

export type Stage = "identified" | "applied" | "replied" | "call_scheduled" | "proposal_sent" | "won" | "lost";
export type Platform = "malt" | "upwork" | "direct";
export type RateType = "fixed" | "daily" | "hourly";
export type Outcome = "won" | "lost" | "ghosted";

export const MONTHLY_GOAL_EUR = 0; // configure to your monthly revenue target

export const STAGES: { key: Stage; label: string; color: string; prob: number }[] = [
  { key: "identified",     label: "Identificada",       color: "#3f3f46", prob: 0.00 },
  { key: "applied",        label: "Candidatura enviada", color: "#1e40af", prob: 0.05 },
  { key: "replied",        label: "Cliente respondeu",  color: "#0e7490", prob: 0.20 },
  { key: "call_scheduled", label: "Call marcada",       color: "#4338ca", prob: 0.40 },
  { key: "proposal_sent",  label: "Orçamento enviado",  color: "#7e22ce", prob: 0.60 },
  { key: "won",            label: "Ganho",              color: "#047857", prob: 1.00 },
  { key: "lost",            label: "Perdido",            color: "#7f1d1d", prob: 0.00 },
];

export const ACTIVE_STAGES: Stage[] = ["identified", "applied", "replied", "call_scheduled", "proposal_sent"];
export const WEIGHTED_STAGES: Stage[] = ["replied", "call_scheduled", "proposal_sent"];
export const KANBAN_STAGES: Stage[] = ["identified", "applied", "replied", "call_scheduled", "proposal_sent"];

export const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "malt", label: "Malt" },
  { key: "upwork", label: "Upwork" },
  { key: "direct", label: "Direto" },
];

export const RATE_TYPES: { key: RateType; label: string }[] = [
  { key: "fixed", label: "Preço fixo" },
  { key: "daily", label: "Diário" },
  { key: "hourly", label: "Hora" },
];

export function probabilityFor(stage: Stage): number {
  return STAGES.find((s) => s.key === stage)?.prob ?? 0;
}

export function stageColor(stage: string): string {
  return STAGES.find((s) => s.key === stage)?.color ?? "#3f3f46";
}

export function stageLabel(stage: string): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}

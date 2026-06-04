export const PROJECTS = {
  unreal: { id: "unreal", name: "UNREAL Performance", color: "#3B82F6" },
  thefacio: { id: "thefacio", name: "TheFacio", color: "#10B981" },
  freelance: { id: "freelance", name: "Freelance (Malt + Upwork)", color: "#F59E0B" },
  global: { id: "global", name: "Global", color: "#71717a" },
} as const;

export type ProjectId = keyof typeof PROJECTS;
// Freelance escondido temporariamente — dados intactos, basta voltar a meter na lista para reactivar.
export const PROJECT_IDS: ProjectId[] = ["unreal", "thefacio", "global"];
export const HIDDEN_PROJECT_IDS: ProjectId[] = ["freelance"];

export const STATUS_OPTIONS = [
  "suspeito",
  "novo",
  "m1-enviada",
  "m2-enviada",
  "m3-enviada",
  "m4-enviada",
  "respondeu",
  "qualificado",
  "em-conversa",
  "reuniao-marcada",
  "proposta-enviada",
  "negociacao",
  "ganho",
  "perdido",
  "dormente",
];

export const INACTIVE_STATUSES = ["suspeito", "ganho", "perdido", "dormente"];
export const TEMP_OPTIONS = ["quente", "morno", "frio"];
// Mantido para compatibilidade — usar <TempIcon /> em vez disto.
export const TEMP_EMOJI: Record<string, string> = {
  quente: "",
  morno: "",
  frio: "",
};

export function statusColor(s: string): string {
  const map: Record<string, string> = {
    suspeito: "bg-zinc-900",
    novo: "bg-zinc-700",
    "m1-enviada": "bg-cyan-800",
    "m2-enviada": "bg-cyan-700",
    "m3-enviada": "bg-cyan-600",
    "m4-enviada": "bg-violet-700",
    respondeu: "bg-emerald-700",
    qualificado: "bg-sky-700",
    "em-conversa": "bg-blue-700",
    "reuniao-marcada": "bg-indigo-700",
    "proposta-enviada": "bg-purple-700",
    negociacao: "bg-amber-700",
    ganho: "bg-emerald-700",
    perdido: "bg-red-900",
    dormente: "bg-zinc-800",
  };
  return map[s] || "bg-zinc-700";
}

export const STATUS_HEX: Record<string, string> = {
  suspeito: "#18181b",
  novo: "#3f3f46",
  "m1-enviada": "#155e75",
  "m2-enviada": "#0e7490",
  "m3-enviada": "#0891b2",
  "m4-enviada": "#6d28d9",
  respondeu: "#047857",
  qualificado: "#0369a1",
  "em-conversa": "#1d4ed8",
  "reuniao-marcada": "#4338ca",
  "proposta-enviada": "#7e22ce",
  negociacao: "#b45309",
  ganho: "#047857",
  perdido: "#7f1d1d",
  dormente: "#27272a",
};

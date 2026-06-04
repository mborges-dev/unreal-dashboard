// Default offer per project. Quando um lead passa para um estado "engaged", se ainda
// não tiver valores definidos, aplicamos estes para o pipeline reagir imediatamente.
export const TIER_DEFAULTS: Record<string, { setup: number; monthly: number }> = {
  thefacio: { setup: 397, monthly: 127 },
  unreal: { setup: 1500, monthly: 250 },
};

// Probabilidade ponderada por estado.
export const PROB_BY_STATUS: Record<string, number> = {
  suspeito: 0,
  novo: 0.05,
  "m1-enviada": 0.05,
  "m2-enviada": 0.07,
  "m3-enviada": 0.1,
  "m4-enviada": 0.08,
  respondeu: 0.2,
  qualificado: 0.3,
  "em-conversa": 0.3,
  "reuniao-marcada": 0.45,
  "proposta-enviada": 0.6,
  negociacao: 0.75,
  ganho: 1.0,
  perdido: 0,
  dormente: 0,
};

const ENGAGED = new Set([
  "respondeu", "em-conversa", "qualificado", "reuniao-marcada",
  "proposta-enviada", "negociacao", "ganho",
]);

type LeadLike = {
  projectId: string;
  setupValue: number | null;
  monthlyValue: number | null;
  probability: number | null;
};

/**
 * Devolve um patch parcial com setupValue/monthlyValue/probability/expectedRevenue
 * actualizados de acordo com o novo estado. Não sobrescreve valores existentes.
 */
export function applyEngagementDefaults(lead: LeadLike, newStatus: string): Partial<LeadLike & { expectedRevenue: number }> {
  const out: any = {};
  let setup = lead.setupValue;
  let monthly = lead.monthlyValue;

  if (ENGAGED.has(newStatus)) {
    const tier = TIER_DEFAULTS[lead.projectId];
    if (tier) {
      if (!setup) { out.setupValue = tier.setup; setup = tier.setup; }
      if (!monthly) { out.monthlyValue = tier.monthly; monthly = tier.monthly; }
    }
  }

  const prob = PROB_BY_STATUS[newStatus];
  if (prob !== undefined) out.probability = prob;
  const effectiveProb = out.probability ?? lead.probability ?? 0;

  out.expectedRevenue = Math.round(((setup || 0) + (monthly || 0) * 12) * effectiveProb);
  return out;
}

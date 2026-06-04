export type MsgKey = "M1" | "M2" | "M3" | "M4";

export const TEMPLATES: Record<MsgKey, string> = {
  M1: `Olá! Vi o vosso restaurante no Google e fiquei com uma dúvida - têm alguém a gerir o WhatsApp ou são vocês directamente?`,
  M2: `Olá! Só a confirmar que a mensagem chegou bem. 👋`,
  M3: `Deixa-me ser directo - automatizamos o WhatsApp de restaurantes com inteligência artificial.

O bot responde a clientes 24/7, confirma reservas e responde a perguntas enquanto vocês estão ocupados com o que importa.

Configuração em 48 horas.
thefacio.com/demo`,
  M4: `Última mensagem, prometo. 🙂

Esta semana configurámos mais dois restaurantes em Lisboa - caso queiram ver como funciona antes de decidir.

thefacio.com/demo`,
};

// Days to wait after each message before sending the next
export const DELAYS: Record<MsgKey, number> = { M1: 3, M2: 3, M3: 4, M4: 0 };

// Status that becomes set after sending each message
export const STATUS_AFTER: Record<MsgKey, string> = {
  M1: "m1-enviada",
  M2: "m2-enviada",
  M3: "m3-enviada",
  M4: "m4-enviada",
};

// What message a lead is *due for* based on its current status
export const NEXT_MSG: Record<string, MsgKey | null> = {
  suspeito: "M1",
  novo: "M1",
  "m1-enviada": "M2",
  "m2-enviada": "M3",
  "m3-enviada": "M4",
  "m4-enviada": null,
};

// Escalonamento progressivo do limite para não disparar restrições do WA Business.
// 20/dia esta semana, 30 na próxima, 40 a partir de 01/06.
export function dailyLimitFor(date: Date = new Date()): number {
  if (date < new Date("2026-05-25T00:00:00")) return 20;
  if (date < new Date("2026-06-01T00:00:00")) return 30;
  return 40;
}

// Compatibilidade com código existente que importa DAILY_LIMIT como número.
// Usa o limite de hoje.
export const DAILY_LIMIT = dailyLimitFor();

/** Normalize PT mobile to E.164 without "+". Returns null if invalid or non-mobile. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const norm = digits.startsWith("351") ? digits : digits.length === 9 ? "351" + digits : digits;
  // Só telemóveis portugueses (9XX) — fixos (2XX) e outros não têm WhatsApp
  if (!norm.startsWith("3519") || norm.length !== 12) return null;
  return norm;
}

export function waLink(phone: string | null | undefined, message: string): string | null {
  const n = normalizePhone(phone);
  if (!n) return null;
  // web.whatsapp.com mirrors o telemóvel — se a app no telefone for WhatsApp Business,
  // o WhatsApp Web abre a conversa na conta Business (sem app desktop necessária).
  return `https://web.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(message)}`;
}

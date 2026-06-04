import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Hoje: 2026-05-19 (terça). Próxima segunda: 2026-05-25.
// Posts: terça + quinta de cada semana, alternando pilares para variedade.
// Pitches: 5 outlets top (fit=5) em 2-3 semanas, 1-2 por semana.
// Partners: 1 primeiro contacto por semana, 6 semanas.

function addDays(base: Date, days: number) {
  const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0); return d;
}

async function main() {
  const START = new Date("2026-05-26T09:00:00"); // primeira terça útil

  // ── 1. Distribuir 24 ideias de conteúdo ──
  // Mistura sectores: cada semana = 1 técnico + 1 autoridade alternado
  const all = await prisma.contentIdea.findMany({ orderBy: { createdAt: "asc" } });
  // Agrupar por pillar
  const pillars: Record<string, any[]> = {};
  for (const i of all) (pillars[i.pillar || "outro"] ||= []).push(i);

  // Sequência de pilares por dia (12 semanas, 2 por semana = 24 slots)
  const order = [
    "auditoria", "autoridade",      // semana 1
    "integracao", "autoridade",     // semana 2
    "distribuicao", "autoridade",   // semana 3
    "auditoria", "autoridade",      // semana 4
    "integracao", "autoridade",     // semana 5
    "distribuicao", "autoridade",   // semana 6
    "auditoria", "integracao",      // semana 7
    "distribuicao", "integracao",   // semana 8
    "auditoria", "distribuicao",    // semana 9
    "integracao", "distribuicao",   // semana 10
    "auditoria", "integracao",      // semana 11
    "distribuicao", "integracao",   // semana 12
  ];

  // Datas: terça (dia 0) e quinta (dia 2) de cada semana
  const slots: Date[] = [];
  for (let w = 0; w < 12; w++) {
    slots.push(addDays(START, w * 7 + 0)); // terça
    slots.push(addDays(START, w * 7 + 2)); // quinta
  }

  const usedIds = new Set<string>();
  for (let s = 0; s < order.length && s < slots.length; s++) {
    const pool = pillars[order[s]] || [];
    const nextIdea = pool.find((i) => !usedIds.has(i.id));
    if (!nextIdea) continue;
    usedIds.add(nextIdea.id);
    await prisma.contentIdea.update({
      where: { id: nextIdea.id },
      data: { status: "agendado", scheduledFor: slots[s] },
    });
  }
  // Sobras (ideias não agendadas) ficam em "ideia" para o user mexer
  console.log(`✓ ${usedIds.size} ideias agendadas até ${slots[slots.length - 1].toISOString().slice(0, 10)}`);

  // ── 2. Distribuir pitches top ──
  const TOP_PITCH_TOPICS: Record<string, string> = {
    "ECO": "Análise: o estado da IA empresarial em Portugal - quem está a fazer e quem ainda processa tudo manualmente",
    "Jornal Económico": "Opinião: o custo invisível do trabalho manual entre ERPs",
    "Dinheiro Vivo": "Como o Vale Digitalização Portugal 2030 está a ser (mal) usado",
    "ECO Inteligência Artificial": "RPAs falharam, LLMs mudam tudo - mas continua a faltar engenharia operacional",
    "ECO Tech": "Implementar IA em 15 dias vs 18 meses: o que muda na prática",
    "Vamos Falar de Tecnologia": "Episódio: automação operacional invisível em PMEs portuguesas",
    "Sem Padrão": "Episódio: o gap entre falar de IA e implementar IA em empresas reais",
  };

  let pitchSlot = 0;
  const PITCH_DAYS = [
    addDays(START, 0),  // terça 26/05
    addDays(START, 3),  // sexta 29/05
    addDays(START, 7),  // terça 02/06
    addDays(START, 10), // sexta 05/06
    addDays(START, 14), // terça 09/06
    addDays(START, 17), // sexta 12/06
    addDays(START, 21), // terça 16/06
  ];

  for (const [name, topic] of Object.entries(TOP_PITCH_TOPICS)) {
    const outlet = await prisma.mediaOutlet.findFirst({ where: { name: { contains: name } } });
    if (!outlet || pitchSlot >= PITCH_DAYS.length) continue;
    // Não duplicar pitches já existentes para este outlet
    const existing = await prisma.pitch.findFirst({ where: { outletId: outlet.id } });
    if (existing) { pitchSlot++; continue; }
    await prisma.pitch.create({
      data: {
        outletId: outlet.id,
        topic,
        date: PITCH_DAYS[pitchSlot],
        outcome: "em_curso",
        notes: "Auto-agendado: preparar pitch personalizado e enviar nesta data.",
      },
    });
    pitchSlot++;
  }
  console.log(`✓ ${pitchSlot} pitches agendados`);

  // ── 3. Primeiros contactos com parceiros ──
  const PARTNER_PITCH: Record<string, string> = {
    "NTT DATA Portugal": "Email inicial: parceria em projectos de automação onde o Sage/SAP é o blocker",
    "Accenture Portugal": "LinkedIn: explorar parceria em projectos de transformação documental (sub-contratação técnica)",
    "Marionete": "Email: complemento técnico para projectos onde precisam de IA + integração custom",
    "Devoteam Portugal": "LinkedIn: identificar Partner Manager + abrir conversa sobre co-delivery",
    "Noesis": "Email: explorar projectos em conjunto na vertical de finance",
    "Kaizen Institute Portugal": "Email: conversa sobre como a nossa stack acelera os projectos lean deles",
  };

  const PARTNER_DAYS = [
    addDays(START, 0),  // terça 26/05
    addDays(START, 7),  // terça 02/06
    addDays(START, 14), // terça 09/06
    addDays(START, 21), // terça 16/06
    addDays(START, 28), // terça 23/06
    addDays(START, 35), // terça 30/06
  ];

  let partnerSlot = 0;
  for (const [name, nextStep] of Object.entries(PARTNER_PITCH)) {
    const partner = await prisma.partnerCompany.findFirst({ where: { name } });
    if (!partner || partnerSlot >= PARTNER_DAYS.length) continue;
    // Se já tem interacção registada, não interferir
    const exists = await prisma.partnerInteraction.findFirst({ where: { partnerId: partner.id } });
    if (exists) { partnerSlot++; continue; }
    await prisma.partnerInteraction.create({
      data: {
        partnerId: partner.id,
        date: PARTNER_DAYS[partnerSlot],
        type: "email",
        summary: "[Auto-agendado] Primeiro contacto a fazer",
        nextStep,
        nextStepDate: PARTNER_DAYS[partnerSlot],
      },
    });
    partnerSlot++;
  }
  console.log(`✓ ${partnerSlot} contactos iniciais agendados com parceiros`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

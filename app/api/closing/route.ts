import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Estados que implicitamente indicam engagement real (lead que respondeu)
const ALWAYS_WARM = ["respondeu", "qualificado", "reuniao-marcada", "proposta-enviada", "negociacao"];
// em-conversa precisa de qualificação adicional: só conta se houve resposta inbound
const CONDITIONAL_WARM = ["em-conversa"];
const WARM_STATUSES = [...ALWAYS_WARM, ...CONDITIONAL_WARM];

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "unreal";
  const now = Date.now();
  const DAY = 86400000;

  const leadsRaw = await prisma.lead.findMany({
    where: { projectId, status: { in: WARM_STATUSES } },
    include: {
      contacts: { orderBy: { date: "desc" } },
      proposals: true,
    },
  });

  // Para 'em-conversa', exigir pelo menos uma resposta inbound — senão é só cold com 2 mensagens
  const warmLeads = leadsRaw.filter((l) => {
    if (ALWAYS_WARM.includes(l.status)) return true;
    const hasInbound = l.contacts.some((c) => c.direction === "in");
    return hasInbound;
  });

  const leads = warmLeads.map((l) => {
    const lastOut = l.contacts.find((c) => c.direction === "out");
    const lastIn = l.contacts.find((c) => c.direction === "in");
    const lastAny = l.contacts[0];
    const daysSinceLast = lastAny ? Math.floor((now - new Date(lastAny.date).getTime()) / DAY) : null;
    return {
      id: l.id,
      name: l.name,
      company: l.company,
      sector: l.sector,
      role: l.role,
      status: l.status,
      temperature: l.temperature,
      email: l.email,
      phone: l.phone,
      linkedinUrl: l.linkedinUrl,
      setupValue: l.setupValue,
      monthlyValue: l.monthlyValue,
      probability: l.probability,
      expectedRevenue: l.expectedRevenue,
      grossValue: (l.setupValue || 0) + (l.monthlyValue || 0) * 12,
      nextDate: l.nextDate,
      nextAction: l.nextAction,
      notes: l.notes,
      lastContact: lastAny ? { date: lastAny.date, direction: lastAny.direction, channel: lastAny.channel, content: lastAny.content } : null,
      lastOutDate: lastOut?.date || null,
      lastInDate: lastIn?.date || null,
      daysSinceLast,
      proposalsCount: l.proposals.length,
    };
  });

  // Sort by expectedRevenue desc (likeliest to close first)
  leads.sort((a, b) => (b.expectedRevenue || 0) - (a.expectedRevenue || 0));

  const totalWeighted = leads.reduce((s, l) => s + (l.expectedRevenue || 0), 0);
  const totalGross = leads.reduce((s, l) => s + l.grossValue, 0);
  const stale = leads.filter((l) => l.daysSinceLast != null && l.daysSinceLast > 5).length;

  return NextResponse.json({
    leads,
    summary: { count: leads.length, totalWeighted, totalGross, stale },
  });
}

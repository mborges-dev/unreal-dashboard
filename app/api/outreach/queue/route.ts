import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY = 86400000;

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "thefacio";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "40", 10);
  const now = Date.now();

  // M1: suspeitos (or novos) — prioriza Lisboa > Porto > resto
  const PRIO_CITIES = ["lisboa", "porto"];
  const m1Pool = await prisma.lead.findMany({
    where: { projectId, status: { in: ["suspeito", "novo"] }, phone: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  const m1Sorted = m1Pool.sort((a, b) => {
    const ca = (a.location || "").toLowerCase();
    const cb = (b.location || "").toLowerCase();
    const pa = PRIO_CITIES.indexOf(ca);
    const pb = PRIO_CITIES.indexOf(cb);
    const sa = pa === -1 ? 99 : pa;
    const sb = pb === -1 ? 99 : pb;
    if (sa !== sb) return sa - sb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const m1 = m1Sorted.slice(0, limit);

  // For M2/M3/M4: leads in m{n-1}-enviada whose last contact was X days ago
  const fetchDue = async (currentStatus: string, daysSince: number) => {
    const cutoff = new Date(now - daysSince * DAY);
    const candidates = await prisma.lead.findMany({
      where: { projectId, status: currentStatus, phone: { not: null } },
      include: { contacts: { orderBy: { date: "desc" }, take: 1 } },
      take: 200,
    });
    return candidates.filter((l) => {
      const last = l.contacts[0];
      if (!last) return true;
      return last.date <= cutoff;
    }).slice(0, limit);
  };

  const m2 = await fetchDue("m1-enviada", 3);
  const m3 = await fetchDue("m2-enviada", 3);
  const m4 = await fetchDue("m3-enviada", 4);

  // CONVERSAS: leads que responderam e saíram da sequência M1-M4. Precisam de chase manual.
  const conversas = await prisma.lead.findMany({
    where: {
      projectId,
      status: { in: ["respondeu", "em-conversa", "qualificado", "reuniao-marcada", "proposta-enviada", "negociacao"] },
      phone: { not: null },
    },
    include: { contacts: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  // Sent today count (for daily limit indicator)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const sentToday = await prisma.contactLog.count({
    where: {
      lead: { projectId },
      direction: "out",
      channel: "whatsapp",
      date: { gte: todayStart },
    },
  });

  return NextResponse.json({
    M1: m1.map(strip),
    M2: m2.map(strip),
    M3: m3.map(strip),
    M4: m4.map(strip),
    CONVERSAS: conversas.map(strip),
    sentToday,
  });
}

function strip(l: any) {
  return {
    id: l.id, name: l.name, company: l.company, phone: l.phone,
    location: l.location, status: l.status, notes: l.notes,
    lastContact: l.contacts?.[0]?.date || null,
  };
}

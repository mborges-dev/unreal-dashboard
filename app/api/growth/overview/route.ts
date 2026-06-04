import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const next7 = new Date(now.getTime() + 7 * 86400000);

  const [
    publishedMonth, scheduledNext7, pitchesInProgress, activePartners,
    contentLeads, partnerLeads,
    contentCounts, mediaCounts, partnerCounts,
  ] = await Promise.all([
    prisma.contentIdea.count({ where: { status: "publicado", publishedAt: { gte: monthStart } } }),
    prisma.contentIdea.count({ where: { status: "agendado", scheduledFor: { gte: now, lte: next7 } } }),
    prisma.pitch.count({ where: { OR: [{ outcome: "em_curso" }, { outcome: null }] } }),
    prisma.partnerCompany.count({ where: { status: "parceria_activa" } }),
    prisma.contentIdea.aggregate({ _sum: { leadsGenerated: true } }),
    prisma.partnerCompany.aggregate({ _sum: { leadsBrought: true } }),
    prisma.contentIdea.groupBy({ by: ["status"], _count: true }),
    prisma.mediaOutlet.groupBy({ by: ["status"], _count: true }),
    prisma.partnerCompany.groupBy({ by: ["status"], _count: true }),
  ]);

  return NextResponse.json({
    kpis: {
      publishedMonth,
      scheduledNext7,
      pitchesInProgress,
      activePartners,
      contentLeads: contentLeads._sum.leadsGenerated || 0,
      partnerLeads: partnerLeads._sum.leadsBrought || 0,
    },
    content: Object.fromEntries(contentCounts.map((c) => [c.status, c._count])),
    media: Object.fromEntries(mediaCounts.map((c) => [c.status, c._count])),
    partners: Object.fromEntries(partnerCounts.map((c) => [c.status, c._count])),
  });
}

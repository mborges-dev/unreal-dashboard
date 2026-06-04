import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + 7);

  const [posts, pitches, partnerSteps] = await Promise.all([
    prisma.contentIdea.findMany({
      where: { scheduledFor: { gte: now, lte: end }, status: "agendado" },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.pitch.findMany({
      where: { date: { gte: now, lte: end } },
      include: { outlet: true },
      orderBy: { date: "asc" },
    }),
    prisma.partnerInteraction.findMany({
      where: { nextStepDate: { gte: now, lte: end } },
      include: { partner: true },
      orderBy: { nextStepDate: "asc" },
    }),
  ]);

  // Atrasados (overdue) — antes de hoje, ainda em estado pendente
  const [postsOverdue, pitchesOverdue, partnerOverdue] = await Promise.all([
    prisma.contentIdea.findMany({
      where: { scheduledFor: { lt: now }, status: "agendado" },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.pitch.findMany({
      where: { date: { lt: now }, outcome: "em_curso" },
      include: { outlet: true },
      orderBy: { date: "asc" },
    }),
    prisma.partnerInteraction.findMany({
      where: { nextStepDate: { lt: now }, partner: { status: { in: ["a_abordar", "abordado"] } } },
      include: { partner: true },
      orderBy: { nextStepDate: "asc" },
    }),
  ]);

  return NextResponse.json({
    upcoming: {
      posts: posts.map((p) => ({ id: p.id, title: p.title, date: p.scheduledFor, pillar: p.pillar })),
      pitches: pitches.map((p) => ({ id: p.id, outletId: p.outletId, outletName: p.outlet.name, topic: p.topic, date: p.date })),
      partnerSteps: partnerSteps.map((i) => ({ id: i.id, partnerId: i.partnerId, partnerName: i.partner.name, nextStep: i.nextStep, date: i.nextStepDate })),
    },
    overdue: {
      posts: postsOverdue.map((p) => ({ id: p.id, title: p.title, date: p.scheduledFor })),
      pitches: pitchesOverdue.map((p) => ({ id: p.id, outletId: p.outletId, outletName: p.outlet.name, topic: p.topic, date: p.date })),
      partnerSteps: partnerOverdue.map((i) => ({ id: i.id, partnerId: i.partnerId, partnerName: i.partner.name, nextStep: i.nextStep, date: i.nextStepDate })),
    },
  });
}

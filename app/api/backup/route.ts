import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [projects, leads, contacts, proposals, tasks, revenues, expenses] = await Promise.all([
    prisma.project.findMany(),
    prisma.lead.findMany(),
    prisma.contactLog.findMany(),
    prisma.proposal.findMany(),
    prisma.task.findMany(),
    prisma.revenue.findMany(),
    prisma.expense.findMany(),
  ]);
  return NextResponse.json(
    { exportedAt: new Date().toISOString(), projects, leads, contacts, proposals, tasks, revenues, expenses },
    { headers: { "content-disposition": "attachment" } }
  );
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  if (Array.isArray(d.projects)) {
    for (const p of d.projects) {
      await prisma.project.upsert({ where: { id: p.id }, update: { name: p.name, color: p.color }, create: p });
    }
  }
  const reseed = async <T,>(items: T[] | undefined, fn: (x: any) => Promise<any>) => {
    if (!items) return;
    for (const it of items) {
      try { await fn(it); } catch {}
    }
  };
  await reseed(d.leads, (x) => prisma.lead.upsert({ where: { id: x.id }, update: x, create: x }));
  await reseed(d.contacts, (x) => prisma.contactLog.upsert({ where: { id: x.id }, update: x, create: x }));
  await reseed(d.proposals, (x) => prisma.proposal.upsert({ where: { id: x.id }, update: x, create: x }));
  await reseed(d.tasks, (x) => prisma.task.upsert({ where: { id: x.id }, update: x, create: x }));
  await reseed(d.revenues, (x) => prisma.revenue.upsert({ where: { id: x.id }, update: x, create: x }));
  await reseed(d.expenses, (x) => prisma.expense.upsert({ where: { id: x.id }, update: x, create: x }));
  return NextResponse.json({ ok: true });
}

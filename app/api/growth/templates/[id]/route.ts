import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const d = await req.json();
  return NextResponse.json(await prisma.contentTemplate.update({ where: { id: params.id }, data: d }));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contentTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// POST = increment timesUsed (chamado quando uma idea aplica este template)
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contentTemplate.update({ where: { id: params.id }, data: { timesUsed: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}

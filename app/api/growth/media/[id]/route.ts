import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const outlet = await prisma.mediaOutlet.findUnique({
    where: { id: params.id },
    include: { pitches: { orderBy: { date: "desc" } } },
  });
  if (!outlet) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(outlet);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const d = await req.json();
  return NextResponse.json(await prisma.mediaOutlet.update({ where: { id: params.id }, data: d }));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.pitch.deleteMany({ where: { outletId: params.id } });
  await prisma.mediaOutlet.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

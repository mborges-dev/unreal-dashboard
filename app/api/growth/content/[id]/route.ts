import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const idea = await prisma.contentIdea.findUnique({ where: { id: params.id } });
  if (!idea) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  if (data.scheduledFor) data.scheduledFor = new Date(data.scheduledFor);
  if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);
  // Auto: ao mudar para "publicado" sem publishedAt, define agora
  if (data.status === "publicado" && !data.publishedAt) {
    const cur = await prisma.contentIdea.findUnique({ where: { id: params.id } });
    if (!cur?.publishedAt) data.publishedAt = new Date();
  }
  const idea = await prisma.contentIdea.update({ where: { id: params.id }, data });
  return NextResponse.json(idea);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contentIdea.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

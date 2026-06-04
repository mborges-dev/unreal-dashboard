import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const d = await req.json();
  const pitch = await prisma.pitch.create({
    data: {
      outletId: params.id,
      topic: d.topic,
      date: d.date ? new Date(d.date) : new Date(),
      message: d.message || null,
      response: d.response || null,
      outcome: d.outcome || "em_curso",
      finalUrl: d.finalUrl || null,
      notes: d.notes || null,
    },
  });
  // Quando se cria um pitch, status do outlet → "abordado" (se ainda estava em identificado)
  await prisma.mediaOutlet.update({
    where: { id: params.id },
    data: { status: { set: "abordado" } as any },
  }).catch(() => null);
  return NextResponse.json(pitch);
}

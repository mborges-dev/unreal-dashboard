import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const d = await req.json();
  const interaction = await prisma.partnerInteraction.create({
    data: {
      partnerId: params.id,
      date: d.date ? new Date(d.date) : new Date(),
      type: d.type || "email",
      summary: d.summary,
      nextStep: d.nextStep || null,
      nextStepDate: d.nextStepDate ? new Date(d.nextStepDate) : null,
    },
  });
  await prisma.partnerCompany.update({
    where: { id: params.id },
    data: { lastInteractionDate: interaction.date },
  });
  return NextResponse.json(interaction);
}

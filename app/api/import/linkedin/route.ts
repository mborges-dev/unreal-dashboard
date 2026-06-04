import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLinkedInConversation } from "@/lib/linkedinParser";

export async function POST(req: NextRequest) {
  const { raw, projectId, preview } = await req.json();
  const parsed = parseLinkedInConversation(raw);
  if (preview) return NextResponse.json(parsed);

  const lead = await prisma.lead.create({
    data: {
      projectId,
      name: parsed.name || "Sem nome",
      role: parsed.role || null,
      linkedinUrl: parsed.linkedinUrl || null,
      status: parsed.suggested.status,
      temperature: parsed.suggested.temperature,
      nextAction: parsed.suggested.nextAction,
      rawConversation: raw,
      probability: 0.3,
      expectedRevenue: 0,
    },
  });
  if (parsed.messages.length) {
    await prisma.contactLog.createMany({
      data: parsed.messages.map((m) => ({
        leadId: lead.id,
        channel: "linkedin",
        direction: m.direction,
        date: m.date,
        content: m.content,
      })),
    });
  }
  return NextResponse.json({ id: lead.id });
}

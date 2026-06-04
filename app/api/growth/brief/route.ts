import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { briefForContent, briefForPitch, briefForPartner } from "@/lib/brief";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");
  const secondaryId = req.nextUrl.searchParams.get("secondaryId");

  if (!type || !id) return NextResponse.json({ error: "type+id required" }, { status: 400 });

  if (type === "content") {
    const idea = await prisma.contentIdea.findUnique({ where: { id } });
    if (!idea) return NextResponse.json({ error: "not found" }, { status: 404 });
    return new NextResponse(briefForContent(idea), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  if (type === "pitch") {
    // id = outletId, secondaryId = pitchId (optional)
    const outlet = await prisma.mediaOutlet.findUnique({ where: { id } });
    if (!outlet) return NextResponse.json({ error: "outlet not found" }, { status: 404 });
    const pitch = secondaryId
      ? await prisma.pitch.findUnique({ where: { id: secondaryId } })
      : null;
    const topic = pitch?.topic || req.nextUrl.searchParams.get("topic") || "(definir tópico)";
    const message = pitch?.message || null;
    return new NextResponse(briefForPitch(outlet, { topic, message }), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  if (type === "partner") {
    // id = partnerId, secondaryId = interactionId (optional)
    const partner = await prisma.partnerCompany.findUnique({ where: { id } });
    if (!partner) return NextResponse.json({ error: "partner not found" }, { status: 404 });
    const interaction = secondaryId
      ? await prisma.partnerInteraction.findUnique({ where: { id: secondaryId } })
      : null;
    return new NextResponse(briefForPartner(partner, {
      type: interaction?.type || req.nextUrl.searchParams.get("channel") || "email",
      summary: interaction?.summary || null,
      nextStep: interaction?.nextStep || null,
    }), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  return NextResponse.json({ error: "unknown type" }, { status: 400 });
}

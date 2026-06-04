import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c === "\r") { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

export async function POST(req: NextRequest) {
  const { csv, projectId, mapping } = await req.json();
  const rows = parseCsv(csv);
  if (rows.length < 2) return NextResponse.json({ created: 0 });
  const headers = rows[0].map((h) => h.trim());
  const body = rows.slice(1);
  let created = 0;
  for (const r of body) {
    const get = (key: string) => {
      const idx = headers.indexOf(mapping[key]);
      return idx >= 0 ? (r[idx] || "").trim() : "";
    };
    const name = get("name");
    if (!name) continue;
    const setup = parseFloat(get("setupValue")) || 0;
    const monthly = parseFloat(get("monthlyValue")) || 0;
    const prob = parseFloat(get("probability")) || 0.3;
    await prisma.lead.create({
      data: {
        projectId,
        name,
        company: get("company") || null,
        role: get("role") || null,
        sector: get("sector") || null,
        email: get("email") || null,
        phone: get("phone") || null,
        linkedinUrl: get("linkedinUrl") || null,
        status: get("status") || "novo",
        temperature: get("temperature") || null,
        setupValue: setup,
        monthlyValue: monthly,
        probability: prob,
        expectedRevenue: Math.round((setup + monthly * 12) * prob),
        notes: get("notes") || null,
      },
    });
    created++;
  }
  return NextResponse.json({ created });
}

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c === "\r") {}
      else cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function extractCity(addr: string): string | null {
  const m = addr.match(/\d{4}-\d{3}\s+([^,]+?)(?:,|$)/);
  return m ? m[1].trim() : null;
}
function extractReviews(notes: string): { count: number; stars: number } | null {
  const m = notes.match(/(\d+)\s+reviews\s+·\s+([\d.]+)\s+stars/);
  if (!m) return null;
  return { count: parseInt(m[1], 10), stars: parseFloat(m[2]) };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: tsx scripts/import-thefacio.ts <path-to-csv>");
  const text = fs.readFileSync(path, "utf8").replace(/^﻿/, "");
  const rows = parseCsv(text);
  const headers = rows[0];
  const body = rows.slice(1);
  console.log(`Lidos ${body.length} restaurantes`);

  // Idempotency: dedupe by place_id (tags) AND normalized phone
  const existing = await prisma.lead.findMany({ where: { projectId: "thefacio" }, select: { tags: true, phone: true } });
  const seenPlaceIds = new Set<string>();
  const seenPhones = new Set<string>();
  for (const e of existing) {
    const m = e.tags?.match(/place_id:(\S+)/);
    if (m) seenPlaceIds.add(m[1]);
    if (e.phone) {
      const d = e.phone.replace(/\D/g, "");
      const n = d.startsWith("351") ? d : d.length === 9 ? "351" + d : d;
      if (n.startsWith("3519") && n.length === 12) seenPhones.add(n);
    }
  }
  console.log(`Já existentes: ${seenPlaceIds.size} place_ids, ${seenPhones.size} móveis`);

  const idx = (k: string) => headers.indexOf(k);
  const NAME = idx("business_name"), ADDR = idx("address"), PHONE = idx("phone"),
        NOTES = idx("notes"), PLACE = idx("place_id");

  const PITCH = "TheFacio — automatização de WhatsApp para reservas e perguntas frequentes do restaurante.";

  let created = 0;
  const BATCH = 500;
  let batch: any[] = [];
  const flush = async () => {
    if (!batch.length) return;
    await prisma.lead.createMany({ data: batch });
    created += batch.length;
    batch = [];
    process.stdout.write(`\r  ${created} criados`);
  };

  for (const r of body) {
    const placeId = r[PLACE]?.trim();
    if (!placeId || seenPlaceIds.has(placeId)) continue;
    const businessName = r[NAME]?.trim();
    if (!businessName) continue;
    const phone = r[PHONE]?.trim() || null;
    if (!phone) continue;
    const digits = phone.replace(/\D/g, "");
    const norm = digits.startsWith("351") ? digits : digits.length === 9 ? "351" + digits : digits;
    if (!norm.startsWith("3519") || norm.length !== 12) continue; // só telemóveis PT
    if (seenPhones.has(norm)) continue; // dedupe por número
    seenPhones.add(norm);
    seenPlaceIds.add(placeId);
    const addr = r[ADDR]?.trim() || "";
    const city = extractCity(addr);
    const rv = extractReviews(r[NOTES] || "");
    const notesParts = [PITCH, addr ? `Morada: ${addr}` : "", rv ? `Google: ${rv.count} reviews · ${rv.stars}★` : ""].filter(Boolean);

    batch.push({
      projectId: "thefacio",
      name: businessName,
      company: businessName,
      sector: "Restauração",
      status: "suspeito",
      temperature: "frio",
      phone,
      location: city,
      probability: 0.05,
      expectedRevenue: 0,
      notes: notesParts.join("\n"),
      tags: `place_id:${placeId}${city ? `,${city.toLowerCase()}` : ""}${rv && rv.count > 1000 ? ",high-volume" : ""}`,
    });
    if (batch.length >= BATCH) await flush();
  }
  await flush();
  console.log(`\n✓ ${created} suspeitos importados.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

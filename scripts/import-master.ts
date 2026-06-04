import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";

const prisma = new PrismaClient();

const STATUS_MAP: Record<string, string> = {
  "1º contacto": "novo",
  "2º contacto": "em-conversa",
  "Respondeu": "qualificado",
  "Reunião agendada": "reuniao-marcada",
  "Reunião realizada": "negociacao",
  "Em análise": "negociacao",
  "Proposta": "proposta-enviada",
  "Proposta enviada": "proposta-enviada",
  "Perdido": "perdido",
  "Ganho": "ganho",
  "Dormente": "dormente",
};

const TEMP_MAP: Record<string, string> = {
  Frio: "frio",
  Morno: "morno",
  Quente: "quente",
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function num(v: any): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : null;
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: tsx scripts/import-master.ts <path-to-xlsx>");
  if (!fs.existsSync(path)) throw new Error("Ficheiro não encontrado: " + path);

  const wb = XLSX.readFile(path, { cellDates: true });
  const sheet = wb.Sheets["Leads"];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let contactsCreated = 0;

  for (const r of rows) {
    const name = (r["Nome"] || "").toString().trim();
    if (!name) { skipped++; continue; }

    const projectId = (r["Projecto"] || "UNREAL").toString().toLowerCase() === "thefacio" ? "thefacio" : "unreal";
    const externalId = (r["ID"] || "").toString().trim();

    const rawStatus = (r["Estado"] || "").toString().trim();
    const status = STATUS_MAP[rawStatus] || "novo";
    const tempRaw = (r["Temperatura"] || "").toString().trim();
    const temperature = TEMP_MAP[tempRaw] || null;

    const probPct = num(r["Probabilidade (%)"]);
    const probability = probPct != null ? Math.min(1, probPct > 1 ? probPct / 100 : probPct) : 0.05;
    const setupValue = num(r["Setup estimado (€)"]);
    const monthlyValue = num(r["Mensal estimado (€)"]);
    const expectedRevenue = Math.round(((setupValue || 0) + (monthlyValue || 0) * 12) * probability);

    const nextDate = toDate(r["Data próxima acção"]);
    const createdAt = toDate(r["Data criação"]) || new Date();

    const notesParts = [
      r["Notas"]?.toString().trim(),
      r["Contexto"] ? `Contexto: ${r["Contexto"]}` : null,
      r["Fonte"] ? `Fonte: ${r["Fonte"]}` : null,
      externalId ? `ID original: ${externalId}` : null,
    ].filter(Boolean);

    // Upsert by externalId stored in notes or by (projectId, name+company)
    const existing = await prisma.lead.findFirst({
      where: {
        projectId,
        name,
        company: r["Empresa"] || null,
      },
    });

    const data = {
      projectId,
      name,
      company: r["Empresa"]?.toString().trim() || null,
      role: r["Cargo"]?.toString().trim() || null,
      sector: r["Sector"]?.toString().trim() || null,
      size: r["Tamanho empresa"]?.toString().trim() || null,
      status,
      temperature,
      email: r["Email"]?.toString().trim() || null,
      phone: r["Telefone"]?.toString().trim() || null,
      linkedinUrl: r["LinkedIn URL"]?.toString().trim() || null,
      location: r["Localização"]?.toString().trim() || null,
      setupValue,
      monthlyValue,
      probability,
      expectedRevenue,
      nextAction: r["Próxima acção"]?.toString().trim() || null,
      nextDate,
      tags: r["Tags"]?.toString().trim() || null,
      notes: notesParts.join("\n") || null,
      rawConversation: r["Conversa Raw"]?.toString().trim() || null,
      createdAt,
    };

    let leadId: string;
    if (existing) {
      const u = await prisma.lead.update({ where: { id: existing.id }, data });
      leadId = u.id;
      updated++;
      await prisma.contactLog.deleteMany({ where: { leadId } });
    } else {
      const c = await prisma.lead.create({ data });
      leadId = c.id;
      created++;
    }

    // Build contact logs from date columns
    const contactDates = [
      { key: "Data 1º contacto", label: "1º contacto" },
      { key: "Data 2º contacto", label: "2º contacto" },
      { key: "Data 3º contacto", label: "3º contacto" },
      { key: "Data última interacção", label: "Última interacção" },
    ];
    for (const cd of contactDates) {
      const d = toDate(r[cd.key]);
      if (!d) continue;
      await prisma.contactLog.create({
        data: {
          leadId,
          channel: (r["Fonte"] || "linkedin").toString().toLowerCase().includes("email") ? "email" : "linkedin",
          direction: "out",
          date: d,
          content: cd.label,
        },
      });
      contactsCreated++;
    }
  }

  console.log(`Importação concluída: ${created} criados, ${updated} actualizados, ${skipped} ignorados, ${contactsCreated} contactos.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

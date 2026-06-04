"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Phone, Mail, Linkedin, MessageCircle, Trophy, X, Check, Clock, MessageSquareReply } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { fmtEUR, fmtDate } from "@/lib/utils";
import { STATUS_HEX, STATUS_OPTIONS } from "@/lib/projects";
import { normalizePhone } from "@/lib/outreach";

type Lead = any;
type Data = { leads: Lead[]; summary: { count: number; totalWeighted: number; totalGross: number; stale: number } };

export default function ClosingPage() {
  const params = useParams<{ project: string }>();
  const [data, setData] = useState<Data | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/closing?projectId=${params.project}`, { cache: "no-store" });
    setData(await r.json());
  }, [params.project]);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: any) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  }
  async function logCall(id: string, name: string) {
    const note = prompt(`Chamada com ${name} — resultado curto (opcional):`);
    if (note === null) return;
    await fetch(`/api/leads/${id}/contacts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "telefone", direction: "out", content: note?.trim() || "Chamada efectuada (sem nota)." }),
    });
    load();
  }
  async function logResponse(id: string, name: string) {
    const note = prompt(`Resposta de ${name} — resumo:`);
    if (note === null) return;
    await fetch(`/api/leads/${id}/contacts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "email", direction: "in", content: note?.trim() || "Respondeu." }),
    });
    await patch(id, { status: "respondeu", temperature: "quente" });
  }
  async function bump(id: string, days: number) {
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0);
    await patch(id, { nextDate: d.toISOString() });
  }

  if (!data) return <div className="p-6 text-muted">A carregar...</div>;
  const { leads, summary } = data;

  return (
    <>
      <PageHeader
        title="Closing"
        subtitle={`${summary.count} leads warm · pipeline ponderado ${fmtEUR(summary.totalWeighted)} · ${summary.stale} em silêncio >5d`}
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <Kpi label="Leads warm" value={String(summary.count)} />
          <Kpi label="Pipeline ponderado" value={fmtEUR(summary.totalWeighted)} sub="(setup + 12 meses) × prob" />
          <Kpi label="Valor bruto a fechar" value={fmtEUR(summary.totalGross)} sub="se fechassem todos" />
          <Kpi label="Em silêncio" value={String(summary.stale)} sub=">5 dias sem contacto" tone={summary.stale > 0 ? "warn" : undefined} />
        </div>

        <div className="space-y-3">
          {leads.length === 0 && (
            <div className="card text-center text-muted py-10">Sem leads warm. Foco em alimentar a base via outreach ou referrals.</div>
          )}
          {leads.map((l: any) => {
            const phoneN = normalizePhone(l.phone);
            const stale = l.daysSinceLast != null && l.daysSinceLast > 5;
            return (
              <div key={l.id} className={`card ${stale ? "border-amber-900/50" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/${params.project}/leads/${l.id}`} className="font-semibold text-base hover:underline truncate">{l.name}</Link>
                      <span className="text-muted text-sm">·</span>
                      <span className="text-sm">{l.company || "—"}</span>
                      {l.role && <span className="text-muted text-xs">· {l.role}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <select
                        className="text-xs rounded font-medium text-white cursor-pointer pl-2 pr-6 py-1 border-0 outline-none"
                        style={{
                          backgroundColor: STATUS_HEX[l.status] || "#3f3f46",
                          WebkitAppearance: "none", MozAppearance: "none", appearance: "none",
                        }}
                        value={l.status}
                        onChange={(e) => patch(l.id, { status: e.target.value })}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ backgroundColor: "#1c1c21", color: "#f4f4f5" }}>{s}</option>)}
                      </select>
                      {l.sector && <span className="badge">{l.sector}</span>}
                      {l.temperature && <span className="badge">{l.temperature}</span>}
                      {l.proposalsCount > 0 && <span className="badge bg-purple-900/40 border-purple-900">{l.proposalsCount} proposta(s)</span>}
                    </div>
                    {l.lastContact && (
                      <div className="text-sm text-muted mb-2">
                        <Clock className="inline mr-1" size={12} />
                        Último: <span className={stale ? "text-amber-400" : ""}>{fmtDate(l.lastContact.date)} ({l.daysSinceLast}d) · {l.lastContact.direction === "in" ? "← recebido" : "→ enviado"} · {l.lastContact.channel}</span>
                        <div className="text-xs text-muted/80 mt-0.5 line-clamp-2 italic">{l.lastContact.content?.slice(0, 200)}{l.lastContact.content?.length > 200 ? "…" : ""}</div>
                      </div>
                    )}
                    {l.nextAction && (
                      <div className="text-sm">
                        <span className="label">Próxima:</span> {l.nextAction}
                        {l.nextDate && <span className="text-muted text-xs ml-2">({fmtDate(l.nextDate)})</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <div className="text-2xl font-semibold">{fmtEUR(l.expectedRevenue)}</div>
                      <div className="text-xs text-muted">
                        {fmtEUR(l.grossValue)} × {Math.round((l.probability || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                  {/* Channel links */}
                  {phoneN && (
                    <a href={`tel:+${phoneN}`} className="btn" title="Ligar"><Phone size={14} /> +{phoneN}</a>
                  )}
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="btn" title="Email"><Mail size={14} /> Email</a>
                  )}
                  {l.linkedinUrl && (
                    <a href={l.linkedinUrl} target="_blank" rel="noopener" className="btn"><Linkedin size={14} /> LinkedIn</a>
                  )}
                  {phoneN && (
                    <a href={`https://web.whatsapp.com/send?phone=${phoneN}`} target="_blank" rel="noopener" className="btn"><MessageCircle size={14} /> WhatsApp</a>
                  )}

                  <div className="grow" />

                  {/* Quick actions */}
                  <button className="btn" onClick={() => logCall(l.id, l.name)} title="Registar chamada feita"><Phone size={14} /> Liguei</button>
                  <button className="btn text-emerald-400 hover:text-emerald-300" onClick={() => logResponse(l.id, l.name)} title="Registar resposta recebida"><MessageSquareReply size={14} /> Respondeu</button>
                  <button className="btn" onClick={() => bump(l.id, 3)} title="Adiar 3 dias">+3d</button>
                  <button className="btn text-emerald-400" onClick={() => patch(l.id, { status: "ganho" })} title="Marcar ganho"><Trophy size={14} /></button>
                  <button className="btn text-red-400" onClick={() => patch(l.id, { status: "perdido" })} title="Marcar perdido"><X size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "danger" | "warn" }) {
  const colour = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-amber-400" : "";
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colour}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

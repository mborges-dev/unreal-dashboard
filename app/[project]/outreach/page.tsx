"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Send, Copy, Download, Check, MessageCircle, PhoneOff, Undo2, MessageSquareReply, Trophy, X, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TEMPLATES, DAILY_LIMIT, normalizePhone, waLink, type MsgKey } from "@/lib/outreach";
import { fmtDate } from "@/lib/utils";
import { UnrealOutreach } from "./UnrealOutreach";

type Lead = { id: string; name: string; company: string | null; phone: string | null; location: string | null; status: string; notes: string | null; lastContact: string | null };
type TabKey = MsgKey | "CONVERSAS";
type Queue = { M1: Lead[]; M2: Lead[]; M3: Lead[]; M4: Lead[]; CONVERSAS: Lead[]; sentToday: number };

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: "M1", label: "M1 — Novos", desc: "Pergunta genuína (Dia 0)" },
  { key: "M2", label: "M2 — Confirmar", desc: "3 dias após M1" },
  { key: "M3", label: "M3 — Pitch", desc: "3 dias após M2" },
  { key: "M4", label: "M4 — Última", desc: "4 dias após M3" },
  { key: "CONVERSAS", label: "Conversas", desc: "Responderam — chase manual" },
];

export default function OutreachPage() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/unreal/")) return <UnrealOutreach />;
  return <TheFacioOutreach />;
}

function TheFacioOutreach() {
  const params = useParams<{ project: string }>();
  const [data, setData] = useState<Queue | null>(null);
  const [tab, setTab] = useState<TabKey>("M1");
  const [city, setCity] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/outreach/queue?projectId=${params.project}&limit=40`, { cache: "no-store" });
    setData(await r.json());
  }, [params.project]);
  useEffect(() => { load(); }, [load]);

  async function markSent(leadId: string, msg: MsgKey) {
    await fetch("/api/outreach/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ leadId, msg }) });
    load();
  }

  async function undoLast() {
    if (!confirm("Desfazer o último envio marcado? O contacto vai ser apagado do histórico e o lead volta à fase anterior.")) return;
    const r = await fetch(`/api/outreach/undo?projectId=${params.project}`, { method: "POST" });
    if (!r.ok) {
      alert("Nada para desfazer.");
      return;
    }
    const j = await r.json();
    alert(`✓ Revertido: ${j.lead.name} (${j.msg}) → ${j.revertedTo}`);
    load();
  }

  async function markResponded(leadId: string, leadName: string) {
    const note = prompt(`Resposta de ${leadName} — resumo (opcional):`);
    if (note === null) return; // cancelado
    await fetch("/api/outreach/respondeu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId, note }),
    });
    load();
  }

  async function patchLead(leadId: string, body: any) {
    await fetch(`/api/leads/${leadId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  }
  async function logQuickContact(leadId: string, content: string) {
    await fetch(`/api/leads/${leadId}/contacts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channel: "whatsapp", direction: "out", content }) });
  }
  async function bumpFollowup(leadId: string, name: string) {
    const note = prompt(`Chase a ${name} — resumo curto (opcional):`);
    if (note === null) return;
    await logQuickContact(leadId, note?.trim() || "Chase manual enviado.");
    const dt = new Date(); dt.setDate(dt.getDate() + 3); dt.setHours(9, 0, 0, 0);
    await patchLead(leadId, { nextDate: dt.toISOString(), nextAction: "Aguardar resposta - se silêncio, novo chase" });
  }

  async function markNoWhatsApp(leadId: string, currentNotes: string | null) {
    const tag = "[Sem WhatsApp]";
    const notes = currentNotes?.includes(tag) ? currentNotes : `${tag}\n${currentNotes || ""}`.trim();
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "perdido", notes, nextDate: null, nextAction: null }),
    });
    load();
  }

  const list = useMemo(() => {
    if (!data) return [];
    return data[tab].filter((l) => !city || (l.location || "").toLowerCase().includes(city.toLowerCase()));
  }, [data, tab, city]);

  const todayRemaining = data ? Math.max(0, DAILY_LIMIT - data.sentToday) : 0;
  const overLimit = data && data.sentToday >= DAILY_LIMIT;

  async function copyDayList() {
    if (!data) return;
    const lines = list.map((l) => `${normalizePhone(l.phone) || l.phone || "?"}\t${l.name}\t${l.location || ""}`).join("\n");
    await navigator.clipboard.writeText(lines);
    alert(`Copiados ${list.length} contactos`);
  }
  function exportCsv() {
    if (!data) return;
    const rows = [["phone_e164", "name", "location", "status", "lead_id"]];
    for (const l of list) rows.push([normalizePhone(l.phone) || "", l.name, l.location || "", l.status, l.id]);
    const csv = rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `outreach-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (!data) return <div className="p-6 text-muted">A carregar...</div>;

  return (
    <>
      <PageHeader
        title="Outreach"
        subtitle={`${data.sentToday}/${DAILY_LIMIT} mensagens hoje · ${todayRemaining} restantes`}
        actions={
          <>
            <button className="btn" onClick={undoLast} title="Desfazer o último envio marcado"><Undo2 size={14} /> Desfazer</button>
            <button className="btn" onClick={copyDayList}><Copy size={14} /> Copiar lista</button>
            <button className="btn" onClick={exportCsv}><Download size={14} /> CSV</button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="label">Progresso de hoje</div>
              <div className="text-2xl font-semibold mt-0.5">
                {data.sentToday} <span className="text-muted text-base">/ {DAILY_LIMIT} mensagens</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label">Restantes</div>
              <div className={`text-2xl font-semibold mt-0.5 ${overLimit ? "text-red-400" : todayRemaining < 10 ? "text-amber-400" : "text-emerald-400"}`}>
                {todayRemaining}
              </div>
            </div>
          </div>
          <div className="h-2 bg-surface2 rounded overflow-hidden">
            <div
              className={`h-full transition-all ${overLimit ? "bg-red-500" : data.sentToday / DAILY_LIMIT > 0.75 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, (data.sentToday / DAILY_LIMIT) * 100)}%` }}
            />
          </div>
          {overLimit && (
            <p className="mt-2 text-sm text-red-400">⚠ Atingiste o limite diário. Para já e continua amanhã para evitares ban do WhatsApp.</p>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {TABS.map((t) => {
            const count = data[t.key].length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`card text-left transition ${active ? "border-blue-500 ring-1 ring-blue-500/40" : ""}`}
              >
                <div className="label">{t.label}</div>
                <div className="mt-1 text-2xl font-semibold">{count}</div>
                <div className="text-xs text-muted mt-1">{t.desc}</div>
              </button>
            );
          })}
        </div>

        {tab !== "CONVERSAS" && (
          <div className="card">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex-1">
                <div className="label mb-1">Mensagem {tab}</div>
                <pre className="text-sm whitespace-pre-wrap font-sans bg-surface2 p-3 rounded border border-border">{TEMPLATES[tab as MsgKey]}</pre>
              </div>
              <button
                className="btn shrink-0"
                onClick={() => { navigator.clipboard.writeText(TEMPLATES[tab as MsgKey]); }}
                title="Copiar template"
              >
                <Copy size={14} /> Copiar texto
              </button>
            </div>
          </div>
        )}

        {tab === "CONVERSAS" && (
          <div className="card border-emerald-900/50 bg-emerald-950/10">
            <h3 className="font-semibold text-sm mb-1">Conversas activas</h3>
            <p className="text-xs text-muted">Restaurantes que já te responderam e estão fora da sequência M1-M4. Acompanha aqui — sem dailylimit, sem template fixo: cada resposta é única. Usa "Chase" para registar follow-up + adiar 3 dias.</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input className="input max-w-xs" placeholder="Filtrar por cidade..." value={city} onChange={(e) => setCity(e.target.value)} />
          <span className="text-sm text-muted">{list.length} contactos {tab === "CONVERSAS" ? "em conversa" : "· clica \"Abrir WhatsApp\" para arrancar"}</span>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="data">
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Cidade</th>
                <th>Telefone</th>
                <th>Último contacto</th>
                <th className="text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const phoneN = normalizePhone(l.phone);
                const isConv = tab === "CONVERSAS";
                const wa = isConv ? (phoneN ? `https://web.whatsapp.com/send?phone=${phoneN}` : null) : waLink(l.phone, TEMPLATES[tab as MsgKey]);
                const daysSince = l.lastContact ? Math.floor((Date.now() - new Date(l.lastContact).getTime()) / 86400000) : null;
                return (
                  <tr key={l.id} className="group">
                    <td>
                      <Link className="link" href={`/${params.project}/leads/${l.id}`}>{l.name}</Link>
                      {isConv && <div className="text-xs text-muted">{l.status}</div>}
                    </td>
                    <td className="text-sm">{l.location || "—"}</td>
                    <td className="font-mono text-xs">{phoneN ? `+${phoneN}` : "—"}</td>
                    <td className="text-xs text-muted">
                      {l.lastContact ? fmtDate(l.lastContact) : "—"}
                      {daysSince != null && <div className={`text-xs ${daysSince > 5 ? "text-amber-400" : ""}`}>{daysSince}d</div>}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        {wa ? (
                          <a className="btn btn-primary" href={wa} target="_blank" rel="noopener">
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-muted">sem telefone</span>
                        )}
                        {isConv ? (
                          <>
                            <button className="btn" onClick={() => bumpFollowup(l.id, l.name)} title="Registar chase + adiar 3d">
                              <Clock size={14} /> Chase
                            </button>
                            <button className="btn text-emerald-400" onClick={() => patchLead(l.id, { status: "ganho" })} title="Fechei!">
                              <Trophy size={14} />
                            </button>
                            <button className="btn text-red-400" onClick={() => patchLead(l.id, { status: "perdido" })} title="Não avançou">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn"
                              onClick={() => markSent(l.id, tab as MsgKey)}
                              title={`Marcar ${tab} enviada`}
                            >
                              <Check size={14} /> Marcar
                            </button>
                            <button
                              className="btn text-emerald-400 hover:text-emerald-300"
                              onClick={() => markResponded(l.id, l.name)}
                              title="Respondeu — registar resposta"
                            >
                              <MessageSquareReply size={14} />
                            </button>
                            <button
                              className="btn text-red-400 hover:text-red-300"
                              onClick={() => markNoWhatsApp(l.id, l.notes)}
                              title="Não tem WhatsApp — remover da fila"
                            >
                              <PhoneOff size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted">Sem contactos para esta fase {city ? "(experimenta limpar o filtro de cidade)" : ""}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

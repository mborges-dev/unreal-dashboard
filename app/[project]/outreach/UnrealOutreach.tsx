"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Linkedin, Copy, Check, X, MessageSquareReply } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TEMPLATES, BUMP_LABEL, type UnrealBump } from "@/lib/unreal-outreach";
import { fmtDate } from "@/lib/utils";

type Lead = {
  id: string; name: string; company: string | null; sector: string | null;
  role: string | null; linkedinUrl: string | null; email: string | null;
  status: string; notes: string | null; nextDate: string | null;
  lastContact: string | null; lastContactContent: string | null;
  daysSinceLastOut: number;
};
type Queue = { BUMP1: Lead[]; BUMP2: Lead[]; BREAKUP: Lead[]; sentToday: number };

const TABS: { key: UnrealBump; desc: string }[] = [
  { key: "BUMP1", desc: "Status novo, sem resposta" },
  { key: "BUMP2", desc: "Em-conversa, 7-14d sem resposta" },
  { key: "BREAKUP", desc: "Em-conversa, >14d sem resposta" },
];

export function UnrealOutreach() {
  const [data, setData] = useState<Queue | null>(null);
  const [tab, setTab] = useState<UnrealBump>("BUMP1");
  const [sector, setSector] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/unreal-outreach/queue", { cache: "no-store" });
    setData(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function markSent(leadId: string, bump: UnrealBump) {
    await fetch("/api/unreal-outreach/send", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId, bump, channel: "linkedin" }),
    });
    load();
  }

  async function markResponded(leadId: string, name: string) {
    const note = prompt(`Resposta de ${name} — resumo:`);
    if (note === null) return;
    await fetch(`/api/leads/${leadId}/contacts`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "linkedin", direction: "in", content: note?.trim() || "Respondeu." }),
    });
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "respondeu", temperature: "quente", nextDate: new Date().toISOString(), nextAction: "Responder e qualificar - mover para /closing" }),
    });
    load();
  }

  async function markLost(leadId: string) {
    if (!confirm("Marcar como sem interesse?")) return;
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "perdido", nextDate: null, nextAction: null }),
    });
    load();
  }

  const list = useMemo(() => {
    if (!data) return [];
    return data[tab].filter((l) => !sector || (l.sector || "").toLowerCase().includes(sector.toLowerCase()));
  }, [data, tab, sector]);

  if (!data) return <div className="p-6 text-muted">A carregar...</div>;

  return (
    <>
      <PageHeader
        title="Outreach UNREAL"
        subtitle={`${data.sentToday} mensagens enviadas hoje · 90 leads na sequência`}
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {TABS.map((t) => {
            const count = data[t.key].length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`card text-left transition ${active ? "border-blue-500 ring-1 ring-blue-500/40" : ""}`}
              >
                <div className="label">{BUMP_LABEL[t.key]}</div>
                <div className="mt-1 text-2xl font-semibold">{count}</div>
                <div className="text-xs text-muted mt-1">{t.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="label mb-1">Template — {BUMP_LABEL[tab]}</div>
              <pre className="text-sm whitespace-pre-wrap font-sans bg-surface2 p-3 rounded border border-border">{TEMPLATES[tab]}</pre>
            </div>
            <button
              className="btn shrink-0"
              onClick={() => navigator.clipboard.writeText(TEMPLATES[tab])}
            >
              <Copy size={14} /> Copiar
            </button>
          </div>
          <p className="text-xs text-muted">
            Genérico de partida. Substitui [Nome] / [sector] e ajusta com 1-2 frases sectoriais antes de enviar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input className="input max-w-xs" placeholder="Filtrar por sector..." value={sector} onChange={(e) => setSector(e.target.value)} />
          <span className="text-sm text-muted">{list.length} contactos · ajustar template no LinkedIn e clicar "Marcar enviada"</span>
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="data">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Sector</th>
                <th>Último contacto</th>
                <th className="text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="group">
                  <td>
                    <div className="flex flex-col">
                      <Link href={`/unreal/leads/${l.id}`} className="link">{l.name}</Link>
                      <span className="text-xs text-muted">{l.company || "—"}{l.role ? ` · ${l.role}` : ""}</span>
                    </div>
                  </td>
                  <td className="text-xs">{l.sector || "—"}</td>
                  <td className="text-xs">
                    {l.lastContact ? (
                      <>
                        <div>{fmtDate(l.lastContact)} <span className="text-muted">({l.daysSinceLastOut}d)</span></div>
                        <div className="text-muted truncate max-w-xs italic">{l.lastContactContent?.slice(0, 60)}{(l.lastContactContent?.length || 0) > 60 ? "…" : ""}</div>
                      </>
                    ) : "—"}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      {l.linkedinUrl && (
                        <a href={l.linkedinUrl} target="_blank" rel="noopener" className="btn">
                          <Linkedin size={14} /> LinkedIn
                        </a>
                      )}
                      <button className="btn" onClick={() => markSent(l.id, tab)} title="Marcar enviada">
                        <Check size={14} /> Marcar
                      </button>
                      <button className="btn text-emerald-400 hover:text-emerald-300" onClick={() => markResponded(l.id, l.name)} title="Respondeu">
                        <MessageSquareReply size={14} />
                      </button>
                      <button className="btn text-red-400 hover:text-red-300" onClick={() => markLost(l.id)} title="Sem interesse">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-muted">Sem leads nesta fase{sector ? " (com este filtro)" : ""}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

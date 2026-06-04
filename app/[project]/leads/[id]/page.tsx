"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { LeadForm } from "@/components/LeadForm";
import { STATUS_OPTIONS, statusColor } from "@/lib/projects";
import { TempIcon } from "@/components/TempIcon";
import { fmtEUR, fmtDate } from "@/lib/utils";

export default function LeadDetail() {
  const params = useParams<{ project: string; id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [newDir, setNewDir] = useState<"out" | "in">("out");
  const [showRaw, setShowRaw] = useState(false);

  async function reload() {
    const r = await fetch(`/api/leads/${params.id}`);
    if (r.ok) setLead(await r.json());
  }
  useEffect(() => { reload(); }, [params.id]);

  async function patch(d: any) {
    await fetch(`/api/leads/${params.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
    reload();
  }

  async function addContact() {
    if (!newMsg.trim()) return;
    await fetch(`/api/leads/${params.id}/contacts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "linkedin", direction: newDir, content: newMsg, date: new Date() }),
    });
    setNewMsg("");
    reload();
  }

  async function del() {
    if (!confirm("Eliminar este lead?")) return;
    await fetch(`/api/leads/${params.id}`, { method: "DELETE" });
    router.push(`/${params.project}/leads`);
  }

  if (!lead) return <div className="p-6 text-muted">A carregar...</div>;

  return (
    <>
      <PageHeader
        title={lead.name}
        subtitle={[lead.role, lead.company].filter(Boolean).join(" · ") || "—"}
        actions={
          <>
            <button className="btn" onClick={() => setEditing(true)}>Editar</button>
            <button className="btn" onClick={() => patch({ status: "ganho" })}>Marcar ganho</button>
            <button className="btn" onClick={() => patch({ status: "perdido" })}>Marcar perdido</button>
            <button className="btn text-red-400" onClick={del}>Eliminar</button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${statusColor(lead.status)} text-white border-transparent`}>{lead.status}</span>
              <span className="badge inline-flex items-center gap-1"><TempIcon value={lead.temperature} />{lead.temperature || "—"}</span>
            </div>
            <h3 className="font-semibold mb-2">Timeline de contactos</h3>
            <div className="space-y-2">
              {lead.contacts.length === 0 && <p className="text-sm text-muted">Sem contactos registados.</p>}
              {lead.contacts.map((c: any) => (
                <div key={c.id} className={`p-3 rounded border border-border ${c.direction === "out" ? "bg-blue-950/20" : "bg-surface2"}`}>
                  <div className="text-xs text-muted mb-1">
                    {c.direction === "out" ? "→ Enviado" : "← Recebido"} · {c.channel} · {fmtDate(c.date)} {new Date(c.date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="label mb-2">Registar novo contacto</div>
              <div className="flex gap-2 mb-2">
                <select className="input w-32" value={newDir} onChange={(e) => setNewDir(e.target.value as any)}>
                  <option value="out">Enviado</option>
                  <option value="in">Recebido</option>
                </select>
              </div>
              <textarea className="input min-h-[60px]" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Conteúdo da mensagem..." />
              <button className="btn btn-primary mt-2" onClick={addContact}>Adicionar</button>
            </div>
          </div>

          {lead.rawConversation && (
            <div className="card">
              <button className="font-semibold text-sm" onClick={() => setShowRaw((s) => !s)}>
                {showRaw ? "▼" : "▶"} Conversa raw
              </button>
              {showRaw && <pre className="mt-2 text-xs text-muted whitespace-pre-wrap font-mono">{lead.rawConversation}</pre>}
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-2">Notas</h3>
            <textarea
              className="input min-h-[120px]"
              defaultValue={lead.notes || ""}
              onBlur={(e) => e.target.value !== (lead.notes || "") && patch({ notes: e.target.value })}
            />
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Detalhes</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="label">Email</dt><dd>{lead.email || "—"}</dd></div>
              <div><dt className="label">Telefone</dt><dd>{lead.phone || "—"}</dd></div>
              <div><dt className="label">LinkedIn</dt><dd>{lead.linkedinUrl ? <a className="link" href={lead.linkedinUrl} target="_blank">{lead.linkedinUrl}</a> : "—"}</dd></div>
              <div><dt className="label">Localização</dt><dd>{lead.location || "—"}</dd></div>
              <div><dt className="label">Sector</dt><dd>{lead.sector || "—"}</dd></div>
            </dl>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Valores</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="label">Setup</dt><dd>{fmtEUR(lead.setupValue)}</dd></div>
              <div className="flex justify-between"><dt className="label">Mensal</dt><dd>{fmtEUR(lead.monthlyValue)}</dd></div>
              <div className="flex justify-between"><dt className="label">Probabilidade</dt><dd>{Math.round((lead.probability || 0) * 100)}%</dd></div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-border"><dt>Receita esperada</dt><dd>{fmtEUR(lead.expectedRevenue)}</dd></div>
            </dl>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Próxima acção</h3>
            <input className="input mb-2" defaultValue={lead.nextAction || ""} onBlur={(e) => e.target.value !== (lead.nextAction || "") && patch({ nextAction: e.target.value })} />
            <input className="input" type="date" defaultValue={lead.nextDate?.slice(0, 10) || ""} onChange={(e) => patch({ nextDate: e.target.value || null })} />
          </div>
          <LeadSource leadId={params.id} lead={lead} onPatch={(b) => patch(b)} />
          <div className="card">
            <h3 className="font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {(lead.tags || "").split(",").filter(Boolean).map((t: string) => <span key={t} className="badge">{t.trim()}</span>)}
            </div>
            <input className="input" defaultValue={lead.tags || ""} placeholder="tag1, tag2" onBlur={(e) => e.target.value !== (lead.tags || "") && patch({ tags: e.target.value })} />
          </div>
          {lead.proposals.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-2">Propostas relacionadas</h3>
              <ul className="text-sm space-y-1">
                {lead.proposals.map((p: any) => (
                  <li key={p.id}>{p.title} — {p.status} — {fmtEUR(p.totalYear)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Modal open={editing} onClose={() => setEditing(false)} title="Editar lead">
        <LeadForm
          projectId={params.project}
          initial={lead}
          onSubmit={async (d) => {
            const { id, contacts, proposals, createdAt, updatedAt, expectedRevenue, ...rest } = d;
            await patch(rest);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}

function LeadSource({ leadId, lead, onPatch }: { leadId: string; lead: any; onPatch: (body: any) => Promise<void> | void }) {
  const [content, setContent] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/growth/content").then((r) => r.json()).then((all: any[]) => setContent(all.filter((c) => c.status === "publicado")));
    fetch("/api/growth/media").then((r) => r.json()).then(setMedia);
    fetch("/api/growth/partners").then((r) => r.json()).then(setPartners);
  }, []);

  const sourceType = lead.sourceType || "outbound";
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Veio através de</h3>
      <select
        className="input mb-2"
        value={sourceType}
        onChange={(e) => {
          const v = e.target.value;
          onPatch({ sourceType: v, sourceContentId: null, sourceMediaId: null, sourcePartnerId: null });
        }}
      >
        <option value="outbound">Outbound directo</option>
        <option value="content">Conteúdo publicado</option>
        <option value="media">Imprensa / Podcast</option>
        <option value="partner">Parceria</option>
      </select>
      {sourceType === "content" && (
        <select className="input" value={lead.sourceContentId || ""} onChange={(e) => onPatch({ sourceContentId: e.target.value || null })}>
          <option value="">— escolher post —</option>
          {content.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}
      {sourceType === "media" && (
        <select className="input" value={lead.sourceMediaId || ""} onChange={(e) => onPatch({ sourceMediaId: e.target.value || null })}>
          <option value="">— escolher outlet —</option>
          {media.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.type})</option>)}
        </select>
      )}
      {sourceType === "partner" && (
        <select className="input" value={lead.sourcePartnerId || ""} onChange={(e) => onPatch({ sourcePartnerId: e.target.value || null })}>
          <option value="">— escolher parceiro —</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
    </div>
  );
}

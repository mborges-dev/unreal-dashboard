"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Plus, Mail, Linkedin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StarsRating } from "@/components/StarsRating";
import { Timeline, type TimelineEvent } from "@/components/Timeline";

const PURPLE = "#A855F7";
const STATUSES = ["a_abordar", "abordado", "reuniao_agendada", "reuniao_feita", "parceria_activa", "dormente", "perdido"];
const TYPES = ["consultora", "software_house", "lean_processos", "outro"];
const INT_TYPES = ["reuniao", "email", "linkedin", "telefone", "evento"];

export default function PartnerDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [intOpen, setIntOpen] = useState(false);
  const [iform, setIform] = useState({ type: "reuniao", date: new Date().toISOString().slice(0, 10), summary: "", nextStep: "", nextStepDate: "" });
  const [linkOpen, setLinkOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  const load = useCallback(async () => {
    const r = await fetch(`/api/growth/partners/${params.id}`);
    if (r.ok) setPartner(await r.json());
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function patch(body: any) {
    await fetch(`/api/growth/partners/${params.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  async function copyPartnerBrief() {
    const url = `/api/growth/brief?type=partner&id=${params.id}&channel=${iform.type}`;
    const r = await fetch(url);
    const text = await r.text();
    await navigator.clipboard.writeText(text);
    alert("Brief copiado. Cola numa conversa Claude/ChatGPT para gerar a mensagem.");
  }

  async function addInteraction(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/growth/partners/${params.id}/interaction`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(iform),
    });
    setIntOpen(false);
    setIform({ type: "reuniao", date: new Date().toISOString().slice(0, 10), summary: "", nextStep: "", nextStepDate: "" });
    load();
  }

  async function del() {
    if (!confirm("Eliminar este parceiro?")) return;
    await fetch(`/api/growth/partners/${params.id}`, { method: "DELETE" });
    router.push("/growth/partners");
  }

  async function openLinkLead() {
    const r = await fetch("/api/leads?projectId=unreal");
    setLeads(await r.json());
    setLinkOpen(true);
  }
  async function linkLead(leadId: string) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceType: "partner", sourcePartnerId: params.id, tags: `partner_referral` }),
    });
    await patch({ leadsBrought: (partner.leadsBrought || 0) + 1 });
    setLinkOpen(false);
  }

  if (!partner) return <div className="p-6 text-muted">A carregar...</div>;

  const events: TimelineEvent[] = (partner.interactions || []).map((i: any) => ({
    id: i.id,
    date: i.date,
    title: i.summary,
    meta: i.type,
    body: i.nextStep ? `Próximo passo: ${i.nextStep}${i.nextStepDate ? ` (${new Date(i.nextStepDate).toLocaleDateString("pt-PT")})` : ""}` : undefined,
    tone: i.type === "reuniao" ? "info" : "default",
  }));

  return (
    <>
      <PageHeader
        title={partner.name}
        subtitle={`${partner.contactName}${partner.contactRole ? ` · ${partner.contactRole}` : ""}`}
        actions={
          <>
            <button className="btn" onClick={() => patch({ status: "abordado" })}>Marcar abordado</button>
            <button className="btn" onClick={() => patch({ status: "reuniao_agendada" })}>Reunião agendada</button>
            <button className="btn" onClick={() => patch({ status: "parceria_activa" })}>Parceria activa</button>
            <button className="btn text-red-400" onClick={del}><Trash2 size={14} /></button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <select className="input w-auto text-sm" value={partner.status} onChange={(e) => patch({ status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="input w-auto text-sm" value={partner.type} onChange={(e) => patch({ type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <StarsRating value={partner.fitScore} onChange={(n) => patch({ fitScore: n })} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Interacções ({partner.interactions?.length || 0})</h3>
              <button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={() => setIntOpen(true)}><Plus size={14} /> Registar</button>
            </div>
            <Timeline events={events} />
            {intOpen && (
              <form onSubmit={addInteraction} className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
                <div>
                  <div className="label mb-1">Tipo</div>
                  <select className="input" value={iform.type} onChange={(e) => setIform({ ...iform, type: e.target.value })}>
                    {INT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><div className="label mb-1">Data</div><input type="date" className="input" value={iform.date} onChange={(e) => setIform({ ...iform, date: e.target.value })} /></div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="label">Resumo *</span>
                    <button type="button" className="text-xs btn px-2 py-1" onClick={copyPartnerBrief} title="Copia brief auto-contido para Claude/ChatGPT">📋 Gerar brief</button>
                  </div>
                  <textarea required className="input min-h-[60px]" value={iform.summary} onChange={(e) => setIform({ ...iform, summary: e.target.value })} />
                </div>
                <div><div className="label mb-1">Próximo passo</div><input className="input" value={iform.nextStep} onChange={(e) => setIform({ ...iform, nextStep: e.target.value })} /></div>
                <div><div className="label mb-1">Data próximo passo</div><input type="date" className="input" value={iform.nextStepDate} onChange={(e) => setIform({ ...iform, nextStepDate: e.target.value })} /></div>
                <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn" onClick={() => setIntOpen(false)}>Cancelar</button><button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>Guardar</button></div>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Notas</h3>
            <textarea className="input min-h-[120px]" defaultValue={partner.notes || ""} onBlur={(e) => e.target.value !== (partner.notes || "") && patch({ notes: e.target.value })} />
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Contacto</h3>
            <div className="space-y-2 text-sm">
              {partner.email && <a href={`mailto:${partner.email}`} className="btn w-full justify-start"><Mail size={14} /> {partner.email}</a>}
              {partner.linkedinUrl && <a href={partner.linkedinUrl} target="_blank" rel="noopener" className="btn w-full justify-start"><Linkedin size={14} /> LinkedIn</a>}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Métricas</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="label">Leads trazidos</dt><dd className="font-semibold">{partner.leadsBrought}</dd></div>
              <div className="flex justify-between"><dt className="label">Receita</dt><dd className="font-semibold">{partner.revenueFromPartner}€</dd></div>
            </dl>
            <button className="btn w-full mt-3" onClick={openLinkLead}><Plus size={14} /> Vincular lead</button>
          </div>
        </div>
      </div>

      {linkOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20 p-4" onClick={() => setLinkOpen(false)}>
          <div className="bg-surface border border-border rounded-lg w-full max-w-xl max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-surface p-4 border-b border-border font-semibold">Vincular lead a {partner.name}</div>
            <div className="p-4 space-y-1">
              {leads.map((l) => (
                <button key={l.id} className="w-full text-left p-2 rounded hover:bg-surface2 text-sm" onClick={() => linkLead(l.id)}>
                  <div>{l.name}</div>
                  <div className="text-xs text-muted">{l.company || "—"} · {l.status}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

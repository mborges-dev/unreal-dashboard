"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { StarsRating } from "@/components/StarsRating";
import { Timeline, type TimelineEvent } from "@/components/Timeline";

const PURPLE = "#A855F7";
const STATUSES = ["identificado", "abordado", "em_negociacao", "agendado", "publicado", "sem_resposta", "recusado"];

export default function MediaDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [outlet, setOutlet] = useState<any>(null);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitchForm, setPitchForm] = useState({ topic: "", message: "", date: new Date().toISOString().slice(0, 10) });
  const [templates, setTemplates] = useState<any[]>([]);

  const load = useCallback(async () => {
    const r = await fetch(`/api/growth/media/${params.id}`);
    if (r.ok) setOutlet(await r.json());
  }, [params.id]);

  useEffect(() => { load(); fetch("/api/growth/templates").then((r) => r.json()).then(setTemplates); }, [load]);

  async function patch(body: any) {
    await fetch(`/api/growth/media/${params.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  async function addPitch(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/growth/media/${params.id}/pitch`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(pitchForm) });
    setPitchOpen(false);
    setPitchForm({ topic: "", message: "", date: new Date().toISOString().slice(0, 10) });
    load();
  }

  async function del() {
    if (!confirm("Eliminar este outlet?")) return;
    await fetch(`/api/growth/media/${params.id}`, { method: "DELETE" });
    router.push("/growth/media");
  }

  function usePodcastTemplate() {
    const t = templates.find((x) => x.format === "pitch_externo");
    if (t) setPitchForm({ ...pitchForm, message: t.structure });
  }

  async function copyPitchBrief() {
    if (!pitchForm.topic.trim()) { alert("Define o tópico primeiro."); return; }
    const url = `/api/growth/brief?type=pitch&id=${params.id}&topic=${encodeURIComponent(pitchForm.topic)}`;
    const r = await fetch(url);
    const text = await r.text();
    await navigator.clipboard.writeText(text);
    alert("Brief copiado. Cola numa conversa Claude/ChatGPT para gerar o pitch.");
  }

  if (!outlet) return <div className="p-6 text-muted">A carregar...</div>;

  const events: TimelineEvent[] = (outlet.pitches || []).map((p: any) => ({
    id: p.id,
    date: p.date,
    title: p.topic,
    body: [p.message, p.response && `→ ${p.response}`].filter(Boolean).join("\n\n"),
    meta: [p.outcome, p.finalUrl && "🔗"].filter(Boolean).join(" · "),
    tone: p.outcome === "aceite" ? "success" : p.outcome === "recusado" ? "warn" : "default",
  }));

  return (
    <>
      <PageHeader
        title={outlet.name}
        subtitle={`${outlet.type} · ${outlet.audienceSize || "—"}`}
        actions={
          <>
            <button className="btn" onClick={() => { const d = prompt("Data agendada (YYYY-MM-DD):"); if (d) patch({ status: "agendado", notes: `${outlet.notes || ""}\nAgendado para ${d}` }); }}>Marcar agendado</button>
            <button className="btn" onClick={() => { const u = prompt("URL final publicada:"); if (u !== null) patch({ status: "publicado" }); }}>Marcar publicado</button>
            <button className="btn" onClick={() => patch({ status: "sem_resposta" })}>Sem resposta</button>
            <button className="btn text-red-400" onClick={del}><Trash2 size={14} /></button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <select className="input w-auto text-sm" value={outlet.status} onChange={(e) => patch({ status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <StarsRating value={outlet.fitScore} onChange={(n) => patch({ fitScore: n })} />
              {outlet.url && <a href={outlet.url} target="_blank" rel="noopener" className="link text-sm">{outlet.url}</a>}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Histórico de pitches ({outlet.pitches?.length || 0})</h3>
              <button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={() => setPitchOpen(true)}><Plus size={14} /> Novo pitch</button>
            </div>
            <Timeline events={events} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Notas</h3>
            <textarea className="input min-h-[120px]" defaultValue={outlet.notes || ""} onBlur={(e) => e.target.value !== (outlet.notes || "") && patch({ notes: e.target.value })} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Detalhes</h3>
            <dl className="text-sm space-y-2">
              <div><dt className="label">Tipo</dt><dd>{outlet.type}</dd></div>
              <div><dt className="label">{outlet.type === "podcast" ? "Host" : "Contacto"}</dt><dd>{outlet.host || outlet.editorialContact || "—"}</dd></div>
              <div><dt className="label">Audiência</dt><dd>{outlet.audienceSize || "—"}</dd></div>
              <div><dt className="label">Fit</dt><dd><StarsRating value={outlet.fitScore} /></dd></div>
            </dl>
          </div>
        </div>
      </div>

      <Modal open={pitchOpen} onClose={() => setPitchOpen(false)} title={`Novo pitch — ${outlet.name}`}>
        <form onSubmit={addPitch} className="space-y-3">
          <div><div className="label mb-1">Tópico *</div><input required className="input" value={pitchForm.topic} onChange={(e) => setPitchForm({ ...pitchForm, topic: e.target.value })} /></div>
          <div><div className="label mb-1">Data</div><input type="date" className="input" value={pitchForm.date} onChange={(e) => setPitchForm({ ...pitchForm, date: e.target.value })} /></div>
          <div>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="label">Mensagem</span>
              <div className="flex items-center gap-2">
                <button type="button" className="text-xs btn px-2 py-1" onClick={copyPitchBrief} title="Copia brief auto-contido para Claude/ChatGPT">📋 Gerar brief</button>
                {outlet.type === "podcast" && <button type="button" className="text-xs link" onClick={usePodcastTemplate}>Usar template</button>}
              </div>
            </div>
            <textarea className="input min-h-[200px] font-mono text-xs" value={pitchForm.message} onChange={(e) => setPitchForm({ ...pitchForm, message: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><button type="button" className="btn" onClick={() => setPitchOpen(false)}>Cancelar</button><button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>Enviar pitch</button></div>
        </form>
      </Modal>
    </>
  );
}

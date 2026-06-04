"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PenLine, Plus, FileText, Calendar as CalendarIcon, Lightbulb, Heart, MessageCircle, Target } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Modal } from "@/components/Modal";

const PURPLE = "#A855F7";

const PILLARS = ["auditoria", "integracao", "distribuicao", "autoridade"];
const FORMATS = ["post_linkedin", "artigo_longo", "case_study", "twitter_thread", "pitch_externo"];
const COLUMNS = [
  { id: "ideia", label: "Ideia" },
  { id: "rascunho", label: "Rascunho" },
  { id: "agendado", label: "Agendado" },
  { id: "publicado", label: "Publicado" },
];

const PILLAR_COLOR: Record<string, string> = {
  auditoria: "bg-blue-900/40 border-blue-800",
  integracao: "bg-emerald-900/40 border-emerald-800",
  distribuicao: "bg-amber-900/40 border-amber-800",
  autoridade: "bg-purple-900/40 border-purple-800",
};

export default function ContentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState("");
  const [pillar, setPillar] = useState("");
  const [format, setFormat] = useState("");
  const [form, setForm] = useState({ title: "", hook: "", angle: "", pillar: "autoridade", format: "post_linkedin", tags: "" });

  async function reload() {
    const r = await fetch("/api/growth/content", { cache: "no-store" });
    setItems(await r.json());
  }
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => items.filter((i) => {
    if (!showArchived && i.status === "arquivado") return false;
    if (q && !(i.title || "").toLowerCase().includes(q.toLowerCase())) return false;
    if (pillar && i.pillar !== pillar) return false;
    if (format && i.format !== format) return false;
    return true;
  }), [items, showArchived, q, pillar, format]);

  async function moveTo(id: string, status: string) {
    await fetch(`/api/growth/content/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    reload();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/growth/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false);
    setForm({ title: "", hook: "", angle: "", pillar: "autoridade", format: "post_linkedin", tags: "" });
    reload();
  }

  return (
    <>
      <PageHeader
        title={<span><PenLine className="inline mr-2" size={18} style={{ color: PURPLE }} />Conteúdo</span>}
        subtitle={`${filtered.length} de ${items.length} ideias`}
        actions={
          <>
            <Link href="/growth/content/templates" className="btn"><FileText size={14} /> Templates</Link>
            <Link href="/growth/content/calendar" className="btn"><CalendarIcon size={14} /> Calendário</Link>
            <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ background: PURPLE, borderColor: PURPLE }}><Plus size={14} /> Nova ideia</button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <details className="card" style={{ borderColor: PURPLE, background: "rgba(168,85,247,0.05)" }}>
          <summary className="cursor-pointer text-sm font-medium inline-flex items-center gap-1.5"><Lightbulb size={14} style={{ color: PURPLE }} /> Como usar este kanban</summary>
          <div className="mt-3 text-sm text-muted space-y-1">
            <p>Cada cartão é uma ideia de post. Arrasta entre colunas conforme avança:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li><strong>Ideia</strong> → cartão criado, sem trabalho ainda feito</li>
              <li><strong>Rascunho</strong> → começaste a escrever o body</li>
              <li><strong>Agendado</strong> → tem <code>scheduledFor</code> definido, aparece no calendário</li>
              <li><strong>Publicado</strong> → publicaste; preenche métricas no detalhe</li>
            </ul>
            <p className="mt-2"><strong>Clica no cartão</strong> para abrir o detalhe, aplicar template e escrever o body.</p>
          </div>
        </details>
        <div className="grid grid-cols-5 gap-2">
          <input className="input col-span-2" placeholder="Procurar..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={pillar} onChange={(e) => setPillar(e.target.value)}>
            <option value="">Todos os pilares</option>
            {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">Todos os formatos</option>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Mostrar arquivados
          </label>
        </div>

        <KanbanBoard
          columns={COLUMNS}
          items={filtered}
          onMove={moveTo}
          renderCard={(it: any) => (
            <div onClick={() => setDetail(it)} className="cursor-pointer">
              <div className="text-sm font-medium mb-2 line-clamp-3">{it.title}</div>
              <div className="flex flex-wrap gap-1 mb-1">
                {it.pillar && <span className={`badge ${PILLAR_COLOR[it.pillar] || ""}`}>{it.pillar}</span>}
                <span className="badge text-xs">{it.format}</span>
              </div>
              {it.scheduledFor && it.status === "agendado" && (
                <div className="text-xs text-muted mt-2 inline-flex items-center gap-1"><CalendarIcon size={11} /> {new Date(it.scheduledFor).toLocaleDateString("pt-PT")}</div>
              )}
              {it.status === "publicado" && (
                <div className="text-xs text-muted mt-2 flex gap-3">
                  {it.likes != null && <span className="inline-flex items-center gap-1"><Heart size={11} /> {it.likes}</span>}
                  {it.comments != null && <span className="inline-flex items-center gap-1"><MessageCircle size={11} /> {it.comments}</span>}
                  {it.leadsGenerated > 0 && <span className="inline-flex items-center gap-1 text-emerald-400"><Target size={11} /> {it.leadsGenerated} leads</span>}
                </div>
              )}
            </div>
          )}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova ideia de conteúdo">
        <form onSubmit={create} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><div className="label mb-1">Título *</div><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="col-span-2"><div className="label mb-1">Hook (frase de abertura)</div><input className="input" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} /></div>
          <div className="col-span-2"><div className="label mb-1">Angle (o ângulo único)</div><input className="input" value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} /></div>
          <div>
            <div className="label mb-1">Pilar</div>
            <select className="input" value={form.pillar} onChange={(e) => setForm({ ...form, pillar: e.target.value })}>
              {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1">Format</div>
            <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="col-span-2"><div className="label mb-1">Tags</div><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ai, retalho, b2b" /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>Criar</button>
          </div>
        </form>
      </Modal>

      <DetailPanel key={detail?.id || "none"} idea={detail} onClose={() => setDetail(null)} onSaved={() => { setDetail(null); reload(); }} />
    </>
  );
}

function DetailPanel({ idea, onClose, onSaved }: { idea: any; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<any>(idea);
  const [templates, setTemplates] = useState<any[]>([]);
  useEffect(() => { setD(idea); if (idea) fetch("/api/growth/templates").then((r) => r.json()).then(setTemplates); }, [idea]);
  if (!idea || !d) return null;

  async function save() {
    const payload: any = { ...d };
    delete payload.id; delete payload.createdAt; delete payload.updatedAt;
    await fetch(`/api/growth/content/${idea.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    onSaved();
  }

  async function applyTemplate(t: any) {
    setD({ ...d, body: t.structure });
    await fetch(`/api/growth/templates/${t.id}`, { method: "POST" });
  }

  async function copyBrief() {
    const r = await fetch(`/api/growth/brief?type=content&id=${idea.id}`);
    const text = await r.text();
    await navigator.clipboard.writeText(text);
    alert("Brief copiado. Cola numa conversa Claude/ChatGPT para gerar o post.");
  }

  async function del() {
    if (!confirm("Eliminar esta ideia?")) return;
    await fetch(`/api/growth/content/${idea.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <Modal open={!!idea} onClose={onClose} title={idea.title}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><div className="label mb-1">Título</div><input className="input" value={d.title || ""} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
        <div className="col-span-2"><div className="label mb-1">Hook</div><input className="input" value={d.hook || ""} onChange={(e) => setD({ ...d, hook: e.target.value })} /></div>
        <div className="col-span-2"><div className="label mb-1">Angle</div><input className="input" value={d.angle || ""} onChange={(e) => setD({ ...d, angle: e.target.value })} /></div>
        <div>
          <div className="label mb-1">Pilar</div>
          <select className="input" value={d.pillar || ""} onChange={(e) => setD({ ...d, pillar: e.target.value })}>
            <option value="">—</option>
            {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div className="label mb-1">Format</div>
          <select className="input" value={d.format || ""} onChange={(e) => setD({ ...d, format: e.target.value })}>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <div className="label mb-1">Estado</div>
          <select className="input" value={d.status || ""} onChange={(e) => setD({ ...d, status: e.target.value })}>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
        <div>
          <div className="label mb-1">Agendado para</div>
          <input type="date" className="input" value={d.scheduledFor?.slice(0, 10) || ""} onChange={(e) => setD({ ...d, scheduledFor: e.target.value || null })} />
        </div>
        {d.status === "publicado" && (
          <>
            <div><div className="label mb-1">Plataforma</div><input className="input" value={d.platform || ""} onChange={(e) => setD({ ...d, platform: e.target.value })} placeholder="linkedin, medium..." /></div>
            <div><div className="label mb-1">URL publicado</div><input className="input" value={d.publishedUrl || ""} onChange={(e) => setD({ ...d, publishedUrl: e.target.value })} /></div>
            <div><div className="label mb-1">Views</div><input type="number" className="input" value={d.views ?? ""} onChange={(e) => setD({ ...d, views: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div><div className="label mb-1">Likes</div><input type="number" className="input" value={d.likes ?? ""} onChange={(e) => setD({ ...d, likes: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div><div className="label mb-1">Comentários</div><input type="number" className="input" value={d.comments ?? ""} onChange={(e) => setD({ ...d, comments: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div><div className="label mb-1">Shares</div><input type="number" className="input" value={d.shares ?? ""} onChange={(e) => setD({ ...d, shares: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div className="col-span-2"><div className="label mb-1">Leads gerados</div><input type="number" className="input" value={d.leadsGenerated ?? 0} onChange={(e) => setD({ ...d, leadsGenerated: parseInt(e.target.value) || 0 })} /></div>
          </>
        )}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="label">Body (markdown)</span>
            <div className="flex items-center gap-2">
              <button type="button" className="text-xs btn px-2 py-1" onClick={copyBrief} title="Copia um brief auto-contido para colares numa conversa Claude/ChatGPT">📋 Gerar brief</button>
              <select className="text-xs bg-surface2 border border-border rounded px-2 py-1" onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); if (t) applyTemplate(t); e.target.value = ""; }}>
                <option value="">Aplicar template...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <textarea className="input min-h-[200px] font-mono text-xs" value={d.body || ""} onChange={(e) => setD({ ...d, body: e.target.value })} />
        </div>
        <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[60px]" value={d.notes || ""} onChange={(e) => setD({ ...d, notes: e.target.value })} /></div>
        <div className="col-span-2 flex justify-between gap-2">
          <button className="btn text-red-400" onClick={del}>Eliminar</button>
          <div className="flex gap-2">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={save}>Guardar</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

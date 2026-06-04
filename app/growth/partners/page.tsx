"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Handshake, Plus, Lightbulb, Target } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { StarsRating } from "@/components/StarsRating";

const PURPLE = "#A855F7";

const COLUMNS = [
  { id: "a_abordar", label: "A abordar" },
  { id: "abordado", label: "Abordado" },
  { id: "reuniao_agendada", label: "Reunião agendada" },
  { id: "reuniao_feita", label: "Reunião feita" },
  { id: "parceria_activa", label: "Parceria activa" },
];

const TYPES = ["consultora", "software_house", "lean_processos", "outro"];

export default function PartnersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [minFit, setMinFit] = useState(0);
  const [showArchive, setShowArchive] = useState(false);
  const [form, setForm] = useState({ name: "", contactName: "", contactRole: "", email: "", linkedinUrl: "", type: "consultora", fitScore: 3, notes: "" });

  async function reload() {
    setItems(await fetch("/api/growth/partners").then((r) => r.json()));
  }
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    if (q) {
      const hay = `${p.name} ${p.contactName}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (type && p.type !== type) return false;
    if (minFit > 0 && (p.fitScore || 0) < minFit) return false;
    return true;
  }), [items, q, type, minFit]);

  const active = filtered.filter((p) => !["dormente", "perdido"].includes(p.status));
  const archived = filtered.filter((p) => ["dormente", "perdido"].includes(p.status));

  async function move(id: string, status: string) {
    await fetch(`/api/growth/partners/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    reload();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/growth/partners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false);
    setForm({ name: "", contactName: "", contactRole: "", email: "", linkedinUrl: "", type: "consultora", fitScore: 3, notes: "" });
    reload();
  }

  return (
    <>
      <PageHeader
        title={<span><Handshake className="inline mr-2" size={18} style={{ color: PURPLE }} />Parcerias</span>}
        subtitle={`${active.length} activas · ${archived.length} arquivadas`}
        actions={<button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={() => setOpen(true)}><Plus size={14} /> Nova parceria</button>}
      />
      <div className="p-6 space-y-4">
        <details className="card" style={{ borderColor: PURPLE, background: "rgba(168,85,247,0.05)" }}>
          <summary className="cursor-pointer text-sm font-medium inline-flex items-center gap-1.5"><Lightbulb size={14} style={{ color: PURPLE }} /> Como usar Parcerias</summary>
          <div className="mt-3 text-sm text-muted space-y-1">
            <p>Parceiros = consultoras / software houses que podem trazer projectos. Cada parceria activa é um canal de leads gratuito.</p>
            <ol className="list-decimal pl-5 space-y-0.5">
              <li>Começam em <strong>A abordar</strong></li>
              <li>Após primeiro email/LinkedIn → <strong>Abordado</strong></li>
              <li>Reunião marcada → <strong>Reunião agendada</strong>; depois <strong>Reunião feita</strong></li>
              <li>Quando há acordo → <strong>Parceria activa</strong> (cria automaticamente tarefa de follow-up trimestral)</li>
            </ol>
            <p className="mt-2">Dentro de cada parceiro, regista as interacções com próximo passo + data — aparece no calendário automaticamente. Quando um lead é referenciado, usa "Vincular lead" para contabilizar.</p>
          </div>
        </details>
        <div className="grid grid-cols-4 gap-2">
          <input className="input" placeholder="Procurar..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos os tipos</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input" value={minFit} onChange={(e) => setMinFit(parseInt(e.target.value))}>
            <option value={0}>Qualquer fit</option>
            {[3, 4, 5].map((n) => <option key={n} value={n}>Fit ≥ {n}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={showArchive} onChange={(e) => setShowArchive(e.target.checked)} /> Mostrar arquivados</label>
        </div>

        <KanbanBoard
          columns={COLUMNS}
          items={active}
          onMove={move}
          renderCard={(p: any) => (
            <Link href={`/growth/partners/${p.id}`} className="block">
              <div className="font-medium text-sm">{p.name}</div>
              <div className="text-xs text-muted mt-1">{p.contactName} {p.contactRole && `· ${p.contactRole}`}</div>
              <div className="flex items-center justify-between mt-2">
                <StarsRating value={p.fitScore} size={12} />
                {p.leadsBrought > 0 && <span className="badge bg-emerald-900/40 border-emerald-800 text-xs inline-flex items-center gap-1"><Target size={10} /> {p.leadsBrought}</span>}
              </div>
              {p.lastInteractionDate && <div className="text-xs text-muted mt-1">há {Math.floor((Date.now() - new Date(p.lastInteractionDate).getTime()) / 86400000)}d</div>}
            </Link>
          )}
        />

        {showArchive && archived.length > 0 && (
          <div className="card">
            <h3 className="label mb-2">Arquivados</h3>
            <div className="space-y-1 text-sm">
              {archived.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <Link className="link" href={`/growth/partners/${p.id}`}>{p.name}</Link>
                  <span className="text-muted text-xs">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova parceria potencial">
        <form onSubmit={create} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><div className="label mb-1">Empresa *</div><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><div className="label mb-1">Contacto</div><input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
          <div><div className="label mb-1">Cargo</div><input className="input" value={form.contactRole} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} /></div>
          <div><div className="label mb-1">Email</div><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><div className="label mb-1">LinkedIn URL</div><input className="input" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} /></div>
          <div>
            <div className="label mb-1">Tipo</div>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1">Fit</div>
            <StarsRating value={form.fitScore} onChange={(n) => setForm({ ...form, fitScore: n })} />
          </div>
          <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>Criar</button></div>
        </form>
      </Modal>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";

const PURPLE = "#A855F7";
const FORMATS = ["post_linkedin", "artigo_longo", "case_study", "twitter_thread", "pitch_externo"];

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", format: "post_linkedin", structure: "", description: "" });

  async function reload() {
    setItems(await fetch("/api/growth/templates").then((r) => r.json()));
  }
  useEffect(() => { reload(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/growth/templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false);
    setForm({ name: "", format: "post_linkedin", structure: "", description: "" });
    reload();
  }
  async function save() {
    if (!editing) return;
    await fetch(`/api/growth/templates/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: editing.name, format: editing.format, structure: editing.structure, description: editing.description }) });
    setEditing(null);
    reload();
  }
  async function del(id: string) {
    if (!confirm("Eliminar template?")) return;
    await fetch(`/api/growth/templates/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <>
      <PageHeader
        title="Templates de conteúdo"
        subtitle={`${items.length} templates`}
        actions={<button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={() => setOpen(true)}><Plus size={14} /> Novo template</button>}
      />
      <div className="p-6 space-y-3">
        {items.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge">{t.format}</span>
                  <span className="text-xs text-muted">Usado {t.timesUsed}x</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => setEditing(t)}>Editar</button>
                <button className="btn text-red-400" onClick={() => del(t.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans bg-surface2 p-3 rounded border border-border">{t.structure}</pre>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo template">
        <form onSubmit={create} className="space-y-3">
          <div><div className="label mb-1">Nome *</div><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <div className="label mb-1">Format</div>
            <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div><div className="label mb-1">Descrição</div><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><div className="label mb-1">Estrutura (markdown com placeholders {"{var}"})</div><textarea required className="input min-h-[200px] font-mono text-xs" value={form.structure} onChange={(e) => setForm({ ...form, structure: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>Criar</button></div>
        </form>
      </Modal>

      {editing && (
        <Modal open={true} onClose={() => setEditing(null)} title={`Editar: ${editing.name}`}>
          <div className="space-y-3">
            <div><div className="label mb-1">Nome</div><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div>
              <div className="label mb-1">Format</div>
              <select className="input" value={editing.format} onChange={(e) => setEditing({ ...editing, format: e.target.value })}>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div><div className="label mb-1">Descrição</div><input className="input" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><div className="label mb-1">Estrutura</div><textarea className="input min-h-[200px] font-mono text-xs" value={editing.structure} onChange={(e) => setEditing({ ...editing, structure: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><button className="btn" onClick={() => setEditing(null)}>Cancelar</button><button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={save}>Guardar</button></div>
          </div>
        </Modal>
      )}
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { fmtDate } from "@/lib/utils";

const COLUMNS = [
  { id: "aberta", label: "Aberta" },
  { id: "em-progresso", label: "Em Progresso" },
  { id: "concluida", label: "Concluída" },
];
const PRIORITIES = ["baixa", "normal", "alta", "urgente"];

export default function Tasks() {
  const params = useParams<{ project: string }>();
  const [tasks, setTasks] = useState<any[]>([]);
  const [priority, setPriority] = useState("");
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState<string | null>(null);

  async function reload() {
    const r = await fetch(`/api/tasks?projectId=${params.project}`);
    setTasks(await r.json());
  }
  useEffect(() => { reload(); }, [params.project]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: params.project, title, priority: "normal" }) });
    setTitle("");
    reload();
  }

  async function move(id: string, status: string) {
    await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    reload();
  }

  const filtered = tasks.filter((t) => !priority || t.priority === priority);

  return (
    <>
      <PageHeader title="Tarefas" />
      <div className="p-6 space-y-4">
        <form onSubmit={add} className="flex gap-2">
          <input className="input flex-1" placeholder="Nova tarefa..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="input w-48" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Todas as prioridades</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn btn-primary">+ Adicionar</button>
        </form>
        <div className="grid grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="card min-h-[400px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drag && move(drag, col.id)}
            >
              <h3 className="font-semibold mb-3 text-sm">{col.label} <span className="text-muted">({filtered.filter((t) => t.status === col.id).length})</span></h3>
              <div className="space-y-2">
                {filtered.filter((t) => t.status === col.id).map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDrag(t.id)}
                    onDragEnd={() => setDrag(null)}
                    className="p-3 bg-surface2 rounded border border-border cursor-move text-sm"
                  >
                    <div>{t.title}</div>
                    <div className="text-xs text-muted mt-1 flex gap-2">
                      <span className="badge">{t.priority}</span>
                      {t.dueDate && <span>{fmtDate(t.dueDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

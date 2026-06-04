"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const PURPLE = "#A855F7";

export default function ContentCalendar() {
  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { fetch("/api/growth/content").then((r) => r.json()).then(setItems); }, []);

  const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const days = useMemo(() => {
    const first = new Date(cursor);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startWeekday = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [cursor]);

  const byDay: Record<string, { id: string; title: string; status: string }[]> = {};
  for (const it of items) {
    const d = it.scheduledFor || it.publishedAt;
    if (!d) continue;
    const k = isoLocal(new Date(d));
    (byDay[k] ||= []).push({ id: it.id, title: it.title, status: it.status });
  }

  return (
    <>
      <PageHeader
        title={`Calendário de conteúdo — ${cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}`}
        actions={
          <>
            <button className="btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>◀</button>
            <button className="btn" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Hoje</button>
            <button className="btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>▶</button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => <div key={d} className="bg-surface p-2 text-xs label text-center">{d}</div>)}
            {days.map((d, i) => {
              if (!d) return <div key={i} className="bg-surface min-h-[90px]" />;
              const k = isoLocal(d);
              const es = byDay[k] || [];
              const isToday = k === isoLocal(new Date());
              return (
                <button key={i} onClick={() => setSelected(k)} className={`bg-surface min-h-[90px] p-1.5 text-left text-xs hover:bg-surface2 ${isToday ? "ring-1 ring-purple-500" : ""} ${selected === k ? "bg-surface2" : ""}`}>
                  <div className="font-semibold mb-1">{d.getDate()}</div>
                  <div className="flex flex-wrap gap-0.5">
                    {es.slice(0, 4).map((e) => <span key={e.id} className="w-2 h-2 rounded-full" style={{ background: e.status === "publicado" ? "#10B981" : PURPLE }} />)}
                    {es.length > 4 && <span className="text-muted">+{es.length - 4}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-muted flex gap-3">
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: PURPLE }} /> Agendado</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Publicado</span>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">{selected ? new Date(selected + "T12:00:00").toLocaleDateString("pt-PT") : "Selecciona um dia"}</h3>
          <div className="space-y-2 text-sm">
            {selected && (byDay[selected] || []).map((e) => (
              <div key={e.id}><Link href="/growth/content" className="link inline-flex items-center gap-1.5"><FileText size={12} /> {e.title}</Link></div>
            ))}
            {selected && !(byDay[selected] || []).length && <p className="text-muted">Sem posts.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

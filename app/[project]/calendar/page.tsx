"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Send, Users2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

type Event = { id: string; date: Date; title: string; type: "lead" | "task" | "meeting" | "proposal" | "content" | "pitch" | "partner"; href?: string };

export default function CalendarPage() {
  const params = useParams<{ project: string }>();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [showGrowth, setShowGrowth] = useState({ content: true, pitches: true, partners: true });

  useEffect(() => {
    if (!params.project) return;
    (async () => {
      const safeFetch = async (url: string) => {
        try { const r = await fetch(url); if (!r.ok) return []; const j = await r.json(); return Array.isArray(j) ? j : []; }
        catch { return []; }
      };
      const isUnreal = params.project === "unreal";
      const isFreelance = params.project === "freelance";
      const [leads, tasks, proposals, content, mediaList, partners, freelanceLeads] = await Promise.all([
        isFreelance ? Promise.resolve([]) : safeFetch(`/api/leads?projectId=${params.project}`),
        safeFetch(`/api/tasks?projectId=${params.project}`),
        safeFetch(`/api/proposals?projectId=${params.project}`),
        isUnreal ? safeFetch(`/api/growth/content`) : Promise.resolve([]),
        isUnreal ? safeFetch(`/api/growth/media`) : Promise.resolve([]),
        isUnreal ? safeFetch(`/api/growth/partners`) : Promise.resolve([]),
        isFreelance ? safeFetch(`/api/freelance/leads`) : Promise.resolve([]),
      ]);
      const evs: Event[] = [];
      for (const l of leads) {
        if (l.nextDate) evs.push({ id: `l-${l.id}`, date: new Date(l.nextDate), title: `${l.name}: ${l.nextAction || "acção"}`, type: l.status === "reuniao-marcada" ? "meeting" : "lead", href: `/${params.project}/leads/${l.id}` });
      }
      for (const l of freelanceLeads) {
        if (l.nextActionDate) evs.push({ id: `fl-${l.id}`, date: new Date(l.nextActionDate), title: `${l.projectTitle}: ${l.nextAction || "acção"}`, type: "lead", href: `/freelance/leads` });
      }
      for (const t of tasks) if (t.dueDate) evs.push({ id: `t-${t.id}`, date: new Date(t.dueDate), title: t.title, type: "task" });
      for (const p of proposals) if (p.sentAt) evs.push({ id: `p-${p.id}`, date: new Date(p.sentAt), title: `Proposta: ${p.client}`, type: "proposal" });
      for (const c of content) {
        if (c.scheduledFor) evs.push({ id: `c-${c.id}`, date: new Date(c.scheduledFor), title: `Post: ${c.title}`, type: "content", href: `/growth/content` });
        if (c.publishedAt) evs.push({ id: `cp-${c.id}`, date: new Date(c.publishedAt), title: `Post: ${c.title} (publicado)`, type: "content", href: `/growth/content` });
      }
      for (const m of mediaList) {
        for (const pt of (m.pitches || [])) {
          evs.push({ id: `pt-${pt.id}`, date: new Date(pt.date), title: `Pitch ${m.name}: ${pt.topic}`, type: "pitch", href: `/growth/media/${m.id}` });
        }
      }
      for (const pr of partners) {
        for (const it of (pr.interactions || [])) {
          if (it.nextStepDate) evs.push({ id: `pn-${it.id}`, date: new Date(it.nextStepDate), title: `Parceiro ${pr.name}: ${it.nextStep}`, type: "partner", href: `/growth/partners/${pr.id}` });
        }
      }
      setEvents(evs);
    })();
  }, [params.project]);

  const visibleEvents = useMemo(() => events.filter((e) => {
    if (e.type === "content" && !showGrowth.content) return false;
    if (e.type === "pitch" && !showGrowth.pitches) return false;
    if (e.type === "partner" && !showGrowth.partners) return false;
    return true;
  }), [events, showGrowth]);

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

  const isoLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const evByDay: Record<string, Event[]> = {};
  for (const e of visibleEvents) {
    const k = isoLocal(e.date);
    (evByDay[k] ||= []).push(e);
  }

  const dotColor = (t: Event["type"]) =>
    t === "lead" ? "bg-blue-500" :
    t === "meeting" ? "bg-amber-500" :
    t === "task" ? "bg-red-500" :
    t === "content" || t === "partner" ? "bg-purple-500" :
    t === "pitch" ? "bg-amber-400" :
    "bg-zinc-500";

  return (
    <>
      <PageHeader
        title={cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
        actions={
          <>
            <button className="btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>◀</button>
            <button className="btn" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Hoje</button>
            <button className="btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>▶</button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-4 gap-4">
        {params.project === "unreal" && (
          <div className="col-span-4 flex items-center gap-4 text-xs -mb-2">
            <span className="label">Growth:</span>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showGrowth.content} onChange={(e) => setShowGrowth({ ...showGrowth, content: e.target.checked })} /> <FileText size={12} /> Posts</label>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showGrowth.pitches} onChange={(e) => setShowGrowth({ ...showGrowth, pitches: e.target.checked })} /> <Send size={12} /> Pitches</label>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showGrowth.partners} onChange={(e) => setShowGrowth({ ...showGrowth, partners: e.target.checked })} /> <Users2 size={12} /> Parceiros</label>
          </div>
        )}
        <div className="col-span-3">
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
              <div key={d} className="bg-surface p-2 text-xs label text-center">{d}</div>
            ))}
            {days.map((d, i) => {
              if (!d) return <div key={i} className="bg-surface min-h-[90px]" />;
              const k = isoLocal(d);
              const es = evByDay[k] || [];
              const isToday = k === isoLocal(new Date());
              return (
                <button
                  key={i}
                  onClick={() => setSelected(k)}
                  className={`bg-surface min-h-[90px] p-1.5 text-left text-xs hover:bg-surface2 ${isToday ? "ring-1 ring-blue-500" : ""} ${selected === k ? "bg-surface2" : ""}`}
                >
                  <div className="font-semibold mb-1">{d.getDate()}</div>
                  <div className="flex flex-wrap gap-0.5">
                    {es.slice(0, 4).map((e) => <span key={e.id} className={`w-2 h-2 rounded-full ${dotColor(e.type)}`} />)}
                    {es.length > 4 && <span className="text-muted">+{es.length - 4}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">{selected ? new Date(selected + "T12:00:00").toLocaleDateString("pt-PT") : "Selecciona um dia"}</h3>
          <div className="space-y-2 text-sm">
            {selected && (evByDay[selected] || []).map((e) => (
              <div key={e.id} className="flex items-start gap-2">
                <span className={`w-2 h-2 mt-1.5 rounded-full ${dotColor(e.type)}`} />
                {e.href ? <Link className="link" href={e.href}>{e.title}</Link> : <span>{e.title}</span>}
              </div>
            ))}
            {selected && !(evByDay[selected] || []).length && <p className="text-muted">Sem eventos.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

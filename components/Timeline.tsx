"use client";
import { fmtDate } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  date: Date | string;
  title: string;
  body?: string;
  meta?: string;
  tone?: "default" | "success" | "warn" | "info";
};

const TONE: Record<string, string> = {
  default: "border-border",
  success: "border-emerald-700",
  warn: "border-amber-700",
  info: "border-blue-700",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted italic">Sem eventos.</p>;
  return (
    <ol className="space-y-3 relative pl-4 border-l border-border">
      {events.map((e) => (
        <li key={e.id} className={`relative pl-3 border-l-2 ${TONE[e.tone || "default"]}`}>
          <div className="absolute -left-1.5 top-1 w-2 h-2 rounded-full bg-zinc-500" />
          <div className="text-xs text-muted">{fmtDate(e.date)} {e.meta && <span>· {e.meta}</span>}</div>
          <div className="font-medium text-sm">{e.title}</div>
          {e.body && <div className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{e.body}</div>}
        </li>
      ))}
    </ol>
  );
}

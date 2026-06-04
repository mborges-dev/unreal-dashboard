"use client";
import { Flame, Cloud, Snowflake } from "lucide-react";

const MAP: Record<string, { Cmp: any; color: string; label: string }> = {
  quente: { Cmp: Flame, color: "#ef4444", label: "quente" },
  morno: { Cmp: Cloud, color: "#f59e0b", label: "morno" },
  frio: { Cmp: Snowflake, color: "#60a5fa", label: "frio" },
};

export function TempIcon({ value, size = 14, withLabel = false }: { value: string | null | undefined; size?: number; withLabel?: boolean }) {
  if (!value) return <span className="text-muted">—</span>;
  const m = MAP[value];
  if (!m) return <span className="text-muted">{value}</span>;
  const Cmp = m.Cmp;
  return (
    <span className="inline-flex items-center gap-1">
      <Cmp size={size} style={{ color: m.color }} />
      {withLabel && <span>{m.label}</span>}
    </span>
  );
}

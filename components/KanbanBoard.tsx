"use client";
import { useState } from "react";

export type KanbanColumn = { id: string; label: string };
export type KanbanItem = { id: string; status: string };

export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  onMove,
  renderCard,
}: {
  columns: KanbanColumn[];
  items: T[];
  onMove: (id: string, newStatus: string) => void | Promise<void>;
  renderCard: (item: T) => React.ReactNode;
}) {
  const [drag, setDrag] = useState<string | null>(null);

  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((col) => {
        const colItems = items.filter((i) => i.status === col.id);
        return (
          <div
            key={col.id}
            className="card min-h-[420px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag) onMove(drag, col.id); setDrag(null); }}
          >
            <h3 className="font-semibold mb-3 text-sm flex justify-between">
              <span>{col.label}</span>
              <span className="text-muted font-normal">({colItems.length})</span>
            </h3>
            <div className="space-y-2">
              {colItems.map((it) => (
                <div
                  key={it.id}
                  draggable
                  onDragStart={() => setDrag(it.id)}
                  onDragEnd={() => setDrag(null)}
                  className="p-3 bg-surface2 rounded border border-border cursor-move hover:border-zinc-600 transition"
                >
                  {renderCard(it)}
                </div>
              ))}
              {colItems.length === 0 && <p className="text-xs text-muted italic">vazio</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

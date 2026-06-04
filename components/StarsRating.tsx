"use client";
import { Star } from "lucide-react";

export function StarsRating({ value, onChange, max = 5, size = 14 }: { value: number | null | undefined; onChange?: (n: number) => void; max?: number; size?: number }) {
  const v = value || 0;
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < v;
        const Cmp = onChange ? "button" : "span";
        return (
          <Cmp
            key={i}
            type={onChange ? "button" : undefined}
            onClick={onChange ? () => onChange(i + 1) : undefined}
            className={onChange ? "cursor-pointer" : ""}
            title={onChange ? `${i + 1}/${max}` : undefined}
          >
            <Star size={size} className={filled ? "text-amber-400 fill-amber-400" : "text-zinc-700"} />
          </Cmp>
        );
      })}
    </div>
  );
}

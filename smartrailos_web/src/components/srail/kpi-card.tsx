import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: "positive" | "negative" | "warning" | "neutral";
  icon?: ReactNode;
  hint?: string;
  className?: string;
}) {
  const tone =
    deltaTone === "positive"
      ? "text-success"
      : deltaTone === "negative"
        ? "text-danger"
        : deltaTone === "warning"
          ? "text-warning"
          : "text-accent-cyan";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/5 bg-obsidian-900 p-5 transition-colors hover:border-white/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <div className="mt-3 font-mono text-3xl font-bold tabular-nums text-white">{value}</div>
      <div className="mt-2 flex items-center justify-between">
        {delta && (
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", tone)}>{delta}</span>
        )}
        {hint && <span className="text-[10px] text-slate-600">{hint}</span>}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

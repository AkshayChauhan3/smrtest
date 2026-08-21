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
      ? "text-success bg-success/10 border-success/20"
      : deltaTone === "negative"
        ? "text-danger bg-danger/10 border-danger/20"
        : deltaTone === "warning"
          ? "text-warning bg-warning/10 border-warning/20"
          : "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-obsidian-900/60 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent-cyan/40 hover:shadow-2xl hover:shadow-accent-cyan/10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent opacity-50" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</p>
        {icon && (
          <span className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors group-hover:border-accent-cyan/40 group-hover:text-accent-cyan">
            {icon}
          </span>
        )}
      </div>

      <div className="relative mt-3 font-mono text-3xl font-extrabold tabular-nums text-white tracking-tight">
        {value}
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        {delta && (
          <span className={cn("rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider", tone)}>
            {delta}
          </span>
        )}
        {hint && <span className="font-mono text-[10px] text-slate-500">{hint}</span>}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

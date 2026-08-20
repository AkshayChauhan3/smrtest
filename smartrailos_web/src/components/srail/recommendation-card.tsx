import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { Recommendation } from "@/lib/mock/data";

const tone: Record<Recommendation["priority"], string> = {
  info: "border-accent-cyan/20 bg-accent-cyan/5",
  action: "border-warning/30 bg-warning/5",
  critical: "border-danger/40 bg-danger/5",
};
const dot: Record<Recommendation["priority"], string> = {
  info: "bg-accent-cyan",
  action: "bg-warning",
  critical: "bg-danger",
};
const btn: Record<Recommendation["priority"], string> = {
  info: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan hover:text-obsidian-950",
  action: "border-warning/40 bg-warning/15 text-warning hover:bg-warning hover:text-obsidian-950",
  critical: "border-danger/40 bg-danger/15 text-danger hover:bg-danger hover:text-white",
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className={cn("rounded-xl border bg-obsidian-900 p-5", tone[rec.priority])}>
      <div className="flex items-center gap-2">
        <span className={cn("size-2 animate-pulse-soft rounded-full", dot[rec.priority])} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white">
          AI Recommendation
        </span>
        <Sparkles className="ml-auto size-3.5 text-slate-500" />
      </div>
      <h4 className="mt-3 text-sm font-bold text-white">{rec.title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{rec.body}</p>
      <button
        className={cn(
          "mt-4 w-full rounded border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-all",
          btn[rec.priority],
        )}
      >
        {rec.action}
      </button>
    </div>
  );
}

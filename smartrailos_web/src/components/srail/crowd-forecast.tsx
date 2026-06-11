import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { CROWD_FORECAST } from "@/lib/mock/data";

export function CrowdForecast({ className }: { className?: string }) {
  const max = Math.max(...CROWD_FORECAST.map((f) => f.value));
  return (
    <div className={cn("rounded-xl border border-white/5 bg-obsidian-900 p-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
          Station Crowd Forecast
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-warning">
          <TrendingUp className="size-3" /> Surge expected +30m
        </span>
      </div>

      <div className="mt-6 flex h-40 items-end gap-2 md:gap-3">
        {CROWD_FORECAST.map((f, i) => {
          const h = (f.value / max) * 100;
          const isPeak = f.value === max;
          return (
            <div key={f.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-full w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all duration-700",
                    isPeak ? "bg-warning" : i === 0 ? "bg-accent-cyan" : "bg-accent-cyan/40",
                  )}
                  style={{ height: `${h}%` }}
                />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] tabular-nums text-slate-400">
                  {f.value.toLocaleString()}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {f.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

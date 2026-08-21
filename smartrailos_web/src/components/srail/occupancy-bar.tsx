import { cn } from "@/lib/utils";

export function OccupancyBar({
  value,
  label,
  className,
  showPaxCount,
}: {
  value: number;
  label?: string;
  className?: string;
  showPaxCount?: boolean;
}) {
  const status =
    value < 50 ? "bg-success" : value < 75 ? "bg-warning" : value < 90 ? "bg-orange-500" : "bg-danger";
  const text =
    value < 50 ? "text-success" : value < 75 ? "text-warning" : value < 90 ? "text-orange-400" : "text-danger";
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500">
          <span>{label}</span>
          <span className={cn("font-mono tabular-nums transition-colors", text)}>{value}%</span>
        </div>
      )}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/5">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", status)}
          style={{ width: `${value}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
          style={{ animationDuration: "2.4s" }}
        />
      </div>
    </div>
  );
}

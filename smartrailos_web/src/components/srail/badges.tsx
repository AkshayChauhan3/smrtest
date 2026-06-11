import { cn } from "@/lib/utils";
import { riskFor, RISK_TW, type Train } from "@/lib/mock/data";

export function RiskBadge({ train, className }: { train: Train; className?: string }) {
  const risk = riskFor(train);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        RISK_TW[risk],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {risk}
    </span>
  );
}

export function LineBadge({ line, className }: { line: "blue" | "red"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        line === "blue"
          ? "border-accent-blue-2/30 bg-accent-blue/15 text-accent-blue-2"
          : "border-danger/30 bg-danger/15 text-danger",
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", line === "blue" ? "bg-accent-blue-2" : "bg-danger")}
      />
      {line === "blue" ? "Blue Line" : "Red Line"}
    </span>
  );
}

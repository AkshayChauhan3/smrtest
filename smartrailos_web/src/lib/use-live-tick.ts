import { useEffect, useState } from "react";

export function useLiveTick(intervalMs = 3000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

export function jitter(value: number, amplitude = 3, min = 0, max = 100) {
  const next = value + (Math.random() - 0.5) * amplitude * 2;
  return Math.max(min, Math.min(max, Math.round(next)));
}

export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour12: false });
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatEta(seconds: number) {
  if (seconds <= 0) return "Now";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

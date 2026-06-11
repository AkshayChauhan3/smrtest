import { useEffect, useState } from "react";
export function useEmergencyStatus(pollMs = 5000) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/public/emergency-status", {
          headers: { accept: "application/json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { active?: boolean };
        if (!cancelled) setActive(Boolean(data.active));
      } catch {
      }
    };
    check();
    const id = window.setInterval(check, pollMs);
    const onManual = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setActive(Boolean(detail));
    };
    window.addEventListener("srail:emergency", onManual);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("srail:emergency", onManual);
    };
  }, [pollMs]);
  return active;
}

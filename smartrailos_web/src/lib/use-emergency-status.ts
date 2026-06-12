import { useEffect, useState } from "react";
import { apiFetch } from "./api/client";

/**
 * Polls the backend for an active emergency. If the request indicates an
 * active emergency, the Emergency button in the topnav will blink red.
 *
 * For local/manual testing you can also toggle from the browser console:
 *   window.dispatchEvent(new CustomEvent("srail:emergency", { detail: true }))
 *   window.dispatchEvent(new CustomEvent("srail:emergency", { detail: false }))
 */
export function useEmergencyStatus(pollMs = 5000) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const data = await apiFetch<{ active: boolean }>("/alerts/emergency");
        if (!cancelled) setActive(Boolean(data.active));
      } catch {
        // network/backend not available — leave state as-is
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

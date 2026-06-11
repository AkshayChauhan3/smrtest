import { useEffect, useState } from "react";
import { TRAINS, type Train } from "@/lib/mock/data";

// Live train state. When VITE_REALTIME_WS_URL is set, subscribes to the
// backend WebSocket. Otherwise simulates ticks locally so the UI feels live.
export function useLiveTrains(): Train[] {
  const [trains, setTrains] = useState<Train[]>(TRAINS);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_REALTIME_WS_URL as string | undefined;

    if (wsUrl) {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (Array.isArray(data)) setTrains(data);
        } catch {
          // ignore malformed frames
        }
      };
      return () => ws.close();
    }

    const id = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => {
          const eta = Math.max(0, t.etaSeconds - 1);
          return eta === t.etaSeconds ? t : { ...t, etaSeconds: eta };
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return trains;
}

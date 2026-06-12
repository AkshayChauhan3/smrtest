import { useEffect } from "react";
import { type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queries";

export function useGlobalWebSocket(qc: QueryClient) {
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_REALTIME_WS_URL as string | undefined;
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.event_type) {
          if (data.event_type === "occupancy_update") {
             qc.invalidateQueries({ queryKey: queryKeys.trains });
             qc.invalidateQueries({ queryKey: queryKeys.snapshot });
             qc.invalidateQueries({ queryKey: queryKeys.kpi });
             if (data.data?.station_id) {
               qc.invalidateQueries({ queryKey: queryKeys.stationCurrent(data.data.station_id) });
               qc.invalidateQueries({ queryKey: queryKeys.stationFeature(data.data.station_id) });
             }
          }
          if (data.event_type === "alert_issued" || data.event_type === "alert_resolved") {
             qc.invalidateQueries({ queryKey: queryKeys.alerts });
             qc.invalidateQueries({ queryKey: queryKeys.snapshot });
          }
        }
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [qc]);
}

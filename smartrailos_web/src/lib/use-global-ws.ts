import { useEffect } from "react";
import { type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queries";

export function useGlobalWebSocket(qc: QueryClient) {
  useEffect(() => {
    const rawWs = import.meta.env.VITE_REALTIME_WS_URL as string | undefined;
    const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const wsUrl = rawWs || (apiBase ? apiBase.replace(/^http/, "ws") + "/api/v1/ws/realtime" : undefined);
    if (!wsUrl) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);

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

        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };
        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [qc]);
}

import { useEffect, useRef } from "react";
import { type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queries";

export function useGlobalWebSocket(qc: QueryClient) {
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_REALTIME_WS_URL as string | undefined;
    if (!wsUrl || typeof wsUrl !== "string") return;

    const endpoint: string = wsUrl;
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        socket = new WebSocket(endpoint);

        socket.onopen = () => {
          retryCount = 0; // reset on successful connection
        };

        socket.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (!data || !data.event_type) return;

            const client = qcRef.current;
            const eventType = data.event_type;

            if (eventType === "occupancy_update" || eventType === "simulation_tick") {
              client.invalidateQueries({ queryKey: queryKeys.trains });
              client.invalidateQueries({ queryKey: queryKeys.snapshot });
              client.invalidateQueries({ queryKey: queryKeys.kpi });
              if (data.data?.station_id) {
                client.invalidateQueries({ queryKey: queryKeys.stationCurrent(data.data.station_id) });
                client.invalidateQueries({ queryKey: queryKeys.stationFeature(data.data.station_id) });
              }
            } else if (eventType === "alert_issued" || eventType === "alert_resolved") {
              client.invalidateQueries({ queryKey: queryKeys.alerts });
              client.invalidateQueries({ queryKey: queryKeys.snapshot });
              client.invalidateQueries({ queryKey: queryKeys.kpi });
            } else if (eventType === "announcement_broadcast") {
              client.invalidateQueries({ queryKey: ["announcements"] });
            }
          } catch {
            // ignore malformed payloads
          }
        };

        socket.onerror = () => {
          // Trigger close to initiate retry
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };

        socket.onclose = () => {
          if (isUnmounted) return;
          // Exponential backoff: 1s, 2s, 4s, up to max 10s
          const backoff = Math.min(10000, 1000 * Math.pow(2, retryCount)) + Math.random() * 500;
          retryCount++;
          reconnectTimeout = setTimeout(connect, backoff);
        };
      } catch {
        if (!isUnmounted) {
          const backoff = Math.min(10000, 1000 * Math.pow(2, retryCount));
          retryCount++;
          reconnectTimeout = setTimeout(connect, backoff);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
    };
  }, []);
}

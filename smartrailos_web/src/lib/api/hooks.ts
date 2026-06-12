import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, USE_MOCK } from "./client";
import {
  alertsQuery,
  announcementsQuery,
  crowdForecastQuery,
  hourlyFlowQuery,
  kpiQuery,
  notificationsQuery,
  platformHeatmapQuery,
  queryKeys,
  recommendationsQuery,
  stationsQuery,
  trainQuery,
  trainsQuery,
  weeklyTrendQuery,
  stationCurrentQuery,
  stationFeatureQuery,
} from "./queries";

export const useTrains = () => useQuery(trainsQuery);
export const useTrain = (id: string) => useQuery(trainQuery(id));
export const useKpi = () => useQuery(kpiQuery);
export const useAlerts = () => useQuery(alertsQuery);
export const useRecommendations = () => useQuery(recommendationsQuery);
export const useAnnouncements = () => useQuery(announcementsQuery);
export const useNotifications = () => useQuery(notificationsQuery);
export const useStations = () => useQuery(stationsQuery);
export const useCrowdForecast = () => useQuery(crowdForecastQuery);
export const useHourlyFlow = () => useQuery(hourlyFlowQuery);
export const useWeeklyTrend = () => useQuery(weeklyTrendQuery);
export const usePlatformHeatmap = () => useQuery(platformHeatmapQuery);
export const useStationCurrent = (stationId: string) => useQuery(stationCurrentQuery(stationId));
export const useStationFeature = (stationId: string) => useQuery(stationFeatureQuery(stationId));

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      if (USE_MOCK) return { ok: true };
      return apiFetch<void>(
        `/alerts/${encodeURIComponent(alertId)}/acknowledge`,
        { method: "POST" },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

export function useBroadcastAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { text: string; context?: string }) => {
      if (USE_MOCK) return { ok: true };
      return apiFetch<{ ok: true }>("/announcements/broadcast", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, mockAsync, USE_MOCK } from "./client";
import {
  adaptAlert,
  adaptRecommendations,
  adaptStation,
  adaptTrain,
  kpiFromSnapshot,
  type BackendAlert,
  type BackendDashboardSnapshot,
  type BackendStation,
  type BackendTrainAtStation,
  type StationCurrentData,
  type StationFeatureData,
  type BackendKpiHistory,
} from "./smartrail";
import {
  TRAINS,
  KPI,
  ALERTS,
  RECOMMENDATIONS,
  ANNOUNCEMENTS,
  NOTIFICATIONS,
  STATIONS,
  CROWD_FORECAST,
  HOURLY_FLOW,
  WEEKLY_TREND,
  PLATFORM_HEATMAP,
  type Train,
  type Alert,
  type Recommendation,
  type Announcement,
  type Notification,
  type Station,
} from "@/lib/mock/data";

export const queryKeys = {
  trains: ["trains"] as const,
  train: (id: string) => ["trains", id] as const,
  kpi: ["kpi"] as const,
  alerts: ["alerts"] as const,
  recommendations: ["recommendations"] as const,
  announcements: ["announcements"] as const,
  notifications: ["notifications"] as const,
  stations: ["stations"] as const,
  stationCurrent: (stationId: string) => ["stations", stationId, "current"] as const,
  stationFeature: (stationId: string) => ["stations", stationId, "feature"] as const,
  snapshot: ["dashboard", "snapshot"] as const,
  kpiHistory: ["kpi", "history"] as const,
  crowdForecast: ["crowd", "forecast"] as const,
  hourlyFlow: ["analytics", "hourly"] as const,
  weeklyTrend: ["analytics", "weekly"] as const,
  platformHeatmap: ["platform", "heatmap"] as const,
};

const LIVE_REFETCH_MS = 5_000; // Match the simulation runner's 5-second tick

// ---------- Backend-backed queries ----------

export const snapshotQuery = queryOptions<BackendDashboardSnapshot | null>({
  queryKey: queryKeys.snapshot,
  queryFn: () =>
    USE_MOCK
      ? mockAsync(null)
      : apiFetch<BackendDashboardSnapshot>("/dashboard/snapshot"),
  refetchInterval: LIVE_REFETCH_MS,
  staleTime: 0,
});

export const trainsQuery = queryOptions<Train[]>({
  queryKey: queryKeys.trains,
  queryFn: async () => {
    if (USE_MOCK) return mockAsync(TRAINS);
    const list = await apiFetch<BackendTrainAtStation[]>("/trains/at-station");
    return list.map(adaptTrain);
  },
  refetchInterval: LIVE_REFETCH_MS,
  staleTime: 0,
});

export const trainQuery = (id: string) =>
  queryOptions<Train | undefined>({
    queryKey: queryKeys.train(id),
    queryFn: async () => {
      if (USE_MOCK) return mockAsync(TRAINS.find((t) => t.id === id));
      const list = await apiFetch<BackendTrainAtStation[]>("/trains/at-station");
      return list.map(adaptTrain).find((t) => t.id === id);
    },
  });

export const kpiQuery = queryOptions<typeof KPI>({
  queryKey: queryKeys.kpi,
  queryFn: async () => {
    if (USE_MOCK) return mockAsync(KPI);
    const snap = await apiFetch<BackendDashboardSnapshot>("/dashboard/snapshot");
    return kpiFromSnapshot(snap);
  },
  refetchInterval: LIVE_REFETCH_MS,
});

export const kpiHistoryQuery = queryOptions<BackendKpiHistory | null>({
  queryKey: queryKeys.kpiHistory,
  queryFn: () =>
    USE_MOCK
      ? mockAsync(null)
      : apiFetch<BackendKpiHistory>("/dashboard/kpi-history").catch(() => null),
  refetchInterval: 60_000, // once per minute is enough
  staleTime: 55_000,
});

export const alertsQuery = queryOptions<Alert[]>({
  queryKey: queryKeys.alerts,
  queryFn: async () => {
    if (USE_MOCK) return mockAsync(ALERTS);
    const list = await apiFetch<BackendAlert[]>("/alerts").catch(() => [] as BackendAlert[]);
    return list.map(adaptAlert);
  },
  refetchInterval: LIVE_REFETCH_MS,
});

export const recommendationsQuery = queryOptions<Recommendation[]>({
  queryKey: queryKeys.recommendations,
  queryFn: async () => {
    if (USE_MOCK) return mockAsync(RECOMMENDATIONS);
    const snap = await apiFetch<BackendDashboardSnapshot>(
      "/dashboard/snapshot",
    );
    return adaptRecommendations(snap.recommendations);
  },
  refetchInterval: LIVE_REFETCH_MS,
});

export const stationsQuery = queryOptions<Station[]>({
  queryKey: queryKeys.stations,
  queryFn: async () => {
    if (USE_MOCK) return mockAsync(STATIONS);
    const list = await apiFetch<BackendStation[]>("/stations");
    return list.map(adaptStation);
  },
  staleTime: 60 * 60_000,
});

export const stationCurrentQuery = (stationId: string) =>
  queryOptions<StationCurrentData>({
    queryKey: queryKeys.stationCurrent(stationId),
    queryFn: () =>
      USE_MOCK
        ? mockAsync({
            train_id: "BL-UP-01",
            current_passenger_count: 540,
            arrival_time: "12:05",
            departure_time: "12:06",
          })
        : apiFetch<StationCurrentData>(`/stations/${stationId}/current`),
    refetchInterval: LIVE_REFETCH_MS, // Live poll — ESP32 data updates every ~5s
    staleTime: 0,
  });

export const stationFeatureQuery = (stationId: string) =>
  queryOptions<StationFeatureData[]>({
    queryKey: queryKeys.stationFeature(stationId),
    queryFn: () =>
      USE_MOCK
        ? mockAsync([{
            train_id: "BL-UP-02",
            estimated_arrival_time: "12:15",
            estimated_departure_time: "12:16",
            estimated_passenger_incoming: 420,
            estimated_alighting: 120,
            estimated_boarding: 230,
            estimated_station_passenger_count: 530,
            coaches: [],
          }])
        : apiFetch<StationFeatureData[]>(`/stations/${stationId}/feature`),
    refetchInterval: LIVE_REFETCH_MS,
    staleTime: 0,
  });


// ---------- Mock-only queries (backend doesn't expose these yet) ----------

export const announcementsQuery = queryOptions<Announcement[]>({
  queryKey: queryKeys.announcements,
  queryFn: async () => {
    if (USE_MOCK) return mockAsync(ANNOUNCEMENTS);
    try {
      const list = await apiFetch<any[]>("/announcements/active");
      return list.map((a: any) => ({
        id: a.id,
        text: a.text,
        context: a.context,
      }));
    } catch {
      return [];
    }
  },
  refetchInterval: LIVE_REFETCH_MS,
});

export const notificationsQuery = queryOptions<Notification[]>({
  queryKey: queryKeys.notifications,
  queryFn: () => mockAsync(NOTIFICATIONS),
});

export const crowdForecastQuery = queryOptions<typeof CROWD_FORECAST>({
  queryKey: queryKeys.crowdForecast,
  queryFn: () => mockAsync(CROWD_FORECAST),
  refetchInterval: 30_000,
});

export const hourlyFlowQuery = queryOptions<typeof HOURLY_FLOW>({
  queryKey: queryKeys.hourlyFlow,
  queryFn: () => mockAsync(HOURLY_FLOW),
});

export const weeklyTrendQuery = queryOptions<typeof WEEKLY_TREND>({
  queryKey: queryKeys.weeklyTrend,
  queryFn: () => mockAsync(WEEKLY_TREND),
});

export const platformHeatmapQuery = queryOptions<number[][]>({
  queryKey: queryKeys.platformHeatmap,
  queryFn: () => mockAsync(PLATFORM_HEATMAP),
  refetchInterval: 15_000,
});

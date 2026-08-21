// Backend (FastAPI) response shapes — mirror app/schemas/{rail,realtime}.py
// Adapters below convert them into the frontend's existing UI types
// (Train, Alert, Station, Recommendation, KPI) so we don't have to refactor
// every dashboard component.

import {
  type Alert,
  type Coach,
  type LineId,
  type Recommendation,
  type Station,
  type Train,
  KPI as MOCK_KPI,
} from "@/lib/mock/data";

// ---------- Backend types ----------

export interface BackendStation {
  id: string;
  name: string;
  code: string;
  line_name: string;
  is_interchange?: boolean;
}

export interface BackendCoach {
  coach_number: string;
  coach_type: string;
  capacity: number;
  current_passenger_count: number;
  occupancy_percentage: number;
  occupancy_status: string;
  estimated_departure_passengers?: number | null;
  estimated_departure_occupancy_pct?: number | null;
}

export interface BackendTrainAtStation {
  train_id: string;
  train_name: string;
  line_name: string;
  direction: string;
  arrival_time: string;
  departure_time: string;
  current_station: string;
  current_station_id?: string | null;
  next_station: string;
  next_station_id?: string | null;
  status?: string;
  eta_seconds?: number | null;
  journey_completed_pct?: number | null;
  current_position?: number | null;
  estimated_departure_passengers?: number | null;
  estimated_departure_occupancy_pct?: number | null;
  coaches: BackendCoach[];
}

export interface BackendIncomingTrain {
  train_id: string;
  train_name: string;
  line_name: string;
  eta_minutes: number;
  route: string;
  current_occupancy: number;
  predicted_occupancy_at_station: number;
  predicted_boarding_count: number;
  predicted_deboarding_count: number;
  predicted_station_crowd?: number;
}

export interface BackendCrowdPrediction {
  current_station_crowd: number;
  predicted_5_min: number;
  predicted_15_min: number;
  predicted_30_min: number;
  predicted_60_min?: number;
}

export interface BackendAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  station_name?: string | null;
  train_id?: string | null;
  created_at: string; // ISO
}

export interface BackendDashboardSnapshot {
  station_name: string;
  current_trains: BackendTrainAtStation[];
  incoming_trains: BackendIncomingTrain[];
  crowd_prediction: BackendCrowdPrediction;
  recommendations: string[];
  alerts: BackendAlert[];
}

export interface BackendEsp32Live {
  status: "active" | "no_data" | "idle";
  device_id: string;
  coach_id: string;
  occupancy: number;
  occupancy_pct: number;
  total_in: number;
  total_out: number;
  in_rate_per_min: number;
  out_rate_per_min: number;
  coach_capacity: number;
  station_id?: string | null;
  target_station_id?: string | null;
  last_direction?: string | null;
  sensor_s1_distance: number;
  sensor_s2_distance: number;
  rssi?: number | null;
  last_updated: string;
  is_active: boolean;
}

export interface BackendEsp32Event {
  id: number;
  direction: "IN" | "OUT" | "SYNC" | "RESET";
  in_delta: number;
  out_delta: number;
  occupancy: number;
  occupancy_pct: number;
  total_in: number;
  total_out: number;
  station_id?: string | null;
  coach_id?: string | null;
  device_id?: string | null;
  distance_s1?: number;
  distance_s2?: number;
  timestamp: string;
}

// ---------- Adapters ----------

function lineFromName(name: string): LineId {
  return name.toLowerCase().includes("red") ? "red" : "blue";
}

export function adaptStation(s: BackendStation, index: number): Station {
  return {
    id: s.id,
    name: s.name,
    line: lineFromName(s.line_name),
    order: index + 1,
  };
}

function adaptCoach(c: BackendCoach, i: number): Coach {
  const currPax = c.current_passenger_count ?? Math.round(((c.capacity || 400) * c.occupancy_percentage) / 100);
  const estPax =
    c.estimated_departure_passengers ??
    Math.min(c.capacity || 400, Math.round(currPax * 1.08) || 50);
  const estPct =
    c.estimated_departure_occupancy_pct ??
    Math.min(100, Math.round((estPax / (c.capacity || 400)) * 100));

  return {
    id: `c${c.coach_number || i + 1}`,
    label:
      c.coach_type?.toLowerCase() === "ladies"
        ? "Ladies Coach"
        : `Coach ${c.coach_number || i + 1}`,
    capacity: c.capacity || 400,
    occupancy: c.occupancy_percentage,
    passengers: currPax,
    estimatedOccupancy: estPct,
    estimatedPassengers: estPax,
  };
}

export function formatTimeString(raw?: string | null): string {
  if (!raw) return "--:--";
  const s = String(raw).trim();
  if (s.includes("T")) {
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      }
    } catch {}
  }
  if (s.includes(":")) {
    const parts = s.split(":");
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      return `${h}:${m}`;
    }
  }
  return s;
}

export function adaptTrain(t: BackendTrainAtStation): Train {
  let mappedStatus: "Approaching" | "At Station" | "Departing" | "En Route" = "At Station";
  const st = (t.status || "").toUpperCase();
  if (st === "AT_STATION" || st === "WAITING_AT_TERMINAL") {
    mappedStatus = "At Station";
  } else if (st === "IN_TRANSIT") {
    mappedStatus = (t.eta_seconds !== undefined && t.eta_seconds !== null && t.eta_seconds <= 60) ? "Approaching" : "En Route";
  }

  const coaches = t.coaches.map(adaptCoach);
  const totalEstPax =
    t.estimated_departure_passengers ??
    coaches.reduce((acc, c) => acc + (c.estimatedPassengers ?? c.passengers ?? 0), 0);
  const totalEstPct =
    t.estimated_departure_occupancy_pct ??
    Math.min(100, Math.round((totalEstPax / 1200) * 100));

  return {
    id: t.train_id,
    name: `${t.train_id} · ${t.train_name}`,
    line: lineFromName(t.line_name),
    direction: t.direction,
    originId: "",
    destinationId: "",
    currentStationId: t.current_station_id || t.current_station,
    nextStationId: t.next_station_id || t.next_station,
    arrival: formatTimeString(t.arrival_time),
    departure: formatTimeString(t.departure_time),
    etaSeconds: t.eta_seconds ?? 0,
    predictedBoarding: 0,
    predictedDeboarding: 0,
    status: mappedStatus,
    coaches,
    journey_completed_pct: t.journey_completed_pct ?? undefined,
    estimatedDeparturePassengers: totalEstPax,
    estimatedDepartureOccupancy: totalEstPct,
  };
}

// Backend severity strings → frontend Alert["severity"] union
const SEVERITY_MAP: Record<string, Alert["severity"]> = {
  critical: "Emergency",
  emergency: "Emergency",
  high: "Overcrowding",
  medium: "Platform Congestion",
  warning: "System Warning",
  low: "System Warning",
  info: "System Warning",
};

const TYPE_MAP: Record<string, Alert["severity"]> = {
  platform_congestion: "Platform Congestion",
  coach_full: "Coach Full",
  overcrowding: "Overcrowding",
  sensor_failure: "Sensor Failure",
  system_warning: "System Warning",
  emergency: "Emergency",
};

export function adaptAlert(a: BackendAlert): Alert {
  const severity =
    TYPE_MAP[a.alert_type?.toLowerCase()] ??
    SEVERITY_MAP[a.severity?.toLowerCase()] ??
    "System Warning";
  const time = a.created_at
    ? new Date(a.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";
  return {
    id: a.id,
    severity,
    title: a.title,
    description: a.message,
    time,
    resolved: (a as any).resolved ?? false,
    acknowledged: (a as any).acknowledged ?? false,
  };
}

export function adaptRecommendations(items: string[]): Recommendation[] {
  return items.map((msg, i) => ({
    id: `srec-${i}`,
    title: msg,
    body: "Live recommendation from the SmartRail OS backend.",
    priority: i === 0 ? "action" : "info",
    action: "Acknowledge",
  }));
}

export function kpiFromSnapshot(snap: BackendDashboardSnapshot): typeof MOCK_KPI {
  const trains = snap.current_trains;
  const avg =
    trains.length > 0
      ? Math.round(
          trains
            .flatMap((t) => t.coaches.map((c) => c.occupancy_percentage))
            .reduce((a, b) => a + b, 0) /
            Math.max(
              1,
              trains.flatMap((t) => t.coaches).length,
            ),
        )
      : snap.crowd_prediction.current_station_crowd;
  const activeAlerts = snap.alerts.length;
  return {
    currentTrains: trains.length + snap.incoming_trains.length,
    passengersInStation: snap.crowd_prediction.current_station_crowd,
    passengersInTransit: trains
      .flatMap((t) => t.coaches)
      .reduce((a, c) => a + c.current_passenger_count, 0),
    avgOccupancy: avg,
    activeAlerts,
    predictedNextHour: snap.crowd_prediction.predicted_60_min ?? snap.crowd_prediction.predicted_30_min,
  };
}

export interface BackendCoachStateOut {
  coach_id: string;
  coach_type: string;
  capacity: number;
  current_passengers: number;
  occupancy_pct: number;
}

export interface StationCurrentData {
  train_id: string | null;
  current_passenger_count: number | null;
  arrival_time: string | null;
  departure_time: string | null;
  coaches?: BackendCoachStateOut[];
}

export interface BackendCoachEstimationStateOut {
  coach_id: string;
  coach_type: string;
  capacity: number;
  arrival_passengers: number;
  arrival_occupancy_pct: number;
  departure_passengers: number;
  departure_occupancy_pct: number;
  confidence_score: number | null;
  risk_level: string | null;
}

export interface StationFeatureData {
  train_id: string;
  estimated_arrival_time: string | null;
  estimated_departure_time: string | null;
  estimated_passenger_incoming: number | null;
  estimated_alighting: number | null;
  estimated_boarding: number | null;
  estimated_station_passenger_count: number | null;
  coaches: BackendCoachEstimationStateOut[];
}

// ---------- KPI History ----------

export interface BackendKpiSnapshot {
  active_trains: number;
  passengers_in_transit: number;
  avg_occupancy_pct: number;
  total_station_crowd: number;
  captured_at: string;
}

export interface BackendKpiHistory {
  current: BackendKpiSnapshot;
  hour_ago: BackendKpiSnapshot | null;
}

/** Returns a formatted delta string and a tone for a KPI card. */
export function computeDelta(
  current: number,
  hourAgo: number | undefined,
  unit: string = "",
  higherIsBad = false
): { delta: string; deltaTone: "positive" | "negative" | "warning" | "neutral" } {
  if (hourAgo === undefined || hourAgo === null) return { delta: "Live nominal", deltaTone: "neutral" };
  const diff = current - hourAgo;
  if (Math.abs(diff) < 1) return { delta: "Stable vs 1h ago", deltaTone: "neutral" };
  const sign = diff > 0 ? "+" : "";
  const delta = `${sign}${Math.round(diff)}${unit} vs 1h ago`;
  const deltaTone = diff === 0
    ? "neutral"
    : (diff > 0) === higherIsBad ? "negative" : "positive";
  return { delta, deltaTone };
}

/** Classify occupancy % into a human string + tone. */
export function occupancyBand(pct: number): { label: string; tone: "positive" | "warning" | "negative" } {
  if (pct >= 85) return { label: `Critical · ${Math.round(pct)}%`, tone: "negative" };
  if (pct >= 65) return { label: `Moderate · ${Math.round(pct)}%`, tone: "warning" };
  return { label: `Optimal · ${Math.round(pct)}%`, tone: "positive" };
}

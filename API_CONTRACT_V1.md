# SmartRail-OS API Contract v1.0

**Status:** FROZEN (Stable for frontend/mobile integration)  
**Last Updated:** 2026-06-10  
**Base URL:** `http://localhost:8000/api/v1`

This document defines the complete API contract for SmartRail-OS. All response shapes and request formats are locked. Frontend, mobile, and dashboard teams should build against these exact schemas.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Catalog (Lines, Stations, Routes, Trains)](#catalog)
3. [Occupancy](#occupancy)
4. [Dashboard](#dashboard)
5. [Alerts](#alerts)
6. [Data Models (Response Schemas)](#data-models)
7. [HTTP Status Codes](#http-status-codes)

---

## Authentication

### POST `/auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "securePassword123",
  "role": "passenger"
}
```

**Constraints:**
- `email`: Valid email format (required)
- `full_name`: 2-255 characters (required)
- `password`: 8-128 characters (required)
- `role`: String, defaults to "passenger" (optional)

**Response:** 201 Created
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "passenger"
}
```

---

### POST `/auth/login`

Authenticate user and obtain access/refresh tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

**Error Responses:**
- 401 Unauthorized: Invalid email or password

---

### POST `/auth/refresh`

Refresh an expired access token using the refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

## Catalog

Master data endpoints for lines, stations, routes, and trains.

### GET `/catalog/lines`

Fetch all transit lines.

**Response:** 200 OK
```json
[
  {
    "id": "line-001",
    "name": "Red Line",
    "color": "#FF0000",
    "description": "Downtown express service"
  }
]
```

---

### GET `/catalog/stations`

Fetch all stations across the network.

**Response:** 200 OK
```json
[
  {
    "id": "station-001",
    "name": "Central Station",
    "code": "CST",
    "line_name": "Red Line",
    "is_interchange": true
  }
]
```

**Note:** `is_interchange` indicates if the station connects multiple lines.

---

### GET `/catalog/routes`

Fetch all defined routes (line + origin + destination).

**Response:** 200 OK
```json
[
  {
    "id": "route-001",
    "line_name": "Red Line",
    "origin_station": "Central Station",
    "destination_station": "North Terminal",
    "stops": [
      {
        "station_name": "Central Station",
        "stop_order": 1,
        "arrival_offset_minutes": 0,
        "departure_offset_minutes": 2
      },
      {
        "station_name": "Market Street",
        "stop_order": 2,
        "arrival_offset_minutes": 8,
        "departure_offset_minutes": 10
      }
    ]
  }
]
```

**Stop Offsets:** Times relative to route start time.

---

### GET `/catalog/trains`

Fetch all active trains and their current status.

**Response:** 200 OK
```json
[
  {
    "train_id": "TR-001",
    "train_name": "Red Line Express",
    "line_name": "Red Line",
    "direction": "Northbound",
    "current_station": "Central Station",
    "next_station": "Market Street",
    "arrival_time": "2026-06-10T14:32:00Z",
    "departure_time": "2026-06-10T14:34:00Z",
    "current_occupancy": 342,
    "coaches": [
      {
        "coach_number": "A1",
        "coach_type": "standard",
        "capacity": 120,
        "description": "Air-conditioned standard coach"
      }
    ]
  }
]
```

---

## Occupancy

Real-time occupancy data for trains and stations.

### GET `/occupancy/trains`

Fetch occupancy details for all trains.

**Response:** 200 OK
```json
[
  {
    "train_id": "TR-001",
    "train_name": "Red Line Express",
    "station_name": "Central Station",
    "line_name": "Red Line",
    "direction": "Northbound",
    "current_station_crowd": 450,
    "coaches": [
      {
        "coach_number": "A1",
        "coach_type": "standard",
        "capacity": 120,
        "current_passenger_count": 98,
        "occupancy_percentage": 82,
        "occupancy_status": "high"
      }
    ],
    "updated_at": "2026-06-10T14:31:45Z"
  }
]
```

**Occupancy Status Values:** `empty`, `low`, `moderate`, `high`, `critical`

---

### GET `/occupancy/trains/{train_id}`

Fetch occupancy for a specific train.

**Response:** 200 OK
```json
{
  "train_id": "TR-001",
  "train_name": "Red Line Express",
  "station_name": "Central Station",
  "line_name": "Red Line",
  "direction": "Northbound",
  "current_station_crowd": 450,
  "coaches": [
    {
      "coach_number": "A1",
      "coach_type": "standard",
      "capacity": 120,
      "current_passenger_count": 98,
      "occupancy_percentage": 82,
      "occupancy_status": "high"
    }
  ],
  "updated_at": "2026-06-10T14:31:45Z"
}
```

---

### GET `/occupancy/stations`

Fetch crowd predictions for all stations.

**Response:** 200 OK
```json
[
  {
    "station_name": "Central Station",
    "current_station_crowd": 450,
    "predicted_5_min": 470,
    "predicted_15_min": 520,
    "predicted_30_min": 610
  }
]
```

---

## Dashboard

Dashboard snapshot endpoint for realtime overview.

### GET `/dashboard/snapshot`

Fetch a complete dashboard snapshot for a given station.

**Response:** 200 OK
```json
{
  "station_name": "Central Station",
  "current_trains": [
    {
      "train_id": "TR-001",
      "train_name": "Red Line Express",
      "line_name": "Red Line",
      "direction": "Northbound",
      "current_occupancy": 342
    }
  ],
  "incoming_trains": [
    {
      "train_id": "TR-002",
      "train_name": "Red Line Local",
      "line_name": "Red Line",
      "eta_minutes": 4,
      "route": "Central Station -> Market Street -> North Terminal",
      "current_occupancy": 280,
      "predicted_occupancy_at_station": 320,
      "predicted_boarding_count": 45,
      "predicted_deboarding_count": 12
    }
  ],
  "crowd_prediction": {
    "current_station_crowd": 450,
    "predicted_5_min": 470,
    "predicted_15_min": 520,
    "predicted_30_min": 610
  },
  "recommendations": [
    "Redirect passengers to Coach A2",
    "Announce incoming train arrival"
  ],
  "alerts": [
    {
      "id": "alert-001",
      "alert_type": "platform_congestion",
      "severity": "high",
      "title": "Platform Congestion",
      "message": "Crowd increasing on platform 2",
      "station_name": "Central Station",
      "train_id": null,
      "created_at": "2026-06-10T14:31:00Z"
    }
  ]
}
```

---

## Alerts

Operational alerts and notifications.

### GET `/alerts`

Fetch all active alerts.

**Response:** 200 OK
```json
[
  {
    "id": "alert-001",
    "alert_type": "platform_congestion",
    "severity": "high",
    "title": "Platform Congestion",
    "message": "Crowd is increasing on the interchange platform",
    "station_name": "Central Station",
    "train_id": null,
    "created_at": "2026-06-10T14:31:00Z"
  }
]
```

**Alert Types:** `platform_congestion`, `train_delay`, `operational_issue`, `prediction_alert`, `system_warning`

**Severity Levels:** `low`, `medium`, `high`, `critical`

---

## Data Models

Complete schema definitions for all request/response objects.

### Auth Schemas

#### RegisterRequest
```
email: string (email format, required)
full_name: string (2-255 chars, required)
password: string (8-128 chars, required)
role: string (defaults to "passenger")
```

#### LoginRequest
```
email: string (email format, required)
password: string (required)
```

#### TokenResponse
```
access_token: string
refresh_token: string
token_type: string (always "bearer")
```

#### UserOut
```
id: string (UUID)
email: string
full_name: string
role: string
```

---

### Catalog Schemas

#### LineOut
```
id: string
name: string
color: string (hex color code, e.g., "#FF0000")
description: string (optional)
```

#### StationOut
```
id: string
name: string
code: string (3-4 character station code)
line_name: string
is_interchange: boolean
```

#### RouteStopOut
```
station_name: string
stop_order: integer (1-indexed)
arrival_offset_minutes: integer
departure_offset_minutes: integer
```

#### RouteOut
```
id: string
line_name: string
origin_station: string
destination_station: string
stops: array of RouteStopOut
```

#### CoachOut
```
coach_number: string (e.g., "A1", "B2")
coach_type: string (e.g., "standard", "express", "accessibility")
capacity: integer
description: string (optional)
```

#### TrainCatalogueOut
```
train_id: string
train_name: string
line_name: string
direction: string (e.g., "Northbound", "Southbound")
current_station: string
next_station: string
arrival_time: string (ISO 8601 datetime)
departure_time: string (ISO 8601 datetime)
current_occupancy: integer
coaches: array of CoachOut
```

---

### Occupancy Schemas

#### CoachOccupancyOut
```
coach_number: string
coach_type: string
capacity: integer
current_passenger_count: integer
occupancy_percentage: integer (0-100)
occupancy_status: string (empty|low|moderate|high|critical)
```

#### TrainOccupancyOut
```
train_id: string
train_name: string
station_name: string
line_name: string
direction: string
current_station_crowd: integer
coaches: array of CoachOccupancyOut
updated_at: string (ISO 8601 datetime)
```

#### StationCrowdOut (from API)
```
station_name: string
current_station_crowd: integer
predicted_5_min: integer
predicted_15_min: integer
predicted_30_min: integer
```

---

### Dashboard Schemas

#### IncomingTrainOut
```
train_id: string
train_name: string
line_name: string
eta_minutes: integer (minutes until arrival)
route: string (human-readable route description)
current_occupancy: integer
predicted_occupancy_at_station: integer
predicted_boarding_count: integer
predicted_deboarding_count: integer
```

#### StationCrowdPredictionOut
```
current_station_crowd: integer
predicted_5_min: integer
predicted_15_min: integer
predicted_30_min: integer
```

#### RecommendationOut
```
message: string
coach_recommended: string (optional, e.g., "A1")
```

#### DashboardSnapshot
```
station_name: string
current_trains: array of {train_id, train_name, line_name, direction, current_occupancy}
incoming_trains: array of IncomingTrainOut
crowd_prediction: StationCrowdPredictionOut
recommendations: array of strings
alerts: array of AlertOut
```

---

### Alert Schemas

#### AlertOut
```
id: string (UUID)
alert_type: string (platform_congestion|train_delay|operational_issue|prediction_alert|system_warning)
severity: string (low|medium|high|critical)
title: string
message: string
station_name: string (optional)
train_id: string (optional)
created_at: string (ISO 8601 datetime)
```

---

## HTTP Status Codes

| Status | Meaning | Common Trigger |
|--------|---------|----------------|
| 200 | OK | Successful GET/POST with data |
| 201 | Created | Successful registration |
| 400 | Bad Request | Invalid request format or constraints violated |
| 401 | Unauthorized | Invalid credentials or missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Server error |

---

## Notes for Teams

### Frontend/Dashboard Team
- Use `/dashboard/snapshot` for station overview
- Use `/occupancy/trains` for live occupancy updates
- Use `/alerts` for operational alerts
- All timestamps are ISO 8601 format (UTC)

### Mobile/Flutter Team
- Register via `/auth/register`
- Get tokens via `/auth/login`
- Use `/occupancy/trains` for coach-level occupancy
- Use `/occupancy/stations` for crowd predictions
- Pass `Authorization: Bearer {access_token}` in headers

### Simulation Team
Feed data in the shapes defined above. The backend will store and return them in these exact formats.

### Backend Team
Do not change response shapes without updating this document. Breaking changes require:
1. Update this document
2. Increase version number
3. Create a `/api/v2` endpoint with new contracts
4. Maintain `/api/v1` for backward compatibility

---

## Ingestion

Endpoints for receiving raw sensor and simulation data.

### POST `/ingestion/events`

Submit telemetry and sensor events (e.g., from trains or station gates).

**Request:**
```json
{
  "timestamp": "2026-06-10T14:31:00Z",
  "train_id": "BL-UP-01",
  "station_id": "BL05",
  "event_type": "occupancy_update",
  "coaches": [
    {
      "coach_id": "C1",
      "passenger_count": 120,
      "occupancy_percentage": 30.0
    }
  ],
  "delay_minutes": 2
}
```

**Response:** 202 Accepted
```json
{
  "status": "accepted",
  "processed_events": 1
}
```

---

---

## Real-time Streaming (WebSockets)

### WebSocket `/ws/realtime`

Connect to receive live updates when events happen in the system.

**Connection Protocol:** standard `ws://` or `wss://`

**Payload Format (Server -> Client):**
```json
{
  "event_type": "occupancy_update",
  "data": {
    "train_id": "BL-UP-01",
    "station_id": "BL05",
    "total_passengers": 250,
    "timestamp": "2026-06-10T14:31:00Z"
  }
}
```

*Note: In the future, this endpoint may support multiple `event_type` values (e.g., `alert_issued`, `train_arrived`).*

---

---

## Predictions

Endpoints for machine-learning or heuristic-based forecasts.

### POST `/predictions/occupancy`

Get occupancy forecasts for a specific train in the future.

**Request:**
```json
{
  "train_id": "BL-UP-01",
  "forecast_minutes": 15
}
```

**Response:** 200 OK
```json
{
  "train_id": "BL-UP-01",
  "forecast_minutes": 15,
  "predicted_total_passengers": 320,
  "predicted_coaches": [
    {
      "coach_number": "A1",
      "predicted_passenger_count": 90,
      "occupancy_status": "high"
    }
  ]
}
```

---

## Future Endpoints (Planned, Not Yet Implemented)

- **POST `/occupancy/report`** – Submit occupancy updates from sensors
- **POST `/alerts/{alert_id}/acknowledge`** – Mark alerts as seen
- **GET `/recommendations/{train_id}`** – Get passenger recommendations for a specific train

These will be added in Phase 6 and beyond. Do not implement until locked.

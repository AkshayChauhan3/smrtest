import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from app.main import app  # noqa: E402


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_catalog_endpoints() -> None:
    with TestClient(app) as client:
        lines = client.get("/api/v1/catalog/lines")
        stations = client.get("/api/v1/catalog/stations")
        routes = client.get("/api/v1/catalog/routes")
        trains = client.get("/api/v1/catalog/trains", params={"sim_time": "09:00"})

    assert lines.status_code == 200
    assert stations.status_code == 200
    assert routes.status_code == 200
    assert trains.status_code == 200
    assert len(lines.json()) == 2
    assert any(station["name"] == "Old High Court" for station in stations.json())
    assert any(route["id"] == "BL-UP" for route in routes.json())
    assert trains.json()[0]["train_id"]
    assert trains.json()[0]["coaches"]


def test_train_occupancy_endpoints() -> None:
    with TestClient(app) as client:
        all_trains = client.get("/api/v1/occupancy/trains", params={"sim_time": "09:00"})
        train = client.get("/api/v1/occupancy/trains/BL-UP-01", params={"sim_time": "09:00"})
        invalid = client.get("/api/v1/occupancy/trains/NOPE", params={"sim_time": "09:00"})

    assert all_trains.status_code == 200
    assert train.status_code == 200
    assert invalid.status_code == 404
    payload = train.json()
    assert payload["train_id"] == "BL-UP-01"
    assert payload["coaches"][0]["current_passenger_count"] >= 0
    assert payload["coaches"][0]["occupancy_status"] in {"empty", "low", "moderate", "high", "critical"}


def test_station_crowd_dashboard_and_station_lookup() -> None:
    with TestClient(app) as client:
        crowds = client.get("/api/v1/occupancy/stations", params={"sim_time": "14:00"})
        dashboard = client.get(
            "/api/v1/dashboard/snapshot",
            params={"station_name": "Old High Court", "sim_time": "09:00"},
        )
        station_trains = client.get(
            "/api/v1/trains/at-station",
            params={"station_name": "Old High Court", "sim_time": "09:00"},
        )

    assert crowds.status_code == 200
    assert dashboard.status_code == 200
    assert station_trains.status_code == 200
    assert any(crowd["station_name"] == "Old High Court" for crowd in crowds.json())
    assert dashboard.json()["station_name"] == "Old High Court"
    assert "incoming_trains" in dashboard.json()
    assert isinstance(station_trains.json(), list)


def test_invalid_sim_time_returns_400() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/occupancy/trains", params={"sim_time": "9am"})

    assert response.status_code == 400

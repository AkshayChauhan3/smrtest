from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ingestion_endpoint():
    payload = {
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
    
    with TestClient(app) as client:
        response = client.post("/api/v1/ingestion/events", json=payload)
        assert response.status_code == 202
        assert response.json() == {"status": "accepted", "processed_events": 1}

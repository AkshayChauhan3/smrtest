from fastapi.testclient import TestClient
from app.main import app

def test_websocket_broadcast():
    with TestClient(app) as client:
        # Open a websocket connection
        with client.websocket_connect("/api/v1/ws/realtime") as websocket:
            
            # Simulate an ingestion event happening via REST
            payload = {
                "timestamp": "2026-06-10T14:35:00Z",
                "train_id": "RL-DO-01",
                "station_id": "RL10",
                "event_type": "occupancy_update",
                "coaches": [
                    {
                        "coach_id": "C1",
                        "passenger_count": 80,
                        "occupancy_percentage": 20.0
                    }
                ],
                "delay_minutes": 0
            }
            
            # Post the event
            response = client.post("/api/v1/ingestion/events", json=payload)
            assert response.status_code == 202
            
            # The websocket should receive the broadcasted event instantly
            data = websocket.receive_json()
            
            assert data["event_type"] == "occupancy_update"
            assert data["data"]["train_id"] == "RL-DO-01"
            assert data["data"]["station_id"] == "RL10"
            assert data["data"]["total_passengers"] == 80

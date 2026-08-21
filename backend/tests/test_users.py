import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_user_registration_and_login():
    with TestClient(app) as client:
        # 1. Register a new user
        reg_payload = {
            "email": "john.doe@example.com",
            "full_name": "John Doe",
            "password": "superSecurePassword123",
            "role": "passenger"
        }
        res_reg = client.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        user_data = res_reg.json()
        assert user_data["email"] == "john.doe@example.com"
        assert user_data["full_name"] == "John Doe"
        assert "id" in user_data

        # 2. Prevent duplicate registrations
        res_dup = client.post("/api/v1/auth/register", json=reg_payload)
        assert res_dup.status_code == 400

        # 3. Login
        login_payload = {
            "email": "john.doe@example.com",
            "password": "superSecurePassword123"
        }
        res_login = client.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200
        token_data = res_login.json()
        assert "access_token" in token_data
        assert "refresh_token" in token_data
        assert token_data["token_type"] == "bearer"


def test_saved_routes():
    with TestClient(app) as client:
        # Register a real user first to get a valid UUID
        reg_payload = {
            "email": "jane.doe@example.com",
            "full_name": "Jane Doe",
            "password": "superSecurePassword123",
            "role": "passenger"
        }
        res_reg = client.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        user_id = res_reg.json()["id"]
        
        # 1. Initially user should have no saved routes
        res_get = client.get(f"/api/v1/users/{user_id}/saved-routes")
        assert res_get.status_code == 200
        assert res_get.json() == []

        # 2. Save a route preference
        route_payload = {
            "lineId": "BL",
            "fromStationId": "BL03",
            "toStationId": "BL11",
            "label": "Home Commute"
        }
        res_post = client.post(f"/api/v1/users/{user_id}/saved-routes", json=route_payload)
        assert res_post.status_code == 201
        assert res_post.json()["status"] == "success"

        # 3. Fetch routes again
        res_get_again = client.get(f"/api/v1/users/{user_id}/saved-routes")
        assert res_get_again.status_code == 200
        saved_list = res_get_again.json()
        assert len(saved_list) == 1
        assert saved_list[0]["lineId"] == "BL"
        assert saved_list[0]["fromStationId"] == "BL03"
        assert saved_list[0]["toStationId"] == "BL11"
        assert saved_list[0]["label"] == "Home Commute"
        assert "id" in saved_list[0]

# SmartRail OS: Backend Integration Guide

This document provides instructions for backend developers to connect the real-time data API to the Flutter mobile application.

## 1. Environment Setup
The app's API configuration is managed in:
`lib/core/constants/app_config.dart`

**Action:**
- Update `AppConfig.baseUrl` to your server's URL (e.g., `https://api.smartrail.os`).
- If testing on an Android Emulator, use `http://10.0.2.2:PORT` to access your local machine's localhost.

## 2. Authentication Flow
The app uses JWT-based Bearer authentication.

**Expected Header:**
`Authorization: Bearer <your_token>`

**Implementation Location:**
`lib/features/auth/providers/auth_provider.dart` (Managed via `ApiService`)

## 3. API Endpoints Mapping

| Feature | Method | Endpoint | Expected Response |
| :--- | :--- | :--- | :--- |
| **Login** | POST | `/api/v1/auth/login` | `UserModel` JSON |
| **Register** | POST | `/api/v1/auth/register` | `UserModel` JSON |
| **Upcoming Trains** | GET | `/api/v1/trains/upcoming` | `List<TrainModel>` JSON |
| **Train Detail** | GET | `/api/v1/trains/:id` | `TrainModel` JSON |
| **Coach Occupancy**| GET | `/api/v1/trains/:id/coaches`| `List<CoachModel>` JSON |
| **Announcements** | GET | `/api/v1/announcements/active`| `List<AnnouncementModel>` JSON |

## 4. Data Models (JSON Schema)

### TrainModel
```json
{
  "trainId": "string",
  "displayName": "string",
  "line": "blue | red",
  "direction": "string",
  "etaMinutes": int,
  "departureMinutes": int,
  "status": "normal | moderate | full | emergency",
  "currentPositionIndex": int,
  "fromStationId": "string",
  "toStationId": "string",
  "coaches": [...CoachModel],
  "announcements": [...AnnouncementModel]
}
```

### CoachModel
```json
{
  "coachNumber": int,
  "type": "string",
  "capacity": int,
  "currentPassengers": int
}
```

## 5. Migration Steps

Throughout the codebase, look for the comment:
`// FOR BACKEND IMPLEMENTATION`

### Step 1: Update ApiService
In `lib/core/services/api_service.dart`, you will find methods currently delegating to `_mockAuth` and `_mockTrain`. Replace these with actual `http` calls.

**Example Template:**
```dart
Future<TrainModel> getTrainDetail(String trainId) async {
  final res = await http.get(
    Uri.parse('${AppConfig.baseUrl}/api/v1/trains/$trainId'),
    headers: AppConfig.authHeaders(token),
  );
  if (res.statusCode == 200) {
    return TrainModel.fromJson(jsonDecode(res.body));
  } else {
    throw Exception('Failed to load train detail');
  }
}
```

### Step 2: Remove Mock Services
Once all methods in `ApiService` are implemented using real network calls, delete:
- `lib/core/services/mock_auth_service.dart`
- `lib/core/services/mock_train_service.dart`

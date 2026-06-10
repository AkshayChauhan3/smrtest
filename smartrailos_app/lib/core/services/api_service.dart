import '../constants/metro_data.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/trains/models/train_model.dart';
import '../../features/trains/models/coach_model.dart';
import '../../features/trains/models/announcement_model.dart';
import 'mock_auth_service.dart';
import 'mock_train_service.dart';

// api_service.dart
// ─────────────────────────────────────────────────────────────────
// THIS FILE IS FOR THE BACKEND DEVELOPER.
// All methods here currently delegate to the mock services.
// When the backend is live:
//   1. Set AppConfig.baseUrl to the real server URL.
//   2. Replace each mock call below with the HTTP call shown in the
//      BACKEND comment above each method.
//   3. Remove the mock service imports.
// ─────────────────────────────────────────────────────────────────

class ApiService {
  final MockAuthService _mockAuth = MockAuthService();
  final MockTrainService _mockTrain = MockTrainService();

  // AUTH
  Future<UserModel> login(String email, String password) => _mockAuth.login(email, password);
  Future<UserModel> register(String name, String email, String password) => _mockAuth.register(name, email, password);
  Future<void> logout() => _mockAuth.logout();
  Future<UserModel?> checkAuth() => _mockAuth.checkAuth();

  // TRAINS
  Future<List<TrainModel>> getUpcomingTrains(MetroLine line, String fromStationId, String toStationId) =>
      _mockTrain.getUpcomingTrains(line, fromStationId, toStationId);
  Future<TrainModel> getTrainDetail(String trainId) => _mockTrain.getTrainDetail(trainId);
  Future<List<CoachModel>> getCoachOccupancy(String trainId) => _mockTrain.getCoachOccupancy(trainId);
  Future<List<AnnouncementModel>> getActiveAnnouncements(String stationId) =>
      _mockTrain.getActiveAnnouncements(stationId);

  // USER DATA (SAVED ROUTES)
  // BACKEND: Fetch saved routes for the user
  // Method:  GET
  // URL:     /api/v1/users/:userId/saved-routes
  // Returns: List<{ lineId, fromStationId, toStationId, label }>
  Future<List<dynamic>> getSavedRoutes() async {
    // Mock: return pre-populated for test user
    final auth = await checkAuth();
    if (auth?.email == 'test@smartrail.os') {
      return [
        {
          'lineId': 'blue',
          'fromStationId': 'OHC',
          'toStationId': 'TG',
          'label': 'Work Commute',
        }
      ];
    }
    return [];
  }

  // BACKEND: Save a new route
  // Method:  POST
  // URL:     /api/v1/users/:userId/saved-routes
  // Payload: { lineId, fromStationId, toStationId, label }
  Future<void> saveRoute(dynamic route) async {}
}

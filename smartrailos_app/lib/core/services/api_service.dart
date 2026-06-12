import '../constants/metro_data.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/trains/models/train_model.dart';
import '../../features/trains/models/coach_model.dart';
import '../../features/trains/models/announcement_model.dart';
import 'mock_auth_service.dart';
import 'mock_train_service.dart';

// api_service.dart
// ─────────────────────────────────────────────────────────────────
// FOR BACKEND IMPLEMENTATION:
// THIS FILE IS THE MAIN DATA GATEWAY.
// 1. Replace mock service calls with real http requests.
// 2. Use AppConfig.baseUrl for the endpoint root.
// 3. Ensure proper error handling (try/catch) for network issues.
// ─────────────────────────────────────────────────────────────────

class ApiService {
  final MockAuthService _mockAuth = MockAuthService();
  final MockTrainService _mockTrain = MockTrainService();

  // AUTH
  
  // FOR BACKEND IMPLEMENTATION:
  // POST /api/v1/auth/login
  // Payload: { "email": email, "password": password }
  Future<UserModel> login(String email, String password) => _mockAuth.login(email, password);
  
  // FOR BACKEND IMPLEMENTATION:
  // POST /api/v1/auth/register
  // Payload: { "name": name, "email": email, "password": password }
  Future<UserModel> register(String name, String email, String password) => _mockAuth.register(name, email, password);
  
  // FOR BACKEND IMPLEMENTATION:
  // Perform any necessary cleanup (e.g., invalidate token on server)
  Future<void> logout() => _mockAuth.logout();
  
  // FOR BACKEND IMPLEMENTATION:
  // GET /api/v1/auth/me
  // Use authHeaders(token) for Bearer auth
  Future<UserModel?> checkAuth() => _mockAuth.checkAuth();

  // TRAINS

  // FOR BACKEND IMPLEMENTATION:
  // GET /api/v1/trains/upcoming?lineId=<line>&fromStationId=<fromStationId>&toStationId=<toStationId>
  Future<List<TrainModel>> getUpcomingTrains(MetroLine line, String fromStationId, String toStationId) =>
      _mockTrain.getUpcomingTrains(line, fromStationId, toStationId);
  
  // FOR BACKEND IMPLEMENTATION:
  // GET /api/v1/trains/:trainId
  Future<TrainModel> getTrainDetail(String trainId) => _mockTrain.getTrainDetail(trainId);
  
  // FOR BACKEND IMPLEMENTATION:
  // GET /api/v1/trains/:trainId/coaches
  Future<List<CoachModel>> getCoachOccupancy(String trainId) => _mockTrain.getCoachOccupancy(trainId);
  
  // FOR BACKEND IMPLEMENTATION:
  // GET /api/v1/announcements/active?stationId=<stationId>
  Future<List<AnnouncementModel>> getActiveAnnouncements(String stationId) =>
      _mockTrain.getActiveAnnouncements(stationId);

  // USER DATA (SAVED ROUTES)
  
  // FOR BACKEND IMPLEMENTATION:
  // GET /api/v1/users/saved-routes
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

  // FOR BACKEND IMPLEMENTATION:
  // POST /api/v1/users/saved-routes
  // Payload: { "lineId": ..., "fromStationId": ..., "toStationId": ..., "label": ... }
  Future<void> saveRoute(dynamic route) async {}
}

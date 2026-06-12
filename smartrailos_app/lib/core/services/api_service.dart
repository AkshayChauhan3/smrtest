import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_config.dart';
import '../constants/metro_data.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/trains/models/train_model.dart';
import '../../features/trains/models/coach_model.dart';
import '../../features/trains/models/announcement_model.dart';

class ApiService {
  Future<Map<String, String>> _getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token == null) return {'Content-Type': 'application/json'};
    return AppConfig.authHeaders(token);
  }

  // AUTH
  Future<UserModel> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('${AppConfig.baseUrl}/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode != 200) {
      throw Exception('Login failed: ${res.body}');
    }
    final data = jsonDecode(res.body);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', data['access_token']);
    
    final name = email.split('@')[0];
    await prefs.setString('user_name', name);
    await prefs.setString('user_email', email);
    
    return UserModel(userId: 'uid-${email.hashCode}', name: name, email: email);
  }

  Future<UserModel> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('${AppConfig.baseUrl}/api/v1/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'full_name': name, 'email': email, 'password': password, 'role': 'passenger'}),
    );
    if (res.statusCode != 201) {
      throw Exception('Registration failed: ${res.body}');
    }
    // backend register doesn't return token, so auto-login
    return login(email, password);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<UserModel?> checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token == null) return null;
    final name = prefs.getString('user_name') ?? 'User';
    final email = prefs.getString('user_email') ?? '';
    return UserModel(userId: 'mock-uid', name: name, email: email);
  }

  // TRAINS
  Future<List<TrainModel>> getUpcomingTrains(MetroLine line, String fromStationId, String toStationId) async {
    try {
      final headers = await _getAuthHeaders();
      final res = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/v1/stations/$fromStationId/feature'),
        headers: headers,
      );
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        return list.map((e) {
          final trainId = e['train_id'] ?? 'N/A';
          final etaStr = e['estimated_arrival_time'] ?? '0';
          int eta = 5;
          if (etaStr != '0' && etaStr != '--:--') {
            try {
              final now = DateTime.now();
              final parts = etaStr.split(':');
              if (parts.length == 2) {
                final h = int.parse(parts[0]);
                final m = int.parse(parts[1]);
                var arrivalTime = DateTime(now.year, now.month, now.day, h, m);
                if (arrivalTime.isBefore(now.subtract(const Duration(hours: 12)))) {
                  arrivalTime = arrivalTime.add(const Duration(days: 1));
                }
                eta = arrivalTime.difference(now).inMinutes;
                if (eta < 0) eta = 0;
              }
            } catch (_) {}
          }
          return TrainModel(
            trainId: trainId,
            displayName: trainId,
            line: trainId.startsWith('BL') ? MetroLine.blue : MetroLine.red,
            direction: 'Forward',
            etaMinutes: eta,
            departureMinutes: eta + 2,
            coaches: (e['coaches'] as List? ?? []).map((c) => CoachModel(
              coachNumber: int.tryParse(c['coach_id']?.toString() ?? '0') ?? 0,
              type: c['coach_type'] ?? 'General',
              capacity: c['capacity'] ?? 175,
              currentPassengers: c['arrival_passengers'] ?? 0,
            )).toList(),
            status: TrainStatus.normal,
            currentPositionIndex: 0,
            fromStationId: fromStationId,
            toStationId: toStationId,
            announcements: [],
          );
        }).toList();
      }
    } catch (e) {
      print('Error fetching upcoming trains: $e');
    }
    return [];
  }

  Future<TrainModel> getTrainDetail(String trainId) async {
    final headers = await _getAuthHeaders();
    final res = await http.get(
      Uri.parse('${AppConfig.baseUrl}/api/v1/trains/at-station'),
      headers: headers,
    );
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body) as List;
      final t = list.firstWhere((e) => e['train_id'] == trainId, orElse: () => null);
      if (t != null) {
        return TrainModel(
          trainId: t['train_id'],
          displayName: t['train_name'],
          line: t['line_name'].toString().toLowerCase().contains('blue') ? MetroLine.blue : MetroLine.red,
          direction: t['direction'],
          etaMinutes: 0,
          departureMinutes: 2,
          coaches: (t['coaches'] as List? ?? []).map((c) => CoachModel(
            coachNumber: int.tryParse(c['coach_number']?.toString() ?? '0') ?? 0,
            type: c['coach_type'] ?? 'General',
            capacity: c['capacity'] ?? 175,
            currentPassengers: c['current_passenger_count'] ?? 0,
          )).toList(),
          status: TrainStatus.normal,
          currentPositionIndex: 0,
          fromStationId: t['current_station'],
          toStationId: t['next_station'],
          announcements: [],
        );
      }
    }
    throw Exception('Train not found');
  }

  Future<List<CoachModel>> getCoachOccupancy(String trainId) async {
    try {
      final train = await getTrainDetail(trainId);
      return train.coaches;
    } catch (e) {
      return [];
    }
  }

  Future<List<AnnouncementModel>> getActiveAnnouncements(String stationId) async {
    try {
      final headers = await _getAuthHeaders();
      final res = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/v1/announcements/active'),
        headers: headers,
      );
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        return list.map((e) => AnnouncementModel(
          message: e['text'] ?? '',
          severity: AnnouncementSeverity.values.firstWhere(
            (s) => s.name == (e['severity'] ?? 'info'),
            orElse: () => AnnouncementSeverity.info,
          ),
        )).toList();
      }
    } catch (e) {
      print('Error fetching announcements: $e');
    }
    return [];
  }

  // USER DATA
  Future<List<dynamic>> getSavedRoutes() async {
    final auth = await checkAuth();
    if (auth != null) {
      try {
        final headers = await _getAuthHeaders();
        final res = await http.get(
          Uri.parse('${AppConfig.baseUrl}/api/v1/users/${auth.userId}/saved-routes'),
          headers: headers,
        );
        if (res.statusCode == 200) {
          return jsonDecode(res.body) as List;
        }
      } catch (e) {
        print('Error fetching saved routes: $e');
      }
    }
    return [];
  }

  Future<void> saveRoute(dynamic route) async {
    final auth = await checkAuth();
    if (auth != null) {
      final headers = await _getAuthHeaders();
      await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/v1/users/${auth.userId}/saved-routes'),
        headers: headers,
        body: jsonEncode(route),
      );
    }
  }
}

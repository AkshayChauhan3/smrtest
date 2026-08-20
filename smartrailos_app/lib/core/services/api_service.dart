import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_config.dart';
import '../constants/metro_data.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/trains/models/train_model.dart';
import '../../features/trains/models/coach_model.dart';
import '../../features/trains/models/announcement_model.dart';

final apiServiceProvider = Provider((ref) => ApiService());

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

      final resSearch = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/v1/trains/search?from_station=$fromStationId&to_station=$toStationId'),
        headers: headers,
      );

      if (resSearch.statusCode == 200) {
        final list = jsonDecode(resSearch.body) as List;
        return list.map((item) {
          final coaches = (item['coaches'] as List? ?? []).map((c) {
            final coachIdStr = c['coach_number']?.toString() ?? '1';
            final cleanId = coachIdStr.replaceAll(RegExp(r'[^0-9]'), '');
            return CoachModel(
              coachNumber: int.tryParse(cleanId.isNotEmpty ? cleanId : '1') ?? 1,
              type: (c['coach_type'] ?? 'standard').toString().toLowerCase() == 'ladies' ? 'Ladies' : 'General',
              capacity: c['capacity'] ?? 400,
              currentPassengers: c['current_passenger_count'] ?? 0,
            );
          }).toList();

          final isPlatform = item['is_at_platform'] == true;
          final totalPax = item['current_occupancy'] ?? 0;

          return TrainModel(
            trainId: item['train_id'] ?? '',
            displayName: item['train_name'] ?? item['train_id'] ?? '',
            line: (item['line_code'] ?? '').toString().toUpperCase() == 'RL' ? MetroLine.red : MetroLine.blue,
            direction: item['direction'] ?? 'UP',
            etaMinutes: item['eta_minutes'] ?? 0,
            departureMinutes: (item['eta_minutes'] ?? 0) + 1,
            coaches: coaches,
            status: totalPax >= 1020
                ? TrainStatus.full
                : totalPax >= 600
                    ? TrainStatus.moderate
                    : TrainStatus.normal,
            currentPositionIndex: 0,
            fromStationId: fromStationId,
            toStationId: toStationId,
            announcements: [],
            arrivalTime: item['arrival_time'],     // Destination arrival time!
            departureTime: item['departure_time'], // Origin departure time!
            isAtPlatform: isPlatform,
            journeyDurationMinutes: item['journey_duration_minutes'],
            destinationName: item['to_station_name'],
            predictedStationCrowd: item['predicted_station_crowd'],
          );
        }).toList();
      }
    } catch (e) {
      print('General error in getUpcomingTrains: $e');
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

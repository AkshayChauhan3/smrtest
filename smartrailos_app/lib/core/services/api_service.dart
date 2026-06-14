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

      // Fetch active simulation time from backend to align reference clock
      DateTime now = DateTime.now();
      try {
        final resTime = await http.get(
          Uri.parse('${AppConfig.baseUrl}/api/v1/sim/time'),
          headers: headers,
        );
        if (resTime.statusCode == 200) {
          final timeData = jsonDecode(resTime.body);
          final sysTimeStr = timeData['system_time'];
          if (sysTimeStr != null) {
            final parsed = DateTime.tryParse(sysTimeStr.replaceAll(' ', 'T'));
            if (parsed != null) {
              now = parsed;
            }
          }
        }
      } catch (e) {
        print('Error fetching sim time: $e');
      }
      
      // 1. Fetch current train at station (ESP32_DEMO or real dwelling train)
      TrainModel? currentTrain;
      try {
        final resCurrent = await http.get(
          Uri.parse('${AppConfig.baseUrl}/api/v1/stations/$fromStationId/current'),
          headers: headers,
        );
        if (resCurrent.statusCode == 200) {
          final data = jsonDecode(resCurrent.body);
          if (data != null && data['train_id'] != null) {
            final trainId = data['train_id'] as String;
            final arrTime = data['arrival_time'];
            final depTime = data['departure_time'];
            final totalPax = data['current_passenger_count'] ?? 0;
            final bool isDemo = trainId == 'ESP32_DEMO';

            // Parse the structured coaches array from the API
            List<CoachModel> coachList = [];
            if (data['coaches'] != null && (data['coaches'] as List).isNotEmpty) {
              coachList = (data['coaches'] as List).map((c) {
                final coachIdStr = c['coach_id']?.toString() ?? '1';
                final cleanId = coachIdStr.replaceAll(RegExp(r'[^0-9]'), '');
                return CoachModel(
                  coachNumber: int.tryParse(cleanId.isNotEmpty ? cleanId : '1') ?? 1,
                  type: (c['coach_type'] ?? 'general') == 'ladies' ? 'Ladies' : 'General',
                  capacity: c['capacity'] ?? 400,
                  currentPassengers: c['current_passengers'] ?? 0,
                );
              }).toList();
            } else {
              // Fallback: distribute total across 3 coaches
              coachList = [
                CoachModel(coachNumber: 1, type: 'General', capacity: 400, currentPassengers: totalPax ~/ 3),
                CoachModel(coachNumber: 2, type: 'Ladies', capacity: 400, currentPassengers: totalPax ~/ 4),
                CoachModel(coachNumber: 3, type: 'General', capacity: 400, currentPassengers: totalPax ~/ 3),
              ];
            }

            currentTrain = TrainModel(
              trainId: trainId,
              displayName: isDemo ? 'SENSOR TRAIN (LIVE)' : trainId,
              line: trainId.startsWith('RL') ? MetroLine.red : MetroLine.blue,
              direction: 'Forward',
              etaMinutes: 0,
              departureMinutes: 0,
              coaches: coachList,
              status: TrainStatus.normal,
              currentPositionIndex: 0,
              fromStationId: fromStationId,
              toStationId: toStationId,
              announcements: [],
              arrivalTime: arrTime,
              departureTime: depTime,
              isAtPlatform: true,
            );
          }
        }
      } catch (e) {
        print('Error fetching current train: $e');
      }


      // 2. Fetch upcoming trains (features)
      final List<TrainModel> upcomingTrains = [];
      try {
        final resFeature = await http.get(
          Uri.parse('${AppConfig.baseUrl}/api/v1/stations/$fromStationId/feature'),
          headers: headers,
        );
        if (resFeature.statusCode == 200) {
          final list = jsonDecode(resFeature.body) as List;
          for (var e in list) {
            final trainId = e['train_id'] ?? 'N/A';

            // Skip if already shown from the /current endpoint
            if (currentTrain != null && currentTrain.trainId == trainId) {
              continue;
            }

            final etaStr = e['estimated_arrival_time'] ?? '0';
            final depStr = e['estimated_departure_time'] ?? '0';

            // ESP32_DEMO is the always-present sensor demo train.
            // It is stored in /feature with arrival_time '00:00'.
            // Treat it as the "at platform" train when no real dwelling train exists.
            final bool isDemoTrain = (trainId == 'ESP32_DEMO');

            List<CoachModel> coachList = [];
            if (e['coaches'] != null) {
              coachList = (e['coaches'] as List).map((c) {
                final coachIdStr = c['coach_id']?.toString() ?? '0';
                final cleanId = coachIdStr.replaceAll(RegExp(r'[^0-9]'), '');
                return CoachModel(
                  coachNumber: int.tryParse(cleanId.isNotEmpty ? cleanId : '0') ?? 0,
                  type: c['coach_type'] ?? 'General',
                  capacity: c['capacity'] ?? 400,
                  currentPassengers: c['arrival_passengers'] ?? 0,
                );
              }).toList();
            } else {
              coachList = [
                CoachModel(coachNumber: 1, type: 'General', capacity: 400,
                    currentPassengers: (e['estimated_passenger_incoming'] ?? 0) ~/ 3),
                CoachModel(coachNumber: 2, type: 'Ladies', capacity: 400,
                    currentPassengers: (e['estimated_passenger_incoming'] ?? 0) ~/ 4),
                CoachModel(coachNumber: 3, type: 'General', capacity: 400,
                    currentPassengers: (e['estimated_passenger_incoming'] ?? 0) ~/ 3),
              ];
            }

            if (isDemoTrain) {
              // Show ESP32_DEMO at the top as an at-platform entry
              // (only if /current didn't already return a real train)
              if (currentTrain == null) {
                currentTrain = TrainModel(
                  trainId: trainId,
                  displayName: 'DEMO SENSOR TRAIN',
                  line: MetroLine.blue,
                  direction: 'Forward',
                  etaMinutes: 0,
                  departureMinutes: 0,
                  coaches: coachList,
                  status: TrainStatus.normal,
                  currentPositionIndex: 0,
                  fromStationId: fromStationId,
                  toStationId: toStationId,
                  announcements: [],
                  arrivalTime: etaStr,
                  departureTime: depStr,
                  isAtPlatform: true,
                );
              }
              continue; // Do not add to upcoming list
            }

            // Real upcoming train — compute ETA
            int eta = 20;
            if (etaStr != '0' && etaStr != '--:--') {
              try {
                DateTime? arrivalTime = DateTime.tryParse(etaStr);
                if (arrivalTime == null) {
                  final parts = etaStr.split(':');
                  if (parts.length >= 2) {
                    final h = int.parse(parts[0]);
                    final m = int.parse(parts[1]);
                    arrivalTime = DateTime(now.year, now.month, now.day, h, m);
                  }
                }
                if (arrivalTime != null) {
                  if (arrivalTime.isBefore(now.subtract(const Duration(hours: 12)))) {
                    arrivalTime = arrivalTime.add(const Duration(days: 1));
                  }
                  eta = arrivalTime.difference(now).inMinutes;
                  if (eta < 0) eta = 0;
                }
              } catch (_) {}
            }

            upcomingTrains.add(TrainModel(
              trainId: trainId,
              displayName: trainId,
              line: trainId.startsWith('BL') ? MetroLine.blue : MetroLine.red,
              direction: 'Forward',
              etaMinutes: eta,
              departureMinutes: eta + 2,
              coaches: coachList,
              status: TrainStatus.normal,
              currentPositionIndex: 0,
              fromStationId: fromStationId,
              toStationId: toStationId,
              announcements: [],
              arrivalTime: etaStr,
              departureTime: depStr,
              isAtPlatform: false,
            ));
          }
        }
      } catch (e) {
        print('Error fetching upcoming trains: $e');
      }

      final List<TrainModel> results = [];
      if (currentTrain != null) {
        results.add(currentTrain);
      }
      results.addAll(upcomingTrains);
      return results;
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

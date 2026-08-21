import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_config.dart';
import '../constants/metro_data.dart';
import '../../features/trains/models/train_model.dart';
import '../../features/trains/models/coach_model.dart';
import '../../features/trains/models/announcement_model.dart';

final apiServiceProvider = Provider((ref) => ApiService());

class ApiService {
  Future<Map<String, String>> _getHeaders() async {
    return {'Content-Type': 'application/json'};
  }

  /// Sends a GET request, automatically trying candidate URLs on network failure
  Future<http.Response> _httpGet(String path, {Map<String, String>? headers}) async {
    final candidates = [
      AppConfig.baseUrl,
      ...AppConfig.candidateUrls.where((u) => u != AppConfig.baseUrl),
    ];

    Object? lastError;
    for (final base in candidates) {
      try {
        final uri = Uri.parse('$base$path');
        final res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 4));
        if (res.statusCode < 500) {
          AppConfig.setWorkingUrl(base);
          return res;
        }
      } catch (e) {
        lastError = e;
      }
    }
    throw Exception('Unable to reach backend at any host (${AppConfig.candidateUrls.join(", ")}): $lastError');
  }


  // TRAINS
  Future<List<TrainModel>> getUpcomingTrains(MetroLine line, String fromStationId, String toStationId) async {
    final headers = await _getHeaders();

    final resSearch = await _httpGet(
      '/api/v1/trains/search?from_station=$fromStationId&to_station=$toStationId',
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
          arrivalTime: item['arrival_time'],     // Destination arrival time
          departureTime: item['departure_time'], // Origin departure time
          isAtPlatform: isPlatform,
          journeyDurationMinutes: item['journey_duration_minutes'],
          destinationName: item['to_station_name'],
          predictedStationCrowd: item['predicted_station_crowd'],
          liveCurrentStationId: item['live_current_station_id'],
          liveCurrentStationName: item['live_current_station_name'],
          liveNextStationId: item['live_next_station_id'],
          liveNextStationName: item['live_next_station_name'],
          liveStatus: item['live_status'] ?? 'SCHEDULED',
          journeyProgressPct: ((item['journey_progress_pct'] ?? 0.0) as num).toDouble(),
          stopsTimeline: (item['stops_timeline'] as List? ?? [])
              .map((e) => JourneyStopModel.fromJson(e))
              .toList(),
        );
      }).toList();
    } else {
      throw Exception('Server error searching trains (${resSearch.statusCode}): ${resSearch.body}');
    }
  }

  Future<TrainModel> getTrainDetail(String trainId) async {
    final headers = await _getHeaders();
    try {
      final res = await _httpGet(
        '/api/v1/trains/at-station',
        headers: headers,
      );
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        final t = list.firstWhere((e) => e['train_id'] == trainId, orElse: () => null);
        if (t != null) {
          final coaches = (t['coaches'] as List? ?? []).map((c) {
            final coachIdStr = c['coach_number']?.toString() ?? '1';
            final cleanId = coachIdStr.replaceAll(RegExp(r'[^0-9]'), '');
            return CoachModel(
              coachNumber: int.tryParse(cleanId.isNotEmpty ? cleanId : '1') ?? 1,
              type: (c['coach_type'] ?? 'standard').toString().toLowerCase() == 'ladies' ? 'Ladies' : 'General',
              capacity: c['capacity'] ?? 400,
              currentPassengers: c['current_passenger_count'] ?? 0,
            );
          }).toList();

          final totalPax = coaches.fold(0, (s, c) => s + c.currentPassengers);
          final line = t['line_name'].toString().toLowerCase().contains('blue') ? MetroLine.blue : MetroLine.red;
          final isPlatform = (t['status'] ?? '').toString().toUpperCase() == 'AT_STATION';

          return TrainModel(
            trainId: t['train_id'] ?? trainId,
            displayName: t['train_name'] ?? trainId,
            line: line,
            direction: t['direction'] ?? 'UP',
            etaMinutes: ((t['eta_seconds'] ?? 0) / 60).round(),
            departureMinutes: 2,
            coaches: coaches,
            status: totalPax >= 1020
                ? TrainStatus.full
                : totalPax >= 600
                    ? TrainStatus.moderate
                    : TrainStatus.normal,
            currentPositionIndex: 0,
            fromStationId: t['current_station_id'] ?? t['current_station'] ?? '',
            toStationId: t['next_station_id'] ?? t['next_station'] ?? '',
            announcements: [],
            arrivalTime: t['arrival_time'],
            departureTime: t['departure_time'],
            isAtPlatform: isPlatform,
            liveCurrentStationId: t['current_station_id'],
            liveCurrentStationName: t['current_station'],
            liveNextStationId: t['next_station_id'],
            liveNextStationName: t['next_station'],
            liveStatus: t['status'] ?? (isPlatform ? 'AT_STATION' : 'IN_TRANSIT'),
            journeyProgressPct: ((t['journey_completed_pct'] ?? 0.0) as num).toDouble(),
            stopsTimeline: [],
          );
        }
      }
    } catch (_) {}

    // Fallback: check occupancy endpoint /api/v1/occupancy/trains/$trainId
    try {
      final resOcc = await _httpGet(
        '/api/v1/occupancy/trains/$trainId',
        headers: headers,
      );
      if (resOcc.statusCode == 200) {
        final data = jsonDecode(resOcc.body);
        final coaches = (data['coaches'] as List? ?? []).map((c) {
          final coachIdStr = c['coach_number']?.toString() ?? '1';
          final cleanId = coachIdStr.replaceAll(RegExp(r'[^0-9]'), '');
          return CoachModel(
            coachNumber: int.tryParse(cleanId.isNotEmpty ? cleanId : '1') ?? 1,
            type: (c['coach_type'] ?? 'standard').toString().toLowerCase() == 'ladies' ? 'Ladies' : 'General',
            capacity: c['capacity'] ?? 400,
            currentPassengers: c['current_passenger_count'] ?? 0,
          );
        }).toList();
        final totalPax = data['total_occupancy'] ?? coaches.fold(0, (s, c) => s + c.currentPassengers);
        final lineCode = (data['line_code'] ?? '').toString().toUpperCase();
        return TrainModel(
          trainId: data['train_id'] ?? trainId,
          displayName: data['train_name'] ?? trainId,
          line: lineCode == 'RL' ? MetroLine.red : MetroLine.blue,
          direction: data['direction'] ?? 'UP',
          etaMinutes: 0,
          departureMinutes: 2,
          coaches: coaches,
          status: totalPax >= 1020
              ? TrainStatus.full
              : totalPax >= 600
                  ? TrainStatus.moderate
                  : TrainStatus.normal,
          currentPositionIndex: 0,
          fromStationId: data['current_station_id'] ?? '',
          toStationId: data['next_station_id'] ?? '',
          announcements: [],
          liveCurrentStationId: data['current_station_id'],
          liveCurrentStationName: data['current_station_name'],
          liveNextStationId: data['next_station_id'],
          liveNextStationName: data['next_station_name'],
          liveStatus: data['status'] ?? 'IN_TRANSIT',
        );
      }
    } catch (_) {}

    throw Exception('Train $trainId not found');
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
      final headers = await _getHeaders();
      final res = await _httpGet(
        '/api/v1/announcements/active',
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
      debugPrint('Error fetching announcements: $e');
    }
    return [];
  }

  // SAVED ROUTES (COMMUTER PREFERENCES)
  Future<List<Map<String, String>>> getSavedRoutes() async {
    final prefs = await SharedPreferences.getInstance();
    final routesJson = prefs.getString('saved_commuter_routes');
    if (routesJson != null) {
      try {
        final list = jsonDecode(routesJson) as List;
        return list.map((e) => Map<String, String>.from(e)).toList();
      } catch (_) {}
    }
    return [
      {
        'lineId': 'blue',
        'fromStationId': 'BL08',
        'toStationId': 'BL18',
        'label': 'Old High Court → Thaltej',
      },
      {
        'lineId': 'red',
        'fromStationId': 'RL02',
        'toStationId': 'RL08',
        'label': 'Sabarmati → Old High Court',
      },
    ];
  }

  Future<void> saveRoute(Map<String, String> route) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = await getSavedRoutes();
    existing.add(route);
    await prefs.setString('saved_commuter_routes', jsonEncode(existing));
  }
}

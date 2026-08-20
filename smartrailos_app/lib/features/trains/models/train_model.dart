import 'dart:math';
import '../../../core/constants/metro_data.dart';
import 'coach_model.dart';
import 'announcement_model.dart';

enum TrainStatus { normal, moderate, full, emergency }

class JourneyStopModel {
  final String stationId;
  final String stationName;
  final String arrivalTime;
  final String departureTime;
  final bool isPassed;
  final bool isCurrent;
  final bool isUserOrigin;
  final bool isUserDestination;
  final int predictedStationCrowd;
  final int estimatedTrainOccupancy;

  JourneyStopModel({
    required this.stationId,
    required this.stationName,
    required this.arrivalTime,
    required this.departureTime,
    this.isPassed = false,
    this.isCurrent = false,
    this.isUserOrigin = false,
    this.isUserDestination = false,
    this.predictedStationCrowd = 0,
    this.estimatedTrainOccupancy = 0,
  });

  factory JourneyStopModel.fromJson(Map<String, dynamic> json) {
    return JourneyStopModel(
      stationId: json['station_id'] ?? json['stationId'] ?? '',
      stationName: json['station_name'] ?? json['stationName'] ?? '',
      arrivalTime: json['arrival_time'] ?? json['arrivalTime'] ?? '',
      departureTime: json['departure_time'] ?? json['departureTime'] ?? '',
      isPassed: json['is_passed'] ?? json['isPassed'] ?? false,
      isCurrent: json['is_current'] ?? json['isCurrent'] ?? false,
      isUserOrigin: json['is_user_origin'] ?? json['isUserOrigin'] ?? false,
      isUserDestination: json['is_user_destination'] ?? json['isUserDestination'] ?? false,
      predictedStationCrowd: json['predicted_station_crowd'] ?? json['predictedStationCrowd'] ?? 0,
      estimatedTrainOccupancy: json['estimated_train_occupancy'] ?? json['estimatedTrainOccupancy'] ?? 0,
    );
  }
}

class TrainModel {
  final String trainId;
  final String displayName;
  final MetroLine line;
  final String direction;
  final int etaMinutes;
  final int departureMinutes;
  final List<CoachModel> coaches;
  final TrainStatus status;
  final int currentPositionIndex;
  final String fromStationId;
  final String toStationId;
  final List<AnnouncementModel> announcements;
  final String? arrivalTime;
  final String? departureTime;
  final bool isAtPlatform;
  final int? journeyDurationMinutes;
  final String? destinationName;
  final int? predictedStationCrowd;
  final String? liveCurrentStationId;
  final String? liveCurrentStationName;
  final String? liveNextStationId;
  final String? liveNextStationName;
  final String liveStatus;
  final double journeyProgressPct;
  final List<JourneyStopModel> stopsTimeline;

  TrainModel({
    required this.trainId,
    required this.displayName,
    required this.line,
    required this.direction,
    required this.etaMinutes,
    required this.departureMinutes,
    required this.coaches,
    required this.status,
    required this.currentPositionIndex,
    required this.fromStationId,
    required this.toStationId,
    required this.announcements,
    this.arrivalTime,
    this.departureTime,
    this.isAtPlatform = false,
    this.journeyDurationMinutes,
    this.destinationName,
    this.predictedStationCrowd,
    this.liveCurrentStationId,
    this.liveCurrentStationName,
    this.liveNextStationId,
    this.liveNextStationName,
    this.liveStatus = "SCHEDULED",
    this.journeyProgressPct = 0.0,
    this.stopsTimeline = const [],
  });

  int get totalPassengers => coaches.fold(0, (s, c) => s + c.currentPassengers);
  double get maxCoachFill => coaches.isEmpty ? 0 : coaches.map((c) => c.percentFull).reduce(max);

  factory TrainModel.fromJson(Map<String, dynamic> json) {
    return TrainModel(
      trainId: json['trainId'] ?? json['train_id'] ?? '',
      displayName: json['displayName'] ?? json['train_name'] ?? json['trainId'] ?? '',
      line: (json['line'] ?? json['line_name'] ?? '').toString().toLowerCase().contains('red') ? MetroLine.red : MetroLine.blue,
      direction: json['direction'] ?? 'UP',
      etaMinutes: json['etaMinutes'] ?? json['eta_minutes'] ?? 0,
      departureMinutes: json['departureMinutes'] ?? json['departure_minutes'] ?? 0,
      coaches: (json['coaches'] as List? ?? []).map((e) => CoachModel.fromJson(e)).toList(),
      status: TrainStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TrainStatus.normal,
      ),
      currentPositionIndex: json['currentPositionIndex'] ?? 0,
      fromStationId: json['fromStationId'] ?? json['from_station_id'] ?? '',
      toStationId: json['toStationId'] ?? json['to_station_id'] ?? '',
      announcements: (json['announcements'] as List? ?? []).map((e) => AnnouncementModel.fromJson(e)).toList(),
      arrivalTime: json['arrivalTime'] ?? json['arrival_time'],
      departureTime: json['departureTime'] ?? json['departure_time'],
      isAtPlatform: json['isAtPlatform'] ?? json['is_at_platform'] ?? false,
      journeyDurationMinutes: json['journeyDurationMinutes'] ?? json['journey_duration_minutes'],
      destinationName: json['destinationName'] ?? json['to_station_name'],
      predictedStationCrowd: json['predictedStationCrowd'] ?? json['predicted_station_crowd'],
      liveCurrentStationId: json['live_current_station_id'] ?? json['liveCurrentStationId'],
      liveCurrentStationName: json['live_current_station_name'] ?? json['liveCurrentStationName'],
      liveNextStationId: json['live_next_station_id'] ?? json['liveNextStationId'],
      liveNextStationName: json['live_next_station_name'] ?? json['liveNextStationName'],
      liveStatus: json['live_status'] ?? json['liveStatus'] ?? 'SCHEDULED',
      journeyProgressPct: ((json['journey_progress_pct'] ?? json['journeyProgressPct'] ?? 0.0) as num).toDouble(),
      stopsTimeline: (json['stops_timeline'] as List? ?? json['stopsTimeline'] as List? ?? [])
          .map((e) => JourneyStopModel.fromJson(e))
          .toList(),
    );
  }
}

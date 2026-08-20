import 'dart:math';
import '../../../core/constants/metro_data.dart';
import 'coach_model.dart';
import 'announcement_model.dart';

enum TrainStatus { normal, moderate, full, emergency }

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
    );
  }
}

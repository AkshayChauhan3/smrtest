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
  });

  int get totalPassengers => coaches.fold(0, (s, c) => s + c.currentPassengers);
  double get maxCoachFill => coaches.isEmpty ? 0 : coaches.map((c) => c.percentFull).reduce(max);

  factory TrainModel.fromJson(Map<String, dynamic> json) {
    return TrainModel(
      trainId: json['trainId'],
      displayName: json['displayName'],
      line: MetroLine.values.firstWhere((e) => e.name == json['line']),
      direction: json['direction'],
      etaMinutes: json['etaMinutes'],
      departureMinutes: json['departureMinutes'],
      coaches: (json['coaches'] as List).map((e) => CoachModel.fromJson(e)).toList(),
      status: TrainStatus.values.firstWhere((e) => e.name == json['status']),
      currentPositionIndex: json['currentPositionIndex'],
      fromStationId: json['fromStationId'],
      toStationId: json['toStationId'],
      announcements: (json['announcements'] as List).map((e) => AnnouncementModel.fromJson(e)).toList(),
    );
  }
}

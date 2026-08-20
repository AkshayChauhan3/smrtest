import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/services/api_service.dart';
import '../models/train_model.dart';
import '../models/announcement_model.dart';

final selectedLineProvider = StateProvider<MetroLine>((ref) => MetroLine.blue);
final fromStationProvider = StateProvider<Station?>((ref) => null);
final toStationProvider = StateProvider<Station?>((ref) => null);

/// Polls the backend every 5 seconds (matching the simulation tick).
/// This keeps the live passenger count from the ESP32 sensor in sync
/// with the Flutter UI automatically — no manual refresh needed.
final trainResultsProvider = StreamProvider.family<List<TrainModel>, ({String lineId, String fromStationId, String toStationId})>((ref, params) {
  final api = ref.read(apiServiceProvider);
  final line = MetroLine.values.firstWhere((e) => e.name == params.lineId);

  return Stream.periodic(const Duration(seconds: 5)).asyncMap((_) async {
    return api.getUpcomingTrains(line, params.fromStationId, params.toStationId);
  }).asBroadcastStream();
});

final trainDetailProvider = FutureProvider.family<TrainModel, String>((ref, trainId) async {
  return ref.read(apiServiceProvider).getTrainDetail(trainId);
});

final announcementsProvider = FutureProvider.family<List<AnnouncementModel>, String>((ref, stationId) async {
  return ref.read(apiServiceProvider).getActiveAnnouncements(stationId);
});

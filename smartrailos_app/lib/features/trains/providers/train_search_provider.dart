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
final trainResultsProvider = StreamProvider.family<List<TrainModel>, ({String lineId, String fromStationId, String toStationId})>((ref, params) async* {
  final api = ref.read(apiServiceProvider);
  final line = MetroLine.values.firstWhere((e) => e.name == params.lineId);

  // Yield immediately on invocation
  yield await api.getUpcomingTrains(line, params.fromStationId, params.toStationId);

  // Then poll every 5 seconds
  while (true) {
    await Future.delayed(const Duration(seconds: 5));
    yield await api.getUpcomingTrains(line, params.fromStationId, params.toStationId);
  }
});


final trainDetailProvider = FutureProvider.family<TrainModel, String>((ref, trainId) async {
  return ref.read(apiServiceProvider).getTrainDetail(trainId);
});

final announcementsProvider = FutureProvider.family<List<AnnouncementModel>, String>((ref, stationId) async {
  return ref.read(apiServiceProvider).getActiveAnnouncements(stationId);
});

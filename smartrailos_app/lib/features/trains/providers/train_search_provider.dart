import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/services/api_service.dart';
import '../models/train_model.dart';
import '../models/announcement_model.dart';
import '../../auth/providers/auth_provider.dart';

final selectedLineProvider = StateProvider<MetroLine>((ref) => MetroLine.blue);
final fromStationProvider = StateProvider<Station?>((ref) => null);
final toStationProvider = StateProvider<Station?>((ref) => null);

// BACKEND: This provider calls ApiService.getUpcomingTrains() which currently returns mock data.
// When the backend is live, no change is needed here — ApiService handles the swap.
// For real-time updates, convert this to a StreamProvider polling every 30 seconds:
//   Stream.periodic(Duration(seconds: 30)).asyncMap((_) => ApiService().getUpcomingTrains(...))
final trainResultsProvider = FutureProvider.family<List<TrainModel>, ({String lineId, String fromStationId, String toStationId})>((ref, params) async {
  final api = ref.read(apiServiceProvider);
  final line = MetroLine.values.firstWhere((e) => e.name == params.lineId);
  return api.getUpcomingTrains(line, params.fromStationId, params.toStationId);
});

final trainDetailProvider = FutureProvider.family<TrainModel, String>((ref, trainId) async {
  return ref.read(apiServiceProvider).getTrainDetail(trainId);
});

final announcementsProvider = FutureProvider.family<List<AnnouncementModel>, String>((ref, stationId) async {
  return ref.read(apiServiceProvider).getActiveAnnouncements(stationId);
});

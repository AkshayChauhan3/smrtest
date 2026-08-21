import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../models/esp_sensor_model.dart';

final espSensorLiveProvider = FutureProvider.autoDispose<EspSensorModel?>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getEsp32Live();
});

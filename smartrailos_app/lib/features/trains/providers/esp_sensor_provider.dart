import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../models/esp_sensor_model.dart';

final espSensorLiveProvider = StreamProvider.autoDispose<EspSensorModel?>((ref) async* {
  final apiService = ref.watch(apiServiceProvider);

  // Fetch immediately
  final initial = await apiService.getEsp32Live();
  yield initial;

  // Poll periodically (every 2 seconds)
  final timer = Stream.periodic(const Duration(seconds: 2));
  await for (final _ in timer) {
    try {
      final updated = await apiService.getEsp32Live();
      if (updated != null) {
        yield updated;
      }
    } catch (_) {
      // Keep previous yield on network hiccup
    }
  }
});

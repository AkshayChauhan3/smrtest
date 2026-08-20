import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:device_preview/device_preview.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    DevicePreview(
      // Disable in release builds; enable in debug/profile
      enabled: !kReleaseMode,
      builder: (context) => const ProviderScope(
        child: MetroApp(),
      ),
    ),
  );
}

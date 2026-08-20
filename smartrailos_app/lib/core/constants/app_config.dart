import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class AppConfig {
  // Configurable base URL:
  // - Reads API_BASE_URL compile-time environment variable if passed
  // - On Android: supports physical devices (via adb reverse / LAN) and emulators (10.0.2.2)
  // - On Web/Desktop: defaults to http://localhost:8000
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  static String? _workingUrl;

  static List<String> get candidateUrls {
    if (_envBaseUrl.isNotEmpty) return [_envBaseUrl];
    if (kIsWeb) return const ['http://localhost:8000'];
    try {
      if (Platform.isAndroid) {
        return const [
          'http://127.0.0.1:8000',      // Physical device via adb reverse
          'http://10.0.2.2:8000',        // Android Emulator loopback
          'http://localhost:8000',       // Localhost alias
          'http://192.168.29.193:8000',  // WiFi LAN host IP
        ];
      }
    } catch (_) {}
    return const ['http://localhost:8000'];
  }

  static String get baseUrl => _workingUrl ?? candidateUrls.first;

  static void setWorkingUrl(String url) {
    _workingUrl = url;
  }

  static Map<String, String> authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };
}



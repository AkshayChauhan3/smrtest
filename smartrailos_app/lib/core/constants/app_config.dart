class AppConfig {
  // BACKEND: Replace with actual deployed server URL before release
  // Method:  N/A (config only)
  // URL:     Set baseUrl to your server, e.g. 'https://metro-admin.example.com'
  static const String baseUrl = 'http://10.0.2.2:8000'; // Android emulator localhost

  static Map<String, String> authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };
}

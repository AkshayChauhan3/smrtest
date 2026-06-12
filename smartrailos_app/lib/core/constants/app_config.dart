class AppConfig {
  // FOR BACKEND IMPLEMENTATION:
  // Replace with actual deployed server URL before release.
  // Examples:
  //   - Production: 'https://api.smartrail.os'
  //   - Local Dev (Android): 'http://10.0.2.2:8000'
  //   - Local Dev (iOS): 'http://localhost:8000'
  static const String baseUrl = 'http://10.0.2.2:8000';

  static Map<String, String> authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };
}

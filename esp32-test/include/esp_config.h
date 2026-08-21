#ifndef ESP_CONFIG_H
#define ESP_CONFIG_H

/**
 * @file esp_config.h
 * @brief SmartRail OS — ESP32 Directional Passenger Counter Configuration
 */

// ─── Network & Backend Configuration ───────────────────────────────────────────
// Set to 1 to enable direct Wi-Fi telemetry posting from ESP32, or 0 for USB serial bridge mode
#define ENABLE_WIFI         0

// Wi-Fi Credentials
#define WIFI_SSID           "Your_WiFi_SSID"
#define WIFI_PASSWORD       "Your_WiFi_Password"

// SmartRail OS Backend Server IP & Port (e.g. your computer's local LAN IP)
#define BACKEND_HOST        "192.168.1.100"
#define BACKEND_PORT        8000
#define TELEMETRY_ENDPOINT  "/api/v1/esp32/telemetry"

// ─── Hardware Pin Mapping (ESP32) ──────────────────────────────────────────────
// Sensor 1: Platform / Entry Side
#define TRIG1_PIN           4
#define ECHO1_PIN           14

// Sensor 2: Coach Interior / Exit Side
#define TRIG2_PIN           27
#define ECHO2_PIN           33

// Status LED (Builtin LED is GPIO 2 on standard ESP32 DevKit)
#define LED_PIN             2

// ─── Directional Detection & Filtering Parameters ─────────────────────────────
// Hysteresis detection distance (hands/passengers closer than this trigger entry)
#define THRESHOLD_ENTER_CM  42.0

// Hysteresis release distance (must clear beyond this to register clear)
#define THRESHOLD_LEAVE_CM  48.0

// Maximum time in milliseconds allowed for a full traversal before resetting to IDLE
#define TIMEOUT_MS          2200

// Cooldown in milliseconds after a successful count before next crossing can start
#define COOLDOWN_MS         450

// Spacing delay in milliseconds between pinging S1 and S2 to avoid echo cross-talk
#define SENSOR_SPACING_MS   20

// ─── Transit & Coach Metadata ─────────────────────────────────────────────────
#define DEVICE_ID           "ESP32_COACH_01"
#define DEFAULT_STATION_ID  "BL08"        // e.g. Old High Court (BL08)
#define DEFAULT_COACH_ID    "C1"
#define COACH_CAPACITY      400

#endif // ESP_CONFIG_H

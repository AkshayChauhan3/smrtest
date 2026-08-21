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

// Status LED (Optional, builtin LED is GPIO 2 on standard ESP32 DevKit)
#define LED_PIN             2

// ─── Directional Detection Parameters ─────────────────────────────────────────
// Obstacle detection threshold distance in centimeters (hands within 45cm trigger crossing)
#define THRESHOLD_CM        45.0

// Maximum time in milliseconds allowed for a full traversal before resetting to IDLE
#define TIMEOUT_MS          2500

// Cooldown in milliseconds between consecutive passenger counts
#define COOLDOWN_MS         400

// Spacing delay in milliseconds between pinging S1 and S2 to avoid echo cross-talk
#define SENSOR_SPACING_MS   25

// ─── Transit & Coach Metadata ─────────────────────────────────────────────────
#define DEVICE_ID           "ESP32_COACH_01"
#define DEFAULT_STATION_ID  "BL08"        // e.g. Old High Court (BL08) or NULL for all
#define DEFAULT_COACH_ID    "C1"
#define COACH_CAPACITY      400

#endif // ESP_CONFIG_H

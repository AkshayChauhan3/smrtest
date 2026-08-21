/**
 * @file main.cpp
 * @brief SmartRail OS — ESP32 Directional Passenger Counter (IN / OUT Tracking)
 *
 * Hardware
 * --------
 * Two HC-SR04 ultrasonic sensors are mounted at opposite sides of a metro coach door.
 *
 *   Sensor 1 (Platform/Entry) -> Sensor 2 (Inside Coach/Exit): BOARDING  (total_in++,  occupancy++)
 *   Sensor 2 (Inside Coach/Exit) -> Sensor 1 (Platform/Entry): ALIGHTING (total_out++, occupancy--)
 *
 * Output
 * ------
 * Emits both human-readable status markers and structured JSON lines:
 *   {"event":"IN","in_delta":1,"out_delta":0,"occupancy":35,"total_in":45,"total_out":10,"d1":14.2,"d2":45.0}
 */

#include <Arduino.h>
#include "esp_config.h"

#if ENABLE_WIFI
  #include <WiFi.h>
  #include <HTTPClient.h>
#endif

// ─── State & Counters ─────────────────────────────────────────────────────────
volatile int occupancy = 0;
volatile int total_in  = 0;
volatile int total_out = 0;

enum State {
  IDLE,
  IN_S1_FIRST,
  IN_BOTH,
  IN_S2_LEAVING,

  OUT_S2_FIRST,
  OUT_BOTH,
  OUT_S1_LEAVING
};

State state = IDLE;
unsigned long stateStartTime = 0;
unsigned long lastCountTime  = 0;
unsigned long lastTelemetrySync = 0;

// ─── Sensor Functions ─────────────────────────────────────────────────────────

float getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure echo pulse width (max 30ms timeout ~ 5 meters)
  long duration = pulseIn(echoPin, HIGH, 30000);

  if (duration <= 0 || duration >= 30000) {
    return 999.0;
  }

  float distanceCm = (duration * 0.0343) / 2.0;
  if (distanceCm < 2.0 || distanceCm > 400.0) {
    return 999.0;
  }

  return distanceCm;
}

void dispatchEvent(const char* dir, int in_d, int out_d, float d1, float d2) {
  // 1. Structured JSON for Serial Bridge (One single atomic line)
  char jsonLine[160];
  snprintf(
    jsonLine,
    sizeof(jsonLine),
    "{\"event\":\"%s\",\"in_delta\":%d,\"out_delta\":%d,\"occupancy\":%d,\"total_in\":%d,\"total_out\":%d,\"d1\":%.1f,\"d2\":%.1f}",
    dir, in_d, out_d, occupancy, total_in, total_out, d1, d2
  );
  Serial.println(jsonLine);

  // 2. Human-readable crossing alert
  if (strcmp(dir, "IN") == 0) {
    Serial.printf(">>> [BOARDING +1] Total IN: %d | Occupancy: %d <<<\n", total_in, occupancy);
  } else if (strcmp(dir, "OUT") == 0) {
    Serial.printf(">>> [ALIGHTING -1] Total OUT: %d | Occupancy: %d <<<\n", total_out, occupancy);
  }
}

// ─── Arduino Lifecycle ────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(TRIG1_PIN, OUTPUT);
  pinMode(ECHO1_PIN, INPUT);

  pinMode(TRIG2_PIN, OUTPUT);
  pinMode(ECHO2_PIN, INPUT);

  digitalWrite(TRIG1_PIN, LOW);
  digitalWrite(TRIG2_PIN, LOW);

  Serial.println();
  Serial.println("==================================================");
  Serial.println(" SmartRail OS — Directional Passenger Counter     ");
  Serial.printf (" Threshold: < %.1f cm | S1: GPIO %d | S2: GPIO %d\n", THRESHOLD_CM, TRIG1_PIN, TRIG2_PIN);
  Serial.printf (" Station: %s | Coach: %s | Cap: %d\n", DEFAULT_STATION_ID, DEFAULT_COACH_ID, COACH_CAPACITY);
  Serial.println("==================================================");
  Serial.println();
}

void loop() {
  // 1. Read Sensor 1 (Platform Entry)
  float d1 = getDistance(TRIG1_PIN, ECHO1_PIN);
  delay(SENSOR_SPACING_MS); // Prevent acoustic cross-talk

  // 2. Read Sensor 2 (Coach Interior)
  float d2 = getDistance(TRIG2_PIN, ECHO2_PIN);

  bool s1 = (d1 >= 2.0 && d1 <= THRESHOLD_CM);
  bool s2 = (d2 >= 2.0 && d2 <= THRESHOLD_CM);

  // 3. Periodic Live Telemetry Sync (emitted every 1.5 seconds when idle)
  if (millis() - lastTelemetrySync > 1500) {
    lastTelemetrySync = millis();
    if (state == IDLE) {
      char statusBuf[160];
      snprintf(
        statusBuf,
        sizeof(statusBuf),
        "{\"event\":\"SYNC\",\"in_delta\":0,\"out_delta\":0,\"occupancy\":%d,\"total_in\":%d,\"total_out\":%d,\"d1\":%.1f,\"d2\":%.1f}",
        occupancy, total_in, total_out, d1, d2
      );
      Serial.println(statusBuf);
    }
  }

  // 4. Directional State Machine
  switch (state) {

    // ── IDLE ─────────────────────────────────────────────────────────────────
    case IDLE:
      if (millis() - lastCountTime < COOLDOWN_MS)
        break;

      if (s1 && !s2) {
        state = IN_S1_FIRST;
        stateStartTime = millis();
      }
      else if (s2 && !s1) {
        state = OUT_S2_FIRST;
        stateStartTime = millis();
      }
      break;

    // ── BOARDING SEQUENCE (S1 -> S2) ─────────────────────────────────────────
    case IN_S1_FIRST:
      if (s1 && s2) {
        state = IN_BOTH;
      }
      else if (!s1 && s2) {
        state = IN_S2_LEAVING;
      }
      else if (!s1 && !s2 && (millis() - stateStartTime > 350)) {
        state = IDLE; // Aborted
      }
      else if (millis() - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case IN_BOTH:
      if (!s1 && s2) {
        state = IN_S2_LEAVING;
      }
      else if (!s1 && !s2) {
        // Fast complete pass
        total_in++;
        occupancy++;
        lastCountTime = millis();
        dispatchEvent("IN", 1, 0, d1, d2);
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case IN_S2_LEAVING:
      if (!s1 && !s2) {
        total_in++;
        occupancy++;
        lastCountTime = millis();
        dispatchEvent("IN", 1, 0, d1, d2);
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    // ── ALIGHTING SEQUENCE (S2 -> S1) ────────────────────────────────────────
    case OUT_S2_FIRST:
      if (s1 && s2) {
        state = OUT_BOTH;
      }
      else if (s1 && !s2) {
        state = OUT_S1_LEAVING;
      }
      else if (!s1 && !s2 && (millis() - stateStartTime > 350)) {
        state = IDLE; // Aborted
      }
      else if (millis() - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case OUT_BOTH:
      if (s1 && !s2) {
        state = OUT_S1_LEAVING;
      }
      else if (!s1 && !s2) {
        // Fast complete pass
        total_out++;
        if (occupancy > 0) occupancy--;
        lastCountTime = millis();
        dispatchEvent("OUT", 0, 1, d1, d2);
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case OUT_S1_LEAVING:
      if (!s1 && !s2) {
        total_out++;
        if (occupancy > 0) occupancy--;
        lastCountTime = millis();
        dispatchEvent("OUT", 0, 1, d1, d2);
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;
  }

  delay(20);
}
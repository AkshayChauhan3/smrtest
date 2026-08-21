/**
 * @file main.cpp
 * @brief SmartRail OS — ESP32 Directional Passenger Counter (Smooth & Accurate IN/OUT FSM)
 *
 * Traversal Sequences:
 * --------------------
 *   Boarding (IN):   IDLE -> IN_ENTRY (S1) -> IN_MIDWAY (S1+S2) -> IN_EXITING (S2) -> Completed (+1 IN)
 *   Alighting (OUT): IDLE -> OUT_ENTRY (S2) -> OUT_MIDWAY (S2+S1) -> OUT_EXITING (S1) -> Completed (+1 OUT)
 */

#include <Arduino.h>
#include "esp_config.h"

#if ENABLE_WIFI
  #include <WiFi.h>
  #include <HTTPClient.h>
#endif

// ─── Authoritative State & Counters ──────────────────────────────────────────
volatile int occupancy = 0;
volatile int total_in  = 0;
volatile int total_out = 0;

enum FsmState {
  IDLE,
  IN_ENTRY,     // Sensor 1 broken first
  IN_MIDWAY,    // Both sensors broken (body passing through doorway)
  IN_EXITING,   // Sensor 1 cleared, still on Sensor 2

  OUT_ENTRY,    // Sensor 2 broken first
  OUT_MIDWAY,   // Both sensors broken
  OUT_EXITING   // Sensor 2 cleared, still on Sensor 1
};

FsmState state = IDLE;
unsigned long stateStartTime    = 0;
unsigned long lastCountTime     = 0;
unsigned long lastTelemetrySync = 0;

// Filter history
float s1_history[3] = {999.0f, 999.0f, 999.0f};
float s2_history[3] = {999.0f, 999.0f, 999.0f};
int sample_idx = 0;

// Hysteresis states
bool s1_latched = false;
bool s2_latched = false;

// ─── Filter & Distance Measurement ───────────────────────────────────────────

float median3(float a, float b, float c) {
  if ((a <= b && b <= c) || (c <= b && b <= a)) return b;
  if ((b <= a && a <= c) || (c <= a && a <= b)) return a;
  return c;
}

float readRawDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Pulse timeout ~ 25ms (4.3 meters max)
  long duration = pulseIn(echoPin, HIGH, 25000);

  if (duration <= 0 || duration >= 25000) {
    return 999.0f;
  }

  float distanceCm = (duration * 0.0343f) / 2.0f;
  if (distanceCm < 2.0f || distanceCm > 400.0f) {
    return 999.0f;
  }

  return distanceCm;
}

void dispatchEvent(const char* dir, int in_d, int out_d, float d1, float d2) {
  // Emit single authoritative structured JSON line
  char jsonLine[160];
  snprintf(
    jsonLine,
    sizeof(jsonLine),
    "{\"event\":\"%s\",\"in_delta\":%d,\"out_delta\":%d,\"occupancy\":%d,\"total_in\":%d,\"total_out\":%d,\"d1\":%.1f,\"d2\":%.1f}",
    dir, in_d, out_d, occupancy, total_in, total_out, d1, d2
  );
  Serial.println(jsonLine);

  // Quick LED pulse indicator on crossing
  digitalWrite(LED_PIN, HIGH);
}

// ─── Setup & Loop ────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(TRIG1_PIN, OUTPUT);
  pinMode(ECHO1_PIN, INPUT);

  pinMode(TRIG2_PIN, OUTPUT);
  pinMode(ECHO2_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  digitalWrite(TRIG1_PIN, LOW);
  digitalWrite(TRIG2_PIN, LOW);

  Serial.println();
  Serial.println("==================================================");
  Serial.println(" SmartRail OS — Precision Passenger Counter       ");
  Serial.printf (" In-Threshold: < %.1f cm | Out-Threshold: < %.1f cm\n", THRESHOLD_ENTER_CM, THRESHOLD_LEAVE_CM);
  Serial.printf (" Station: %s | Coach: %s | Capacity: %d pax\n", DEFAULT_STATION_ID, DEFAULT_COACH_ID, COACH_CAPACITY);
  Serial.println("==================================================");
  Serial.println();
}

void loop() {
  // 1. Sample raw ultrasonic pings with cross-talk avoidance delay
  float raw1 = readRawDistance(TRIG1_PIN, ECHO1_PIN);
  delay(SENSOR_SPACING_MS);
  float raw2 = readRawDistance(TRIG2_PIN, ECHO2_PIN);

  // 2. Update 3-sample median filter ring buffers
  s1_history[sample_idx] = raw1;
  s2_history[sample_idx] = raw2;
  sample_idx = (sample_idx + 1) % 3;

  float d1 = median3(s1_history[0], s1_history[1], s1_history[2]);
  float d2 = median3(s2_history[0], s2_history[1], s2_history[2]);

  // 3. Hysteresis detection (Enter at <42cm, Release at >48cm)
  s1_latched = s1_latched ? (d1 < THRESHOLD_LEAVE_CM) : (d1 < THRESHOLD_ENTER_CM);
  s2_latched = s2_latched ? (d2 < THRESHOLD_LEAVE_CM) : (d2 < THRESHOLD_ENTER_CM);

  // 4. Directional State Machine
  unsigned long now = millis();

  switch (state) {

    // ── IDLE ─────────────────────────────────────────────────────────────────
    case IDLE:
      digitalWrite(LED_PIN, LOW);

      if (now - lastCountTime < COOLDOWN_MS) {
        break; // Guard against bounce immediately after traversal
      }

      if (s1_latched && !s2_latched) {
        state = IN_ENTRY;
        stateStartTime = now;
      }
      else if (s2_latched && !s1_latched) {
        state = OUT_ENTRY;
        stateStartTime = now;
      }
      break;

    // ── BOARDING SEQUENCE (S1 -> S2) ─────────────────────────────────────────
    case IN_ENTRY:
      if (s1_latched && s2_latched) {
        state = IN_MIDWAY;
      }
      else if (!s1_latched && !s2_latched) {
        // Aborted step before reaching S2
        state = IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case IN_MIDWAY:
      if (!s1_latched && s2_latched) {
        state = IN_EXITING;
      }
      else if (!s1_latched && !s2_latched) {
        // Person completed pass quickly
        total_in++;
        occupancy++;
        lastCountTime = now;
        dispatchEvent("IN", 1, 0, d1, d2);
        state = IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case IN_EXITING:
      if (!s1_latched && !s2_latched) {
        // Clean complete exit from doorway -> Register +1 IN
        total_in++;
        occupancy++;
        lastCountTime = now;
        dispatchEvent("IN", 1, 0, d1, d2);
        state = IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    // ── ALIGHTING SEQUENCE (S2 -> S1) ────────────────────────────────────────
    case OUT_ENTRY:
      if (s1_latched && s2_latched) {
        state = OUT_MIDWAY;
      }
      else if (!s1_latched && !s2_latched) {
        // Aborted step before reaching S1
        state = IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case OUT_MIDWAY:
      if (s1_latched && !s2_latched) {
        state = OUT_EXITING;
      }
      else if (!s1_latched && !s2_latched) {
        // Person completed exit pass quickly
        total_out++;
        if (occupancy > 0) occupancy--;
        lastCountTime = now;
        dispatchEvent("OUT", 0, 1, d1, d2);
        state = IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;

    case OUT_EXITING:
      if (!s1_latched && !s2_latched) {
        // Clean complete exit outside coach -> Register +1 OUT
        total_out++;
        if (occupancy > 0) occupancy--;
        lastCountTime = now;
        dispatchEvent("OUT", 0, 1, d1, d2);
        state = IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = IDLE;
      }
      break;
  }

  // 5. Periodic Sync Telemetry (every 1.5 seconds when idle)
  if (now - lastTelemetrySync > 1500) {
    lastTelemetrySync = now;
    if (state == IDLE) {
      char syncBuf[160];
      snprintf(
        syncBuf,
        sizeof(syncBuf),
        "{\"event\":\"SYNC\",\"in_delta\":0,\"out_delta\":0,\"occupancy\":%d,\"total_in\":%d,\"total_out\":%d,\"d1\":%.1f,\"d2\":%.1f}",
        occupancy, total_in, total_out, d1, d2
      );
      Serial.println(syncBuf);
    }
  }

  delay(15);
}
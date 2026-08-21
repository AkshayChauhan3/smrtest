/**
 * @file main.cpp
 * @brief SmartRail OS — ESP32 Dual-Beam Directional Passenger Counter (0->1 IN, 1->0 OUT)
 *
 * Mathematical Traversal Model:
 * -----------------------------
 *  Boarding (IN: 0 -> 1):
 *    (0,0) IDLE -> (1,0) S0_Active -> (1,1) Both_Active -> (0,1) S1_Active -> (0,0) [COUNT +1 IN]
 *
 *  Alighting (OUT: 1 -> 0):
 *    (0,0) IDLE -> (0,1) S1_Active -> (1,1) Both_Active -> (1,0) S0_Active -> (0,0) [COUNT -1 OUT]
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
  STATE_IDLE,

  // Boarding Sequence (0 -> 1)
  STATE_IN_S0,        // S0 blocked first (1, 0)
  STATE_IN_BOTH,      // S0 and S1 both blocked (1, 1)
  STATE_IN_S1_ONLY,   // S0 cleared, S1 still blocked (0, 1)

  // Alighting Sequence (1 -> 0)
  STATE_OUT_S1,       // S1 blocked first (0, 1)
  STATE_OUT_BOTH,     // S1 and S0 both blocked (1, 1)
  STATE_OUT_S0_ONLY   // S1 cleared, S0 still blocked (1, 0)
};

FsmState state = STATE_IDLE;
unsigned long stateStartTime    = 0;
unsigned long lastCountTime     = 0;
unsigned long lastTelemetrySync = 0;

// Filter history (3-sample median ring buffer)
float s0_history[3] = {999.0f, 999.0f, 999.0f};
float s1_history[3] = {999.0f, 999.0f, 999.0f};
int sample_idx = 0;

// Hysteresis latches
bool s0_blocked = false;
bool s1_blocked = false;

// ─── Median Filter & Distance Ping ────────────────────────────────────────────

float median3(float a, float b, float c) {
  if ((a <= b && b <= c) || (c <= b && b <= a)) return b;
  if ((b <= a && a <= c) || (c <= a && a <= b)) return a;
  return c;
}

float pingUltrasonic(int trigPin, int echoPin) {
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

void dispatchCrossing(const char* dir, int in_d, int out_d, float d0, float d1) {
  char jsonLine[160];
  snprintf(
    jsonLine,
    sizeof(jsonLine),
    "{\"event\":\"%s\",\"in_delta\":%d,\"out_delta\":%d,\"occupancy\":%d,\"total_in\":%d,\"total_out\":%d,\"d1\":%.1f,\"d2\":%.1f}",
    dir, in_d, out_d, occupancy, total_in, total_out, d0, d1
  );
  Serial.println(jsonLine);

  // Status LED pulse
  digitalWrite(LED_PIN, HIGH);
}

// ─── Arduino Lifecycle ────────────────────────────────────────────────────────

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
  Serial.println(" SmartRail OS — Dual-Beam Passenger Gate FSM      ");
  Serial.printf (" S0 (Entry): GPIO %d/%d | S1 (Exit): GPIO %d/%d\n", TRIG1_PIN, ECHO1_PIN, TRIG2_PIN, ECHO2_PIN);
  Serial.printf (" Thresholds: Block < %.1f cm | Clear > %.1f cm\n", THRESHOLD_ENTER_CM, THRESHOLD_LEAVE_CM);
  Serial.printf (" Station: %s | Coach: %s | Invert: %d\n", DEFAULT_STATION_ID, DEFAULT_COACH_ID, INVERT_DIRECTION);
  Serial.println("==================================================");
  Serial.println();
}

void loop() {
  // 1. Read ultrasonic pings with cross-talk avoidance delay
  float raw0 = pingUltrasonic(TRIG1_PIN, ECHO1_PIN);
  delay(SENSOR_SPACING_MS);
  float raw1 = pingUltrasonic(TRIG2_PIN, ECHO2_PIN);

  // 2. 3-Sample Median Ring Filter
  s0_history[sample_idx] = raw0;
  s1_history[sample_idx] = raw1;
  sample_idx = (sample_idx + 1) % 3;

  float d0 = median3(s0_history[0], s0_history[1], s0_history[2]);
  float d1 = median3(s1_history[0], s1_history[1], s1_history[2]);

  // 3. Hysteresis Obstacle Detection
  bool b0_raw = s0_blocked ? (d0 < THRESHOLD_LEAVE_CM) : (d0 < THRESHOLD_ENTER_CM);
  bool b1_raw = s1_blocked ? (d1 < THRESHOLD_LEAVE_CM) : (d1 < THRESHOLD_ENTER_CM);

  s0_blocked = b0_raw;
  s1_blocked = b1_raw;

  // Handle optional physical inversion
  bool b0 = INVERT_DIRECTION ? s1_blocked : s0_blocked;
  bool b1 = INVERT_DIRECTION ? s0_blocked : s1_blocked;

  unsigned long now = millis();

  // 4. Directional State Machine (0->1 Boarding IN, 1->0 Alighting OUT)
  switch (state) {

    // ── IDLE (0, 0) ──────────────────────────────────────────────────────────
    case STATE_IDLE:
      digitalWrite(LED_PIN, LOW);

      if (now - lastCountTime < COOLDOWN_MS) {
        break; // Post-count debounce
      }

      if (b0 && !b1) {
        // Sensor 0 tripped first -> Potential IN (0 -> 1)
        state = STATE_IN_S0;
        stateStartTime = now;
      }
      else if (b1 && !b0) {
        // Sensor 1 tripped first -> Potential OUT (1 -> 0)
        state = STATE_OUT_S1;
        stateStartTime = now;
      }
      break;

    // ── BOARDING SEQUENCE (IN: 0 -> 1) ───────────────────────────────────────
    case STATE_IN_S0:
      if (b0 && b1) {
        state = STATE_IN_BOTH;
      }
      else if (!b0 && !b1) {
        // Person walked up to S0 and backed away -> Reset (NO COUNT)
        state = STATE_IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = STATE_IDLE;
      }
      break;

    case STATE_IN_BOTH:
      if (!b0 && b1) {
        state = STATE_IN_S1_ONLY;
      }
      else if (b0 && !b1) {
        // Person stepped back towards S0
        state = STATE_IN_S0;
      }
      else if (!b0 && !b1) {
        // Fast crossing through both beams -> REGISTER IN
        total_in++;
        occupancy++;
        lastCountTime = now;
        dispatchCrossing("IN", 1, 0, d0, d1);
        state = STATE_IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = STATE_IDLE;
      }
      break;

    case STATE_IN_S1_ONLY:
      if (!b0 && !b1) {
        // Fully cleared doorway on S1 side -> REGISTER IN (+1)
        total_in++;
        occupancy++;
        lastCountTime = now;
        dispatchCrossing("IN", 1, 0, d0, d1);
        state = STATE_IDLE;
      }
      else if (b0 && b1) {
        state = STATE_IN_BOTH;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = STATE_IDLE;
      }
      break;

    // ── ALIGHTING SEQUENCE (OUT: 1 -> 0) ──────────────────────────────────────
    case STATE_OUT_S1:
      if (b0 && b1) {
        state = STATE_OUT_BOTH;
      }
      else if (!b0 && !b1) {
        // Person walked up to S1 and backed away -> Reset (NO COUNT)
        state = STATE_IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = STATE_IDLE;
      }
      break;

    case STATE_OUT_BOTH:
      if (b0 && !b1) {
        state = STATE_OUT_S0_ONLY;
      }
      else if (!b0 && b1) {
        // Person stepped back towards S1
        state = STATE_OUT_S1;
      }
      else if (!b0 && !b1) {
        // Fast crossing through both beams -> REGISTER OUT
        total_out++;
        if (occupancy > 0) occupancy--;
        lastCountTime = now;
        dispatchCrossing("OUT", 0, 1, d0, d1);
        state = STATE_IDLE;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = STATE_IDLE;
      }
      break;

    case STATE_OUT_S0_ONLY:
      if (!b0 && !b1) {
        // Fully cleared doorway on S0 side -> REGISTER OUT (-1)
        total_out++;
        if (occupancy > 0) occupancy--;
        lastCountTime = now;
        dispatchCrossing("OUT", 0, 1, d0, d1);
        state = STATE_IDLE;
      }
      else if (b0 && b1) {
        state = STATE_OUT_BOTH;
      }
      else if (now - stateStartTime > TIMEOUT_MS) {
        state = STATE_IDLE;
      }
      break;
  }

  // 5. Periodic Heartbeat Sync (every 1.5s when idle)
  if (now - lastTelemetrySync > 1500) {
    lastTelemetrySync = now;
    if (state == STATE_IDLE) {
      char syncBuf[160];
      snprintf(
        syncBuf,
        sizeof(syncBuf),
        "{\"event\":\"SYNC\",\"in_delta\":0,\"out_delta\":0,\"occupancy\":%d,\"total_in\":%d,\"total_out\":%d,\"d1\":%.1f,\"d2\":%.1f}",
        occupancy, total_in, total_out, d0, d1
      );
      Serial.println(syncBuf);
    }
  }

  delay(15);
}
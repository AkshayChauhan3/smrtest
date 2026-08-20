/**
 * @file main.cpp
 * @brief SmartRail OS — ESP32 Directional Passenger Counter
 *
 * Hardware
 * --------
 * Two HC-SR04 ultrasonic sensors are mounted at opposite sides of a metro coach door.
 *
 *   Sensor 1 (Platform/Entry) -> Sensor 2 (Inside Coach/Exit): BOARDING  (Occupancy++)
 *   Sensor 2 (Inside Coach/Exit) -> Sensor 1 (Platform/Entry): ALIGHTING (Occupancy--)
 *
 * Pins
 * ----
 *   GPIO  4  -> HC-SR04 #1 TRIG
 *   GPIO 14  <- HC-SR04 #1 ECHO (3.3V safe via voltage divider)
 *   GPIO 27  -> HC-SR04 #2 TRIG
 *   GPIO 33  <- HC-SR04 #2 ECHO (3.3V safe via voltage divider)
 */

#include <Arduino.h>

#define TRIG1 4
#define ECHO1 14

#define TRIG2 27
#define ECHO2 33

// ─── Tuning parameters ────────────────────────────────────────────────────────
// Detection distance threshold (in cm)
const float THRESHOLD = 25.0;

// Maximum time allowed for a single crossing sequence before resetting
const unsigned long TIMEOUT = 2000;

// Cooldown between completed crossing events
const unsigned long COOLDOWN = 500;

// ─── State ────────────────────────────────────────────────────────────────────
int occupancy = 0;

/**
 * 4-Phase Directional Crossing States:
 *
 * IN (Boarding):
 *   (0,0) IDLE -> (1,0) IN_S1_FIRST -> (1,1) IN_BOTH -> (0,1) IN_S2_LEAVING -> (0,0) [COUNT +1]
 *
 * OUT (Alighting):
 *   (0,0) IDLE -> (0,1) OUT_S2_FIRST -> (1,1) OUT_BOTH -> (1,0) OUT_S1_LEAVING -> (0,0) [COUNT -1]
 */
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
unsigned long lastDebugPrint = 0;

// ─── Functions ────────────────────────────────────────────────────────────────

float getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(4);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 25000);

  // Reject glitches / timeouts
  if (duration < 180 || duration >= 25000)
    return 999.0;

  return (duration * 0.0343) / 2.0;
}

// ─── Arduino lifecycle ────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);

  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT_PULLDOWN);

  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT_PULLDOWN);

  digitalWrite(TRIG1, LOW);
  digitalWrite(TRIG2, LOW);

  Serial.println();
  Serial.println("==========================================");
  Serial.println(" SmartRail OS — Directional Counter Ready ");
  Serial.println(" Threshold: < 25 cm | S1: Entry | S2: Exit");
  Serial.println("==========================================");
  Serial.println();
}

void loop() {
  // 1. Read Sensor 1
  float d1 = getDistance(TRIG1, ECHO1);
  delay(30); // 30ms spacing eliminates ultrasonic echo cross-talk

  // 2. Read Sensor 2
  float d2 = getDistance(TRIG2, ECHO2);

  bool s1 = (d1 >= 3.0 && d1 <= THRESHOLD);
  bool s2 = (d2 >= 3.0 && d2 <= THRESHOLD);

  // Periodic diagnostic telemetry (printed every 1.5 seconds when idle)
  if (millis() - lastDebugPrint > 1500) {
    lastDebugPrint = millis();
    if (state == IDLE) {
      Serial.print("[Sensor Status] S1: ");
      if (d1 > 400) Serial.print("CLEAR"); else { Serial.print(d1, 1); Serial.print("cm"); }
      Serial.print(" | S2: ");
      if (d2 > 400) Serial.print("CLEAR"); else { Serial.print(d2, 1); Serial.print("cm"); }
      Serial.print(" | Occupancy: ");
      Serial.println(occupancy);
    }
  }

  // 3. Directional State Machine
  switch (state) {

    // ── IDLE ─────────────────────────────────────────────────────────────────
    case IDLE:
      if (millis() - lastCountTime < COOLDOWN)
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
      else if (!s1 && !s2 && (millis() - stateStartTime > 400)) {
        state = IDLE; // Aborted before reaching S2
      }
      else if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }
      break;

    case IN_BOTH:
      if (!s1 && s2) {
        state = IN_S2_LEAVING;
      }
      else if (!s1 && !s2) {
        // Fast complete pass
        occupancy++;
        lastCountTime = millis();
        Serial.println();
        Serial.println(">>> PASSENGER IN (BOARDING) <<<");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }
      break;

    case IN_S2_LEAVING:
      if (!s1 && !s2) {
        // Hand left Sensor 2 -> Boarding complete!
        occupancy++;
        lastCountTime = millis();
        Serial.println();
        Serial.println(">>> PASSENGER IN (BOARDING) <<<");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT) {
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
      else if (!s1 && !s2 && (millis() - stateStartTime > 400)) {
        state = IDLE; // Aborted before reaching S1
      }
      else if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }
      break;

    case OUT_BOTH:
      if (s1 && !s2) {
        state = OUT_S1_LEAVING;
      }
      else if (!s1 && !s2) {
        // Fast complete pass
        if (occupancy > 0) occupancy--;
        lastCountTime = millis();
        Serial.println();
        Serial.println(">>> PASSENGER OUT (ALIGHTING) <<<");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }
      break;

    case OUT_S1_LEAVING:
      if (!s1 && !s2) {
        // Hand left Sensor 1 -> Alighting complete!
        if (occupancy > 0) occupancy--;
        lastCountTime = millis();
        Serial.println();
        Serial.println(">>> PASSENGER OUT (ALIGHTING) <<<");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();
        state = IDLE;
      }
      else if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }
      break;
  }

  delay(25);
}
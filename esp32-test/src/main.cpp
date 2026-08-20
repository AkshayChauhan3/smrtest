/**
 * @file main.cpp
 * @brief SmartRail OS — ESP32 Directional Passenger Counter
 *
 * Hardware
 * --------
 * Two HC-SR04 ultrasonic sensors are mounted at opposite sides of a metro
 * coach door frame. The order in which a person breaks each sensor's beam
 * determines the direction of travel:
 *
 *   Sensor 1 first → Sensor 2 : BOARDING  (occupancy++)
 *   Sensor 2 first → Sensor 1 : ALIGHTING (occupancy--)
 *
 * Wiring
 * ------
 *   GPIO  4  → HC-SR04 #1 TRIG  (entry side)
 *   GPIO 14  ← HC-SR04 #1 ECHO  (via 1kΩ / 2kΩ voltage divider → 3.3 V)
 *   GPIO 27  → HC-SR04 #2 TRIG  (exit/coach side)
 *   GPIO 33  ← HC-SR04 #2 ECHO  (via 1kΩ / 2kΩ voltage divider → 3.3 V)
 *
 * Serial output
 * -------------
 *   Baud: 115200
 *   Format: "Occupancy: <N>\n" printed after each boarding / alighting event.
 *   The companion serial_bridge.py parses this and POSTs to the backend.
 *
 * State machine
 * -------------
 *   IDLE → SENSOR1_FIRST → (s2 fires) → PASSENGER IN  → WAIT_CLEAR → IDLE
 *   IDLE → SENSOR2_FIRST → (s1 fires) → PASSENGER OUT → WAIT_CLEAR → IDLE
 *   Any state: TIMEOUT (2 s) → IDLE  (incomplete crossing detected)
 *
 * @board   esp32dev (ESP32-WROOM-32 or compatible)
 * @framework Arduino (via PlatformIO)
 */

#include <Arduino.h>

// ─── Sensor pin assignments ───────────────────────────────────────────────────
#define TRIG1 4    ///< Trigger pin for HC-SR04 sensor 1 (entry / platform side)
#define ECHO1 14   ///< Echo pin for HC-SR04 sensor 1 (must be 3.3 V via divider)

#define TRIG2 27   ///< Trigger pin for HC-SR04 sensor 2 (exit / coach interior side)
#define ECHO2 33   ///< Echo pin for HC-SR04 sensor 2 (must be 3.3 V via divider)

// ─── Tuning parameters ────────────────────────────────────────────────────────
/** Person detected if measured distance is closer than this (cm). */
const float THRESHOLD = 20.0;

/** Max milliseconds allowed to complete a full crossing before resetting.
 *  Prevents the FSM locking up when a person stops mid-doorway. */
const unsigned long TIMEOUT = 2000;

/** Minimum milliseconds between consecutive count events.
 *  Guards against sensor bounce / reflection double-counting. */
const unsigned long COOLDOWN = 1000;

// ─── State ────────────────────────────────────────────────────────────────────
/** Running passenger occupancy count. Floor is 0 (never goes negative). */
int occupancy = 0;

/**
 * @brief Finite state machine states for directional counting.
 */
enum State {
  IDLE,           ///< No active crossing; waiting with cooldown enforced
  SENSOR1_FIRST,  ///< Sensor 1 broke first — potential boarding event
  SENSOR2_FIRST,  ///< Sensor 2 broke first — potential alighting event
  WAIT_CLEAR      ///< Crossing complete; waiting for both sensors to clear
};

State state = IDLE;            ///< Current FSM state
unsigned long stateStartTime = 0; ///< Timestamp when current state was entered
unsigned long lastCountTime  = 0; ///< Timestamp of the most recent count event

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * @brief Measure distance using an HC-SR04 ultrasonic sensor.
 *
 * Sends a 10 µs trigger pulse and times the returning echo pulse with
 * pulseIn(). The speed of sound at room temperature is ~343 m/s
 * (0.0343 cm/µs), and the sound must travel to the object and back, so
 * distance = duration_µs × 0.0343 / 2.
 *
 * @param trigPin  GPIO connected to the sensor's TRIG pin.
 * @param echoPin  GPIO connected to the sensor's ECHO pin (3.3 V safe).
 * @return         Distance in centimetres, or 999 if no echo within 30 ms.
 */
float getDistance(int trigPin, int echoPin) {
  // Ensure trigger starts LOW
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Send a 10 µs HIGH pulse to initiate an ultrasonic burst
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure the width of the ECHO pulse (timeout = 30 000 µs ≈ ~515 cm max)
  long duration = pulseIn(echoPin, HIGH, 30000);

  // If pulseIn timed out it returns 0 — report as "nothing detected"
  if (duration == 0)
    return 999;

  // Convert travel time to distance (round-trip, hence ÷ 2)
  return duration * 0.0343 / 2.0;
}

// ─── Arduino lifecycle ────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);

  // Configure sensor pins
  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);

  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  Serial.println("================================");
  Serial.println("Metro Passenger Counter Started");
  Serial.println("================================");
}

/**
 * @brief Main sensing loop — runs at ~20 Hz (50 ms sleep at end).
 *
 * Each iteration:
 *   1. Reads distance from both sensors.
 *   2. Converts each distance to a boolean "triggered" flag.
 *   3. Steps the directional FSM.
 *   4. Sleeps 50 ms before the next cycle.
 *
 * FSM transitions are documented inline below.
 */
void loop() {
  float d1 = getDistance(TRIG1, ECHO1);
  float d2 = getDistance(TRIG2, ECHO2);

  // true if a person (or object) is within the detection threshold
  bool s1 = d1 < THRESHOLD;
  bool s2 = d2 < THRESHOLD;

  switch (state) {

    // ── IDLE ─────────────────────────────────────────────────────────────────
    // Wait for the cooldown period to expire, then look for the first
    // sensor to trigger.  Only one sensor should trigger at a time —
    // simultaneous triggers (both s1 && s2) are ignored to avoid counting
    // objects that are centred in the doorway (e.g. trolleys held still).
    case IDLE:

      if (millis() - lastCountTime < COOLDOWN)
        break;  // Still in cooldown — do not start a new crossing

      if (s1 && !s2) {
        // Person approaching from the platform side (boarding)
        state = SENSOR1_FIRST;
        stateStartTime = millis();
      }
      else if (s2 && !s1) {
        // Person approaching from inside the coach (alighting)
        state = SENSOR2_FIRST;
        stateStartTime = millis();
      }

      break;

    // ── SENSOR1_FIRST ────────────────────────────────────────────────────────
    // Sensor 1 already triggered.  Wait for sensor 2 to trigger next,
    // which confirms a full left-to-right crossing → BOARDING.
    case SENSOR1_FIRST:

      if (s2) {
        // ✅ Boarding confirmed — person crossed fully from entry → exit
        occupancy++;
        lastCountTime = millis();

        Serial.println();
        Serial.println("PASSENGER IN");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();

        state = WAIT_CLEAR;
      }

      // Safety net: reset if crossing takes too long (person turned back)
      if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }

      break;

    // ── SENSOR2_FIRST ────────────────────────────────────────────────────────
    // Sensor 2 already triggered.  Wait for sensor 1 to trigger next,
    // which confirms a full right-to-left crossing → ALIGHTING.
    case SENSOR2_FIRST:

      if (s1) {
        // ✅ Alighting confirmed — person crossed fully from exit → entry
        if (occupancy > 0)
          occupancy--;  // Floor at 0 — occupancy can never be negative

        lastCountTime = millis();

        Serial.println();
        Serial.println("PASSENGER OUT");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();

        state = WAIT_CLEAR;
      }

      // Safety net: reset if crossing takes too long
      if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }

      break;

    // ── WAIT_CLEAR ───────────────────────────────────────────────────────────
    // A count event was recorded.  Remain here until the doorway is fully
    // clear (both sensors stop triggering) before allowing the next event.
    // This prevents a single slow crossing from generating multiple counts.
    case WAIT_CLEAR:

      if (!s1 && !s2) {
        state = IDLE;
      }

      break;
  }

  // 50 ms sleep → ~20 Hz sensing rate (adequate for human walking speed)
  delay(50);
}
#include <Arduino.h>

#define TRIG1 4
#define ECHO1 14

#define TRIG2 27
#define ECHO2 33

const float THRESHOLD = 20.0;        // Person detected if closer than 20 cm
const unsigned long TIMEOUT = 2000;  // 2 sec to complete crossing
const unsigned long COOLDOWN = 1000; // 1 sec between counts

int occupancy = 0;

enum State {
  IDLE,
  SENSOR1_FIRST,
  SENSOR2_FIRST,
  WAIT_CLEAR
};

State state = IDLE;

unsigned long stateStartTime = 0;
unsigned long lastCountTime = 0;

float getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);

  if (duration == 0)
    return 999;

  return duration * 0.0343 / 2.0;
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);

  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  Serial.println("================================");
  Serial.println("Metro Passenger Counter Started");
  Serial.println("================================");
}

void loop() {

  float d1 = getDistance(TRIG1, ECHO1);
  float d2 = getDistance(TRIG2, ECHO2);

  bool s1 = d1 < THRESHOLD;
  bool s2 = d2 < THRESHOLD;

  switch (state) {

    case IDLE:

      if (millis() - lastCountTime < COOLDOWN)
        break;

      if (s1 && !s2) {
        state = SENSOR1_FIRST;
        stateStartTime = millis();
      }
      else if (s2 && !s1) {
        state = SENSOR2_FIRST;
        stateStartTime = millis();
      }

      break;

    case SENSOR1_FIRST:

      if (s2) {

        occupancy++;
        lastCountTime = millis();

        Serial.println();
        Serial.println("PASSENGER IN");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();

        state = WAIT_CLEAR;
      }

      if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }

      break;

    case SENSOR2_FIRST:

      if (s1) {

        if (occupancy > 0)
          occupancy--;

        lastCountTime = millis();

        Serial.println();
        Serial.println("PASSENGER OUT");
        Serial.print("Occupancy: ");
        Serial.println(occupancy);
        Serial.println();

        state = WAIT_CLEAR;
      }

      if (millis() - stateStartTime > TIMEOUT) {
        state = IDLE;
      }

      break;

    case WAIT_CLEAR:

      // Wait until doorway is empty
      if (!s1 && !s2) {
        state = IDLE;
      }

      break;
  }

  delay(50);
}
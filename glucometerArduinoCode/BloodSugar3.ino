#include <Wire.h>

#include <BLEDevice.h>

#include <BLEUtils.h>

#include <BLEServer.h>


#include "data.hpp"

#include "oximeterSensor.hpp"


BLEServer * pServer = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;
uint8_t txValue = 0;

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define HEART_RATE_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
// #define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLECharacteristic * pTxCharacteristic;

// Measurement start time
unsigned long measurement_start_time = 0;
bool measuring = false;

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer * pServer) {
    deviceConnected = true;
    Serial.println("connection just occured");
  };

  void onDisconnect(BLEServer * pServer) {
    deviceConnected = false;
    BLEDevice::startAdvertising();
    Serial.println("just disconnected");
    // pServer->disconnect(SERVICE_UUID);
  }
};

void setup() {
  Serial.begin(9600);
  Serial.println("Starting BLE");

  BLEDevice::init("IoT Glucometer"); // initialize shit...

  pServer = BLEDevice::createServer();
  pServer -> setCallbacks(new MyServerCallbacks());

  BLEService * pService = pServer -> createService(SERVICE_UUID);

  pTxCharacteristic =
    pService -> createCharacteristic(HEART_RATE_CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);

  pService -> start();
  BLEAdvertising * pAdvertising = BLEDevice::getAdvertising();
  pAdvertising -> addServiceUUID(SERVICE_UUID);
  pAdvertising -> setScanResponse(true);
  pAdvertising -> setMinPreferred(0x06); // functions that help with iPhone connections issue
  pAdvertising -> setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("Characteristic defined! Now you can read it in your phone!");

  pinMode(kButtonPin, INPUT_PULLUP);

  // Initialize LED PWM control for buzzer
  ledcAttach(kBuzzerPin, 2000, 1); // Attach buzzer pin to PWM channel 0

  lcd.init();
  lcd.backlight();

  lcd.createChar(0, heart_icon); // Heart icon at position 0
  lcd.createChar(1, spo2_icon); // SpO2 icon at position 1
  lcd.createChar(2, light_heart_icon); // Light heart icon
  lcd.createChar(3, finger_icon);
  lcd.createChar(4, bluetoth_icon);
  lcd.createChar(5, disconnected_icon);

  // oximeter start up

  if (sensor.begin() && sensor.setSamplingRate(kSamplingRate)) {
    lcd.clear();
  } else {
    lcd.clear();
    lcd.print("Sensor Error");
    while (1);
  }

  // welcome message
  SoundPlay(500);
  welcomeMessage();
  SoundPlay(100);

  // introduction screen 
  lcd.setCursor(7, 0);
  lcd.write(3);
  lcd.setCursor(2, 1);
  lcd.print("Place Finger");

} // end of the setup

void loop() {

  if (deviceConnected) {

    lcd.setCursor(15, 0);
    lcd.write(4);

    // Serial.println("connected");

  } else {
    lcd.setCursor(15, 0);
    lcd.write(5);

    BLEDevice::startAdvertising();
    Serial.println("Waiting for device to connect...");
    delay(1000); // Avoid flooding with too many attempts

  }

  auto sample = sensor.readSample(1000);
  float current_value_red = sample.red;
  float current_value_ir = sample.ir;

  // Detect Finger using raw sensor value
  if (sample.red > kFingerThreshold) {
    if (millis() - finger_timestamp > kFingerCooldownMs) {
      finger_detected = true;
      // SoundPlay(100);

    }
  } else {
    // Reset values if the finger is removed
    differentiator.reset();
    averager_bpm.reset();
    averager_r.reset();
    averager_spo2.reset();
    low_pass_filter_red.reset();
    low_pass_filter_ir.reset();
    high_pass_filter.reset();
    stat_red.reset();
    stat_ir.reset();

    finger_detected = false;
    finger_timestamp = millis();
    // Serial.println("Finger not detected");

  }

  if (finger_detected) {

    // you can measure now....
    current_value_red = low_pass_filter_red.process(current_value_red);
    current_value_ir = low_pass_filter_ir.process(current_value_ir);

    // Statistics for pulse oximetry
    stat_red.process(current_value_red);
    stat_ir.process(current_value_ir);

    // Heart beat detection using value for red LED
    float current_value = high_pass_filter.process(current_value_red);
    float current_diff = differentiator.process(current_value);

    // Valid values?
    if (!isnan(current_diff) && !isnan(last_diff)) {

      // Detect Heartbeat - Zero-Crossing
      if (last_diff > 0 && current_diff < 0) {
        crossed = true;
        crossed_time = millis();
      }

      if (current_diff > 0) {
        crossed = false;
      }

      // Detect Heartbeat - Falling Edge Threshold
      if (crossed && current_diff < kEdgeThreshold) {
        if (last_heartbeat != 0 && crossed_time - last_heartbeat > 300) {
          // Show Results
          int bpm = 60000 / (crossed_time - last_heartbeat);
          float rred = (stat_red.maximum() - stat_red.minimum()) / stat_red.average();
          float rir = (stat_ir.maximum() - stat_ir.minimum()) / stat_ir.average();
          float r = rred / rir;
          float spo2 = kSpO2_A * r * r + kSpO2_B * r + kSpO2_C;

          if (bpm > 50 && bpm < 250) {
            // Average?
            if (kEnableAveraging) {
              int average_bpm = averager_bpm.process(bpm);
              int average_r = averager_r.process(r);
              int average_spo2 = averager_spo2.process(spo2);

              // Show if enough samples have been collected
              if (averager_bpm.count() >= kSampleThreshold) {
                Serial.print("Time (ms): ");
                Serial.println(millis());
                Serial.print("Heart Rate (avg, bpm): ");
                Serial.println(average_bpm);
                Serial.print("R-Value (avg): ");
                Serial.println(r);
                Serial.print("SpO2 (avg, %): ");
                Serial.println(average_spo2);

                lcd.clear();
                lcd.setCursor(0, 0);
                lcd.write(0); // Heart icon
                lcd.print(" Avg BPM: ");
                lcd.print(average_bpm);
                lcd.setCursor(0, 1);
                lcd.write(1); // SpO2 icon
                lcd.print(" Avg SpO2: ");
                lcd.print(average_spo2);

                // SoundPlay(100);
                // mesurementDone = true;

                String dataToSend = String(average_bpm) + "," + String(average_spo2) + "," + String(r);

                pTxCharacteristic -> setValue(dataToSend);
                pTxCharacteristic -> notify(true);

                // if (deviceConnected) {

                // delay(10);  // bluetooth stack will go into congestion, if too many packets are sent
                // }

              }
            } else {

              lcd.clear();
              lcd.setCursor(3, 0);
              lcd.print("Measuring");

              Serial.print("Time (ms): ");
              Serial.println(millis());
              Serial.print("Heart Rate (current, bpm): ");
              Serial.println(bpm);
              Serial.print("R-Value (current): ");
              Serial.println(r);
              Serial.print("SpO2 (current, %): ");
              Serial.println(spo2);

            }
          }

          // Reset statistic
          stat_red.reset();
          stat_ir.reset();
        }

        crossed = false;
        last_heartbeat = crossed_time;
      }
    }

    last_diff = current_diff;
  } else {

    // delay(3000);

    // lcd.clear();

    // lcd.setCursor(7,0);
    // lcd.write(3);
    // lcd.setCursor(2, 1);
    // lcd.print("Place Finger");
    // delay(1000);

  }

}
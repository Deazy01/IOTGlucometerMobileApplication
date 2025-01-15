#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);  // LCD with I2C address, might be 0x3F on some displays

// Pin Configuration
const int kBuzzerPin = 18;            // Pin connected to the buzzer
const int kButtonPin = 32;            // Pin connected to the Bluetooth send button



// Custom Icons
byte heart_icon[8] = {
  0b00000,
  0b01010,
  0b11111,
  0b11111,
  0b01110,
  0b00100,
  0b00000,
  0b00000
};

byte light_heart_icon[8] = {
  0b00000,
  0b01110,
  0b11111,
  0b11111,
  0b11111,
  0b01110,
  0b00100,
  0b00000
};

byte spo2_icon[8] = {
  0b00000,
  0b00100,
  0b01010,
  0b01010,
  0b10001,
  0b10001,
  0b01110,
  0b00000
};


// byte finger_icon[8] = {
//   0b00000,
//   0b00100,  // Finger
//   0b00100,  // Finger
//   0b00100,  // Finger
//   0b11111,  // Hand
//   0b01110,  // Palm
//   0b01110,  // Palm
//   0b00100   // Wrist
// };

byte finger_icon[8] = {
  0b00000,  // Empty space
  0b01110,  // Fingertip
  0b00100,  // Finger
  0b00100,  // Finger
  0b11111,  // Hand
  0b01110,  // Palm
  0b00100,  // Wrist
  0b00100   // Wrist continuation
};


byte bluetoth_icon[8] = {
  B00000,
  B00111,
  B10101,
  B01101,
  B01110,
  B10101,
  B00101,
  B00111
};


byte disconnected_icon[8] = {
  B00000,
  B10001,
  B01010,
  B00100,
  B01010,
  B10001,
  B00000,
  B00000
};






void welcomeMessage(){


    
  lcd.setCursor(2, 0);
  lcd.write(0);
  lcd.print("Glucometer");
  lcd.setCursor(0, 1);
  lcd.print("by funke kuyebi");



  delay(5000);
  lcd.clear();

}


void SoundPlay(int duration){
  ledcWrite(kBuzzerPin, 220);
  delay(duration);
   ledcWrite(kBuzzerPin, 0);

}

void SoundStop(){
    ledcWrite(kBuzzerPin, 0);

}



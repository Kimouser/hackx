#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define BUTTON_PIN 32   // Change to your actual button pin
#define LED_PIN 2       // D2
#define HAPTIC_PIN 4    // D4

unsigned long lastButtonPress = 0;
int pressCount = 0;
bool sosActive = false;
const unsigned long debounceDelay = 50;  // ms
const unsigned long multiPressDelay = 400; // ms for double press

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(HAPTIC_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(HAPTIC_PIN, LOW);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    while(1);
  }
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("Ready");
  display.display();
}

void loop() {
  static bool buttonState = HIGH;
  static bool lastButtonState = HIGH;
  int reading = digitalRead(BUTTON_PIN);

  // simple debounce
  if (reading != lastButtonState) {
    delay(debounceDelay);
  }

  if (reading == LOW && lastButtonState == HIGH) {
    // button pressed
    unsigned long now = millis();
    if (now - lastButtonPress > multiPressDelay) {
      pressCount = 1;
    } else {
      pressCount++;
    }
    lastButtonPress = now;
  }

  // Check for single vs double press after delay
  if (pressCount > 0 && millis() - lastButtonPress > multiPressDelay) {
    if (pressCount == 1) {
      sosActive = true;
      showMessage("SOS Active");
    } else if (pressCount == 2) {
      sosActive = false;
      showMessage("SOS Cancel");
    }
    pressCount = 0;
  }

  lastButtonState = reading;
}

void showMessage(const char* msg) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print(msg);
  display.display();

  // LED and Haptic feedback
  if (sosActive) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  // Quick haptic pulse
  digitalWrite(HAPTIC_PIN, HIGH);
  delay(50);
  digitalWrite(HAPTIC_PIN, LOW);
}
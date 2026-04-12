/**
 * ============================================================
 *  GUARDIAN BRACELET — ESP32 BLE Firmware
 *  Project Guardian — AI-Powered Safe-Passage
 * ============================================================
 *
 *  Hardware:   ESP32 DevKit V1 (or any ESP32 with BLE)
 *  Function:   Wearable SOS bracelet that creates a WiFi Access Point
 *              and serves HTTP endpoints for the Guardian app to poll SOS status.
 *
 *  WIRING:
 *    GPIO 4  → Tactile push button → GND  (SOS trigger)
 *    GPIO 2  → Built-in LED (status indicator)
 *    GPIO 15 → External RED LED → 220 ohm → GND (SOS active)
 *    GPIO 13 → External GREEN LED → 220 ohm → GND (BLE connected)
 *    GPIO 12 → Vibration motor module signal pin (haptic feedback)
 *    GPIO 21 → OLED SDA
 *    GPIO 22 → OLED SCL
 *    3.3V    → OLED VCC
 *    GND     → OLED GND
 *
 *  WIFI ACCESS POINT:
 *    SSID:         "Guardian-Bracelet"
 *    Password:     "12345678"
 *    IP:           192.168.4.1
 *    Endpoints:
 *      GET /         - Status page
 *      GET /status   - JSON: {"sos":true/false,"battery":85}
 *      GET /sos      - Trigger SOS manually (for testing)
 *
 *  BUTTON BEHAVIOR:
 *    Single press (>50ms):    Send "SOS" once
 *    Long press (>3 sec):     Send "SOS_ESCALATED" (direct emergency)
 *    Double tap (<400ms gap): Send "SOS_CANCEL" (false alarm cancel)
 *
 *  LED PATTERNS:
 *    Green solid:       WiFi AP active
 *    Red solid:         SOS active
 *    Red fast blink:    SOS escalated
 *    All off:           Deep sleep (low power)
 *
 *  JUDGE NOTE:
 *    SOS signals logged to Serial at 115200 baud:
 *    "HARDWARE_SIGNAL: SOS Received at uptime <seconds>"
 *
 * ============================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

// ════════════════════════════════════════════════════════════════
// PIN DEFINITIONS
// ════════════════════════════════════════════════════════════════

#define SOS_BUTTON_PIN   32    // Tactile button → GND (INPUT_PULLUP)
#define LED_BUILTIN_PIN   2    // ESP32 onboard blue LED
#define LED_RED_PIN       15   // External red LED (SOS active)
#define LED_GREEN_PIN     13   // External green LED (BLE connected)
#define VIBRATION_PIN     4   // Vibration motor signal
#define OLED_SDA          21   // OLED I2C SDA
#define OLED_SCL          22   // OLED I2C SCL

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// WiFi credentials
const char* ssid = "Guardian-Bracelet";
const char* password = "12345678";

WebServer server(80);

// ════════════════════════════════════════════════════════════════
// TIMING CONSTANTS
// ════════════════════════════════════════════════════════════════

#define DEBOUNCE_MS          50     // Button debounce
#define LONG_PRESS_MS        3000   // 3 seconds for escalated SOS
#define DOUBLE_TAP_WINDOW_MS 400    // Max gap between taps for double-tap
#define HAPTIC_PULSE_MS      200    // Vibration duration per pulse
#define BLINK_INTERVAL_MS    500    // LED blink rate
#define BATTERY_INTERVAL_MS  30000  // Battery level report interval

// ════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════════════════════════════

bool sosActive = false;
bool sosTriggered = false;  // Flag for app to poll

// Button state machine
volatile bool     buttonPressed     = false;
unsigned long     buttonDownTime    = 0;
unsigned long     lastReleaseTime   = 0;
int               tapCount          = 0;
bool              longPressHandled  = false;

// LED blink state
unsigned long     lastBlinkTime     = 0;
bool              blinkState        = false;

// Battery reporting
unsigned long     lastBatteryTime   = 0;
uint8_t           batteryLevel      = 85;  // Simulated

// Uptime counter (acts as timestamp for judge logs)
unsigned long     bootTime          = 0;

// ════════════════════════════════════════════════════════════════
// FORWARD DECLARATIONS
// ════════════════════════════════════════════════════════════════
void hapticPulse(int count);
void updateOLED();

// ════════════════════════════════════════════════════════════════
// WIFI SERVER HANDLERS
// ════════════════════════════════════════════════════════════════

void handleRoot() {
  String html = "<html><body><h1>Guardian Bracelet</h1><p>Status: ";
  html += sosActive ? "SOS ACTIVE" : "IDLE";
  html += "</p><p>Battery: " + String(batteryLevel) + "%</p></body></html>";
  server.send(200, "text/html", html);
}

void handleStatus() {
  String json = "{\"sos\":";
  json += sosTriggered ? "true" : "false";
  json += ",\"battery\":" + String(batteryLevel) + "}";
  server.send(200, "application/json", json);
  if (sosTriggered) {
    sosTriggered = false;  // Reset after app reads
  }
}

void handleSOS() {
  sosActive = true;
  sosTriggered = true;
  digitalWrite(LED_RED_PIN, HIGH);
  hapticPulse(2);
  updateOLED();
  server.send(200, "text/plain", "SOS Triggered");
  Serial.println("[WiFi] SOS triggered via HTTP");
}

// ════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ════════════════════════════════════════════════════════════════

void hapticPulse(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(HAPTIC_PULSE_MS);
    digitalWrite(VIBRATION_PIN, LOW);
    if (i < count - 1) delay(HAPTIC_PULSE_MS);  // Gap between pulses
  }
}

// ════════════════════════════════════════════════════════════════
// OLED DISPLAY UPDATE
// ════════════════════════════════════════════════════════════════

void updateOLED() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);

  if (sosActive) {
    display.println("SOS ACTIVE!");
    display.setTextSize(1);
    display.println("Help on the way...");
  } else {
    display.println("GUARDIAN");
    display.setTextSize(1);
    display.println("WiFi AP Active");
    display.printf("IP: %s\n", WiFi.softAPIP().toString().c_str());
    display.printf("Battery: %d%%\n", batteryLevel);
  }

  display.display();
}

/**
 * Trigger SOS signal.
 * @param type  "SOS", "SOS_ESCALATED", or "SOS_CANCEL"
 */
void sendSOS(const char* type) {
  // ── Judge-friendly serial log ──
  Serial.println("════════════════════════════════════════");
  Serial.print("HARDWARE_SIGNAL: ");
  Serial.print(type);
  Serial.print(" Received at uptime ");
  Serial.print((millis() - bootTime) / 1000);
  Serial.println(" seconds");
  Serial.print("  Battery: ");
  Serial.print(batteryLevel);
  Serial.println("%");
  Serial.println("════════════════════════════════════════");

  // ── Visual + haptic feedback ──
  if (strcmp(type, "SOS") == 0) {
    sosActive = true;
    sosTriggered = true;
    digitalWrite(LED_RED_PIN, HIGH);
    hapticPulse(2);  // Two pulses = SOS sent
    updateOLED();
  }
  else if (strcmp(type, "SOS_ESCALATED") == 0) {
    sosActive = true;
    sosTriggered = true;
    hapticPulse(5);  // Five rapid pulses = escalated
    updateOLED();
  }
  else if (strcmp(type, "SOS_CANCEL") == 0) {
    sosActive = false;
    sosTriggered = false;
    digitalWrite(LED_RED_PIN, LOW);
    hapticPulse(1);
    updateOLED();
  }
}

// ════════════════════════════════════════════════════════════════
// BUTTON HANDLER (debounced, supports single/long/double-tap)
// ════════════════════════════════════════════════════════════════

void handleButton() {
  bool currentState = digitalRead(SOS_BUTTON_PIN) == LOW;  // Active LOW (pullup)
  unsigned long now = millis();

  // Debug: print button state occasionally (disabled for stability)
  // static unsigned long lastDebug = 0;
  // if (now - lastDebug > 1000) {  // Every second
  //   Serial.print("[Button] Pin state: ");
  //   Serial.println(digitalRead(SOS_BUTTON_PIN));
  //   lastDebug = now;
  // }

  if (currentState && !buttonPressed) {
    // ── BUTTON DOWN ──
    buttonPressed = true;
    buttonDownTime = now;
    longPressHandled = false;
    Serial.println("[Button] Button pressed");
  }

  if (currentState && buttonPressed) {
    // ── HELD DOWN — check for long press ──
    if (!longPressHandled && (now - buttonDownTime >= LONG_PRESS_MS)) {
      longPressHandled = true;
      Serial.println("[Button] LONG PRESS detected → SOS_ESCALATED");
      sendSOS("SOS_ESCALATED");
    }
  }

  if (!currentState && buttonPressed) {
    // ── BUTTON UP ──
    buttonPressed = false;
    unsigned long pressDuration = now - buttonDownTime;
    Serial.print("[Button] Button released, duration: ");
    Serial.println(pressDuration);

    if (longPressHandled) {
      // Long press already handled on hold
      tapCount = 0;
      return;
    }

    if (pressDuration < DEBOUNCE_MS) {
      // Too short — noise
      Serial.println("[Button] Ignored (too short)");
      return;
    }

    // Valid short press
    tapCount++;
    Serial.print("[Button] Tap count: ");
    Serial.println(tapCount);

    if (tapCount == 1) {
      lastReleaseTime = now;
    }
  }

  // ── Process taps after double-tap window expires ──
  if (tapCount > 0 && !buttonPressed && (now - lastReleaseTime > DOUBLE_TAP_WINDOW_MS)) {
    Serial.print("[Button] Processing taps: ");
    Serial.println(tapCount);
    if (tapCount >= 2) {
      // Double tap = cancel
      Serial.println("[Button] DOUBLE TAP detected → SOS_CANCEL");
      sendSOS("SOS_CANCEL");
    } else {
      // Single tap = SOS
      Serial.println("[Button] SINGLE PRESS detected → SOS");
      sendSOS("SOS");
    }
    tapCount = 0;
  }
}

// ════════════════════════════════════════════════════════════════
// LED MANAGEMENT
// ════════════════════════════════════════════════════════════════

void updateLEDs() {
  unsigned long now = millis();

  // ── Green LED: WiFi status ──
  digitalWrite(LED_GREEN_PIN, HIGH);  // Solid = WiFi AP active

  // ── Red LED: SOS status ──
  if (sosActive) {
    // Fast blink when SOS is active
    if (now - lastBlinkTime >= BLINK_INTERVAL_MS) {
      lastBlinkTime = now;
      digitalWrite(LED_RED_PIN, !digitalRead(LED_RED_PIN));
    }
  }

  // ── Built-in LED mirrors SOS state ──
  digitalWrite(LED_BUILTIN_PIN, sosActive ? HIGH : LOW);
}

// ════════════════════════════════════════════════════════════════
// BATTERY SIMULATION
// ════════════════════════════════════════════════════════════════

void updateBattery() {
  // Disabled for demo stability
  // if (millis() - lastBatteryTime < BATTERY_INTERVAL_MS) return;
  // lastBatteryTime = millis();
  // if (batteryLevel > 10) batteryLevel--;
  // if (deviceConnected && pBatteryChar != NULL) {
  //   pBatteryChar->setValue(&batteryLevel, 1);
  //   pBatteryChar->notify();
  //   Serial.print("[Battery] Level: ");
  //   Serial.print(batteryLevel);
  //   Serial.println("%");
  // }
}

// ════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  bootTime = millis();

  Serial.println();
  Serial.println("╔══════════════════════════════════════════╗");
  Serial.println("║   GUARDIAN BRACELET — ESP32 BLE v1.0     ║");
  Serial.println("║   Project Guardian — Safe-Passage        ║");
  Serial.println("╚══════════════════════════════════════════╝");
  Serial.println();

  // ── Pin Setup ──
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(VIBRATION_PIN, OUTPUT);

  // OLED Setup
  Wire.begin(OLED_SDA, OLED_SCL);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Guardian Bracelet");
  display.println("Initializing...");
  display.display();

  // All LEDs off initially
  digitalWrite(LED_BUILTIN_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(VIBRATION_PIN, LOW);

  // ── Initialize WiFi ──
  Serial.println("[WiFi] Starting Access Point...");
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("[WiFi] AP IP address: ");
  Serial.println(IP);

  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/sos", handleSOS);
  server.begin();
  Serial.println("[WiFi] HTTP server started");

  // Startup haptic + LED confirmation
  hapticPulse(1);
  digitalWrite(LED_GREEN_PIN, HIGH);
  delay(500);
  digitalWrite(LED_GREEN_PIN, LOW);
}

// ════════════════════════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════════════════════════

void loop() {
  // 1. Process physical SOS button
  handleButton();

  // 2. Update LED indicators
  updateLEDs();

  // 3. Handle HTTP server clients
  server.handleClient();

  // 4. Update OLED display periodically
  static unsigned long lastOLEDUpdate = 0;
  if (millis() - lastOLEDUpdate > 2000) {  // Update every 2 seconds
    updateOLED();
    lastOLEDUpdate = millis();
  }

  // Small delay to prevent watchdog issues
  delay(10);
}

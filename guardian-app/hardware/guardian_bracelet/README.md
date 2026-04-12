# Guardian Bracelet — ESP32 BLE Firmware

## Hardware Requirements

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 DevKit V1 | 1 | Main MCU with BLE |
| Tactile Push Button | 1 | SOS trigger |
| Red LED (5mm) | 1 | SOS active indicator |
| Green LED (5mm) | 1 | BLE connection status |
| Vibration Motor Module | 1 | Haptic feedback |
| 220 ohm Resistor | 2 | LED current limiting |
| Breadboard + Jumpers | 1 set | Prototyping |

## Wiring Diagram

```
ESP32 DevKit V1
┌─────────────────────┐
│                     │
│  GPIO 4  ──┤Button├── GND      (SOS Button, INPUT_PULLUP)
│                     │
│  GPIO 2  ──────────── (Built-in LED, auto)
│                     │
│  GPIO 15 ──┤220R├──┤RED LED├── GND    (SOS Active)
│                     │
│  GPIO 13 ──┤220R├──┤GRN LED├── GND    (BLE Connected)
│                     │
│  GPIO 12 ──────────── Vibration Motor Signal
│                     │
│  3.3V ─────────────── Vibration Motor VCC
│  GND ──────────────── Vibration Motor GND
│                     │
└─────────────────────┘
```

## Flash Instructions

### Arduino IDE
1. Install **ESP32 Board Package**: `https://dl.espressif.com/dl/package_esp32_index.json`
2. Select Board: **ESP32 Dev Module**
3. Select Port: Your USB serial port
4. Open `guardian_bracelet.ino`
5. Click **Upload**

### PlatformIO (VS Code)
```bash
pio run --target upload --environment esp32dev
```

## BLE Protocol

| Property | Value |
|----------|-------|
| Device Name | `Guardian-Bracelet` |
| Service UUID | `12345678-1234-5678-1234-56789abcdef0` |
| SOS Characteristic | `abcdef01-1234-5678-1234-56789abcdef0` |
| Battery Service | `0000180f-0000-1000-8000-00805f9b34fb` |
| Battery Characteristic | `00002a19-0000-1000-8000-00805f9b34fb` |

### SOS Characteristic Payloads

**Bracelet → App (Notify):**
| Payload | Meaning |
|---------|---------|
| `SOS\|<uptime>\|<battery>` | Single press — trigger SOS |
| `SOS_ESCALATED\|<uptime>\|<battery>` | Long press (3s) — direct emergency |
| `SOS_CANCEL\|<uptime>\|<battery>` | Double tap — cancel false alarm |
| `IDLE` | Default state |

**App → Bracelet (Write):**
| Command | Meaning |
|---------|---------|
| `ACK` | App received the SOS |
| `CANCEL` | User tapped "I'm Safe" in app |
| `PING` | Heartbeat / keep-alive |

### Button Gestures

| Gesture | Duration | Action |
|---------|----------|--------|
| Single Press | >50ms | Send `SOS` |
| Long Press | >3 seconds | Send `SOS_ESCALATED` |
| Double Tap | <400ms gap | Send `SOS_CANCEL` |

### LED Patterns

| LED | Pattern | Meaning |
|-----|---------|---------|
| Green Solid | Constant ON | Phone connected via BLE |
| Green Blink (1Hz) | 1s on/off | Advertising, waiting for phone |
| Red Solid | Constant ON | SOS triggered |
| Red Fast Blink | 500ms on/off | SOS escalated |
| All Off | - | Idle / deep sleep |

## Serial Monitor Debug

Open Serial Monitor at **115200 baud** to see judge-ready logs:

```
╔══════════════════════════════════════════╗
║   GUARDIAN BRACELET — ESP32 BLE v1.0     ║
║   Project Guardian — Safe-Passage        ║
╚══════════════════════════════════════════╝

[BLE] Initializing...
[BLE] Guardian-Bracelet is advertising
[BLE] Waiting for phone connection...
[BLE] Phone connected to Guardian-Bracelet

════════════════════════════════════════
HARDWARE_SIGNAL: SOS Received via BLE at uptime 42 seconds
  Payload: SOS|42000|85
  Battery: 85%
════════════════════════════════════════
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Button not responding | Check GPIO 4 wiring, ensure pull-up to 3.3V |
| BLE not advertising | Reset ESP32, check Serial for errors |
| Phone can't find device | Ensure phone BLE is on, search for "Guardian-Bracelet" |
| LEDs not lighting | Check 220 ohm resistor connections, LED polarity |
| Vibration not working | Check motor module has 3.3V power |

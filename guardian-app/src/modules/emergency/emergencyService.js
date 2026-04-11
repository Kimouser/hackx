/**
 * emergencyService.js
 * Project Guardian – Emergency Module
 *
 * Pure logic file. No React imports. Handles:
 *   • SOS state machine transitions
 *   • 3-minute countdown + verification window
 *   • Contact notification (mock)
 *   • Emergency services escalation
 *   • NMEA payload assembly
 *
 * Drop into: src/modules/emergency/emergencyService.js
 */

import { locationService } from './LocationService';

// ─── Types / Constants ─────────────────────────────────────────────────────────

export const SOS_STATE = Object.freeze({
  IDLE: 'IDLE',
  TRIGGERED: 'TRIGGERED',       // Stage 1 – initial alerts sent
  AWAITING_CHECK: 'AWAITING_CHECK', // Stage 2 – 180-second window
  ESCALATED: 'ESCALATED',       // Stage 4 – emergency services notified
  RESOLVED: 'RESOLVED',         // User confirmed safe
});

const VERIFICATION_WINDOW_MS = 180_000; // 3 minutes
const TICK_INTERVAL_MS = 1_000;

// ─── Mock Transport Layer ──────────────────────────────────────────────────────
// Replace these with real SMS/push integrations (Twilio, FCM, etc.)

/**
 * @param {string[]} recipients   Phone numbers or user IDs
 * @param {string}   body         Message text
 */
async function sendSms(recipients, body) {
  // ── STUB: replace with Twilio / AWS SNS call ──
  console.log('[EmergencyService] SMS →', recipients, '\n', body);
  return { ok: true, ts: Date.now() };
}

/**
 * @param {object} payload  GGA, RMC, frozen flag, timestamp
 */
async function notifyEmergencyServices(payload) {
  // ── STUB: replace with CAD / police API endpoint ──
  console.log('[EmergencyService] 🚨 EMERGENCY SERVICES ALERT\n', payload);
  return { ok: true, dispatchId: `DISP-${Date.now()}` };
}

// ─── EmergencyService Class ────────────────────────────────────────────────────

export class EmergencyService {
  constructor() {
    /** @type {keyof typeof SOS_STATE} */
    this.state = SOS_STATE.IDLE;

    /** Seconds remaining in the verification window */
    this.countdown = 0;

    /** @type {{ name: string, phone: string }[]} */
    this.contacts = [];

    /** @type {{ name: string } | null} */
    this.user = null;

    /** Whether any contact responded NO */
    this._noResponseReceived = false;

    /** Interval handle for the 180-second ticker */
    this._ticker = null;

    /** Resolve fn for the verification promise */
    this._safeConfirmResolve = null;

    /** Set of state-change subscribers */
    this._listeners = new Set();
  }

  // ── Configuration ───────────────────────────────────────────────────────────

  /**
   * Provide user profile and contacts before the SOS can fire.
   *
   * @param {{ name: string }}                    user
   * @param {{ name: string, phone: string }[]}   contacts
   */
  configure(user, contacts) {
    this.user = user;
    this.contacts = contacts;
  }

  // ── SOS Trigger ─────────────────────────────────────────────────────────────

  /**
   * Entry point – called by PanicButton after the long-press completes.
   * Runs the full escalation pipeline asynchronously.
   */
  async trigger() {
    if (this.state !== SOS_STATE.IDLE) {
      console.warn('[EmergencyService] SOS already active – ignoring duplicate trigger.');
      return;
    }

    console.log('[EmergencyService] ── SOS TRIGGERED ──');
    this._transition(SOS_STATE.TRIGGERED);

    // ── Stage 1: Immediate alert ────────────────────────────────────────────
    await this._stage1_immediateAlert();

    // ── Stage 2 + 3: 3-minute window + verification ─────────────────────────
    const safeConfirmed = await this._stage2and3_verificationWindow();

    // ── Stage 4: Escalation if needed ───────────────────────────────────────
    if (!safeConfirmed) {
      await this._stage4_escalate();
    }
  }

  // ── Safe Confirmation ────────────────────────────────────────────────────────

  /**
   * Call this when the user taps "I'm Safe" in the UI.
   * Resolves the verification window immediately.
   */
  confirmSafe() {
    if (this.state === SOS_STATE.AWAITING_CHECK) {
      this._safeConfirmResolve?.(true);
    }
  }

  /**
   * Simulate a contact responding "NO" (wire to your webhook/SMS relay).
   * In production, your backend would call this via a push notification.
   */
  receiveContactNoResponse() {
    this._noResponseReceived = true;
    // Immediately resolve the window as "not safe" → triggers escalation
    this._safeConfirmResolve?.(false);
  }

  // ── Resolve / Reset ──────────────────────────────────────────────────────────

  /** Manually reset to IDLE (e.g. after the emergency is fully handled). */
  reset() {
    this._stopTicker();
    this._noResponseReceived = false;
    this._safeConfirmResolve = null;
    this._transition(SOS_STATE.IDLE);
    this.countdown = 0;
    this._emit();
  }

  // ── Subscription ─────────────────────────────────────────────────────────────

  /**
   * Subscribe to state + countdown changes.
   * @param {(snapshot: ServiceSnapshot) => void} fn
   * @returns {() => void} unsubscribe
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** @returns {ServiceSnapshot} */
  getSnapshot() {
    return {
      state: this.state,
      countdown: this.countdown,
      user: this.user,
      contacts: this.contacts,
    };
  }

  // ── Private – Stage Implementations ──────────────────────────────────────────

  async _stage1_immediateAlert() {
    const phones = this.contacts.map((c) => c.phone);
    const userName = this.user?.name ?? 'A Guardian user';

    await sendSms(
      phones,
      `🚨 Project Guardian Alert: ${userName} has triggered an SOS. ` +
        `Please check on them immediately.`
    );
  }

  /**
   * Starts the 180-second ticker and returns a Promise that resolves with:
   *   true  → user pressed "I'm Safe"
   *   false → timer expired OR contact responded NO
   */
  _stage2and3_verificationWindow() {
    this._transition(SOS_STATE.AWAITING_CHECK);
    this.countdown = VERIFICATION_WINDOW_MS / 1000;
    this._emit();

    return new Promise((resolve) => {
      // Store resolve so confirmSafe() / receiveContactNoResponse() can use it
      this._safeConfirmResolve = (isSafe) => {
        this._stopTicker();
        this._safeConfirmResolve = null;
        resolve(isSafe);
      };

      // Tick every second
      this._ticker = setInterval(async () => {
        this.countdown -= 1;
        this._emit();

        // T-minus 0: send the "have you reached them?" follow-up
        if (this.countdown <= 0) {
          this._stopTicker();

          const phones = this.contacts.map((c) => c.phone);
          const userName = this.user?.name ?? 'A Guardian user';
          await sendSms(
            phones,
            `Project Guardian Follow-up: Have you been able to reach ${userName}? ` +
              `Reply YES if they are safe, or NO if you have not heard from them.`
          );

          // Give contacts 3 extra minutes to respond before auto-escalating.
          // In this mock we resolve immediately (no response = escalate).
          if (!this._noResponseReceived) {
            resolve(false); // Timeout with no "Safe" confirmation → escalate
          }
        }
      }, TICK_INTERVAL_MS);
    });
  }

  async _stage4_escalate() {
    this._transition(SOS_STATE.ESCALATED);

    // Assemble NMEA payload from the location service
    const nmea = locationService.getNmeaPayload();

    const locationInfo = nmea.frozen
      ? `⚠️ Device Inactive – LAST KNOWN LOCATION (frozen at ${new Date(
          nmea.timestamp ?? Date.now()
        ).toUTCString()}):\n${nmea.gga}\n${nmea.rmc}`
      : `📍 LIVE LOCATION:\n${nmea.gga}\n${nmea.rmc}`;

    const userName = this.user?.name ?? 'Unknown user';

    // Notify contacts of escalation
    await sendSms(
      this.contacts.map((c) => c.phone),
      `🚨 Project Guardian ESCALATION: ${userName} could not be confirmed safe. ` +
        `Emergency services have been alerted. ${locationInfo}`
    );

    // Notify emergency services
    await notifyEmergencyServices({
      user: this.user,
      gga: nmea.gga,
      rmc: nmea.rmc,
      frozen: nmea.frozen,
      frozenAt: nmea.frozen ? new Date(nmea.timestamp ?? Date.now()).toISOString() : null,
      contacts: this.contacts,
    });
  }

  // ── Private – Helpers ─────────────────────────────────────────────────────────

  _transition(newState) {
    console.log(`[EmergencyService] ${this.state} → ${newState}`);
    this.state = newState;
    this._emit();
  }

  _stopTicker() {
    if (this._ticker) {
      clearInterval(this._ticker);
      this._ticker = null;
    }
  }

  _emit() {
    const snap = this.getSnapshot();
    this._listeners.forEach((fn) => fn(snap));
  }
}

// Singleton – share one instance across the whole app
export const emergencyService = new EmergencyService();

/**
 * @typedef {Object} ServiceSnapshot
 * @property {keyof typeof SOS_STATE}              state
 * @property {number}                              countdown
 * @property {{ name: string } | null}             user
 * @property {{ name: string, phone: string }[]}   contacts
 */

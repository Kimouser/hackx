/**
 * SOSProvider.js
 * Project Guardian – Emergency Module
 *
 * React Context provider.  Bridges the pure-JS singletons into React state
 * and makes everything available via the useSOS() hook.
 *
 * Drop into: src/modules/emergency/SOSProvider.js
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { emergencyService, SOS_STATE } from './emergencyService';
import { locationService } from './LocationService';

// ─── Context ───────────────────────────────────────────────────────────────────

/** @type {React.Context<SOSContextValue>} */
export const SOSContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * SOSProvider
 *
 * Wrap your root (or the screen that needs SOS) with this.
 *
 * @param {{
 *   user:     { name: string },
 *   contacts: { name: string, phone: string }[],
 *   children: React.ReactNode,
 * }} props
 */
export function SOSProvider({ user, contacts, children }) {
  // ── Emergency service state ─────────────────────────────────────────────────
  const [sosState, setSosState] = useState(emergencyService.getSnapshot());

  // ── Location state ──────────────────────────────────────────────────────────
  const [location, setLocation] = useState(locationService.getLatest());

  // ── Initialise services once ────────────────────────────────────────────────
  const locationStarted = useRef(false);

  useEffect(() => {
    // Configure the emergency service with user data
    emergencyService.configure(user, contacts);

    // Subscribe to emergency state changes
    const unsubSos = emergencyService.subscribe(setSosState);

    // Subscribe to location changes
    const unsubLoc = locationService.subscribe(setLocation);

    // Start location watching (idempotent guard)
    if (!locationStarted.current) {
      locationStarted.current = true;
      locationService.start().catch((err) => {
        console.error('[SOSProvider] Could not start LocationService:', err);
      });
    }

    return () => {
      unsubSos();
      unsubLoc();
    };
  }, [user, contacts]);

  // ── Actions exposed to consumers ────────────────────────────────────────────

  /** Trigger the SOS pipeline (called by PanicButton after long-press). */
  const triggerSOS = useCallback(async () => {
    await emergencyService.trigger();
  }, []);

  /** User taps "I'm Safe" – resolves the verification window immediately. */
  const confirmSafe = useCallback(() => {
    emergencyService.confirmSafe();
    emergencyService.reset();
  }, []);

  /**
   * Simulate a contact responding "NO" in the verification window.
   * Wire this to your SMS-reply / push-notification webhook.
   */
  const registerNoResponse = useCallback(() => {
    emergencyService.receiveContactNoResponse();
  }, []);

  /** Hard reset back to IDLE (admin / testing use). */
  const resetSOS = useCallback(() => {
    emergencyService.reset();
  }, []);

  // ── Derived helpers ─────────────────────────────────────────────────────────

  const isActive = sosState.state !== SOS_STATE.IDLE &&
                   sosState.state !== SOS_STATE.RESOLVED;

  const nmeaPayload = locationService.getNmeaPayload();

  // ── Context value ────────────────────────────────────────────────────────────

  /** @type {SOSContextValue} */
  const value = {
    // State
    sosState: sosState.state,
    countdown: sosState.countdown,
    user: sosState.user,
    contacts: sosState.contacts,
    location,
    nmeaPayload,
    isActive,

    // Actions
    triggerSOS,
    confirmSafe,
    registerNoResponse,
    resetSOS,

    // Raw SOS_STATE enum – convenient for switch statements in consumers
    SOS_STATE,
  };

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSOS()
 *
 * Primary interface for all consuming components.
 *
 * @returns {SOSContextValue}
 *
 * @example
 * const { sosState, triggerSOS, countdown, SOS_STATE } = useSOS();
 */
export function useSOS() {
  const ctx = useContext(SOSContext);
  if (!ctx) {
    throw new Error(
      '[useSOS] Must be used inside <SOSProvider>. ' +
        'Wrap your screen or root component with <SOSProvider user={…} contacts={[…]}>'
    );
  }
  return ctx;
}

/**
 * @typedef {Object} SOSContextValue
 * @property {keyof typeof SOS_STATE}              sosState
 * @property {number}                              countdown
 * @property {{ name: string } | null}             user
 * @property {{ name: string, phone: string }[]}   contacts
 * @property {import('./LocationService').LatestState} location
 * @property {{ gga: string, rmc: string, frozen: boolean, timestamp: number|null }} nmeaPayload
 * @property {boolean}                             isActive
 * @property {() => Promise<void>}                 triggerSOS
 * @property {() => void}                          confirmSafe
 * @property {() => void}                          registerNoResponse
 * @property {() => void}                          resetSOS
 * @property {typeof SOS_STATE}                    SOS_STATE
 */

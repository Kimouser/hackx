/**
 * LocationService.js
 * Project Guardian – Emergency Module
 *
 * Mirrors the `latest` state dict, `to_nmea`, `make_rmc`, and `make_gga`
 * logic from pixhawk_gps.py, adapted for expo-location in React Native.
 *
 * Drop into: src/modules/emergency/LocationService.js
 */

import * as ExpoLocation from 'expo-location';

// ─── NMEA Utility Layer ────────────────────────────────────────────────────────

/**
 * Compute the NMEA XOR checksum for a sentence body (between $ and *).
 * Equivalent to the Python checksum loop in pixhawk_gps.py.
 *
 * @param {string} sentence  e.g. "GPRMC,123519,A,..."
 * @returns {string}         two-character uppercase hex, e.g. "4F"
 */
function nmeaChecksum(sentence) {
  let cs = 0;
  for (let i = 0; i < sentence.length; i++) {
    cs ^= sentence.charCodeAt(i);
  }
  return cs.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Convert a decimal-degree value to NMEA DDDMM.MMMM format.
 * Mirrors `to_nmea(val, is_lat)` from pixhawk_gps.py.
 *
 * @param {number}  val     Decimal degrees (positive value only; pass hemisphere separately)
 * @param {boolean} isLat   True → 2-digit degrees (DDMM); False → 3-digit (DDDMM)
 * @returns {string}        e.g. "1234.5678"
 */
function toNmea(val, isLat) {
  const absVal = Math.abs(val);
  const degrees = Math.floor(absVal);
  const minutes = (absVal - degrees) * 60;
  const degStr = isLat
    ? degrees.toString().padStart(2, '0')
    : degrees.toString().padStart(3, '0');
  const minStr = minutes.toFixed(4).padStart(7, '0');
  return `${degStr}${minStr}`;
}

/**
 * Build an NMEA GGA sentence from a `latest` snapshot.
 * Mirrors `make_gga(latest)` from pixhawk_gps.py.
 *
 * @param {LatestState} latest
 * @returns {string}  Full $GPGGA sentence with checksum
 */
export function makeGga(latest) {
  if (!latest.lat || !latest.lng) return '';

  const now = latest.timestamp ? new Date(latest.timestamp) : new Date();
  const utc =
    now.getUTCHours().toString().padStart(2, '0') +
    now.getUTCMinutes().toString().padStart(2, '0') +
    now.getUTCSeconds().toString().padStart(2, '0') +
    '.00';

  const latStr = toNmea(latest.lat, true);
  const latHemi = latest.lat >= 0 ? 'N' : 'S';
  const lngStr = toNmea(latest.lng, false);
  const lngHemi = latest.lng >= 0 ? 'E' : 'W';
  const alt = (latest.alt ?? 0).toFixed(1);
  const acc = latest.acc ? (latest.acc / 10).toFixed(1) : '1.0'; // HDOP approximation

  // Field order: time, lat, N/S, lon, E/W, fix(1=GPS), numSV, HDOP, alt, M, geoid, M, dgps, ref
  const body = `GPGGA,${utc},${latStr},${latHemi},${lngStr},${lngHemi},1,08,${acc},${alt},M,0.0,M,,`;
  return `$${body}*${nmeaChecksum(body)}`;
}

/**
 * Build an NMEA RMC sentence from a `latest` snapshot.
 * Mirrors `make_rmc(latest)` from pixhawk_gps.py.
 *
 * @param {LatestState} latest
 * @returns {string}  Full $GPRMC sentence with checksum
 */
export function makeRmc(latest) {
  if (!latest.lat || !latest.lng) return '';

  const now = latest.timestamp ? new Date(latest.timestamp) : new Date();
  const utc =
    now.getUTCHours().toString().padStart(2, '0') +
    now.getUTCMinutes().toString().padStart(2, '0') +
    now.getUTCSeconds().toString().padStart(2, '0') +
    '.00';

  const day = now.getUTCDate().toString().padStart(2, '0');
  const mon = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const yr = now.getUTCFullYear().toString().slice(-2);
  const date = `${day}${mon}${yr}`;

  const latStr = toNmea(latest.lat, true);
  const latHemi = latest.lat >= 0 ? 'N' : 'S';
  const lngStr = toNmea(latest.lng, false);
  const lngHemi = latest.lng >= 0 ? 'E' : 'W';

  // Speed (knots) and course – zero if not available
  const speed = (latest.speed ?? 0).toFixed(1);
  const course = (latest.heading ?? 0).toFixed(1);

  // Status: A=active, V=void
  const body = `GPRMC,${utc},A,${latStr},${latHemi},${lngStr},${lngHemi},${speed},${course},${date},,`;
  return `$${body}*${nmeaChecksum(body)}`;
}

// ─── Latest State Management ───────────────────────────────────────────────────

/**
 * @typedef {Object} LatestState
 * @property {number|null} lat        Decimal degrees latitude
 * @property {number|null} lng        Decimal degrees longitude
 * @property {number|null} acc        Accuracy in metres
 * @property {number}      alt        Altitude in metres MSL
 * @property {number|null} speed      Speed in m/s (converted to knots for NMEA)
 * @property {number|null} heading    True heading in degrees
 * @property {number|null} timestamp  Unix epoch ms of last successful fix
 * @property {boolean}     frozen     True when watchdog has frozen a stale fix
 */

/** Factory – mirrors the `latest = {…}` dict initialisation in pixhawk_gps.py */
export function createLatest() {
  return {
    lat: null,
    lng: null,
    acc: null,
    alt: 0,
    speed: null,
    heading: null,
    timestamp: null,
    frozen: false,
  };
}

/**
 * Merge a raw expo-location position into a LatestState object.
 * Call this every time the location watcher fires.
 *
 * @param {LatestState}            prev
 * @param {ExpoLocation.LocationObject} pos
 * @returns {LatestState}
 */
export function applyPosition(prev, pos) {
  return {
    ...prev,
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    acc: pos.coords.accuracy,
    alt: pos.coords.altitude ?? prev.alt,
    speed: pos.coords.speed ?? prev.speed,
    heading: pos.coords.heading ?? prev.heading,
    timestamp: pos.timestamp,
    frozen: false,
  };
}

/**
 * Freeze the current state – called by the watchdog when updates stop.
 * Mirrors the inactivity guard in pixhawk_gps.py that stores the last fix.
 *
 * @param {LatestState} state
 * @returns {LatestState}
 */
export function freezeLatest(state) {
  return { ...state, frozen: true };
}

// ─── Location Service Class ────────────────────────────────────────────────────

const WATCHDOG_INTERVAL_MS = 10_000; // 10 s inactivity timeout
const LOCATION_OPTIONS = {
  accuracy: ExpoLocation.Accuracy.BestForNavigation,
  timeInterval: 2000,
  distanceInterval: 0,
};

export class LocationService {
  constructor() {
    /** @type {LatestState} */
    this.latest = createLatest();
    this._subscriber = null;
    this._watchdog = null;
    this._lastUpdateAt = null;
    this._listeners = new Set();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Start watching GPS. Must be called after permissions are granted. */
  async start() {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');

    this._subscriber = await ExpoLocation.watchPositionAsync(
      LOCATION_OPTIONS,
      (pos) => this._onPosition(pos)
    );

    this._startWatchdog();
  }

  /** Stop watching and clear all timers. */
  stop() {
    this._subscriber?.remove();
    this._subscriber = null;
    clearInterval(this._watchdog);
    this._watchdog = null;
  }

  /**
   * Subscribe to every state change.
   * @param {(state: LatestState) => void} fn
   * @returns {() => void} unsubscribe
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** @returns {LatestState} Current snapshot */
  getLatest() {
    return { ...this.latest };
  }

  /**
   * Get both NMEA sentences as a single block string.
   * Used when composing the emergency payload.
   *
   * @returns {{ gga: string, rmc: string, frozen: boolean, timestamp: number|null }}
   */
  getNmeaPayload() {
    const snap = this.getLatest();
    return {
      gga: makeGga(snap),
      rmc: makeRmc(snap),
      frozen: snap.frozen,
      timestamp: snap.timestamp,
    };
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  _onPosition(pos) {
    this._lastUpdateAt = Date.now();
    this.latest = applyPosition(this.latest, pos);
    this._emit();
  }

  _startWatchdog() {
    this._watchdog = setInterval(() => {
      if (!this._lastUpdateAt) return;
      const staleness = Date.now() - this._lastUpdateAt;
      if (staleness > WATCHDOG_INTERVAL_MS && !this.latest.frozen) {
        console.warn(
          `[LocationService] Watchdog triggered – no fix for ${staleness}ms. Freezing last known position.`
        );
        this.latest = freezeLatest(this.latest);
        this._emit();
      }
    }, 5_000);
  }

  _emit() {
    const snap = this.getLatest();
    this._listeners.forEach((fn) => fn(snap));
  }
}

// Singleton – one instance for the whole app lifetime
export const locationService = new LocationService();

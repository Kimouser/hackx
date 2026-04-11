/**
 * index.js
 * Project Guardian – Emergency Module
 *
 * Single entry point. Import everything from here:
 *
 *   import {
 *     SOSProvider,
 *     useSOS,
 *     PanicButton,
 *     SOS_STATE,
 *     emergencyService,
 *     locationService,
 *     makeGga,
 *     makeRmc,
 *   } from 'src/modules/emergency';
 *
 * Drop into: src/modules/emergency/index.js
 */

// Context + hook
export { SOSProvider, useSOS }            from './SOSProvider';

// UI
export { default as PanicButton }         from './PanicButton';

// Service singletons + constants
export { emergencyService, SOS_STATE }    from './emergencyService';
export { locationService }                from './LocationService';

// NMEA utilities (useful if you build a debug screen)
export { makeGga, makeRmc, toNmea }       from './LocationService';

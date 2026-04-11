/**
 * useSOS.js
 * Project Guardian – Emergency Module
 *
 * Convenience re-export so consumers can import from the hook file directly
 * without knowing the internals of SOSProvider.
 *
 * Drop into: src/modules/emergency/useSOS.js
 *
 * Usage:
 *   import { useSOS } from 'src/modules/emergency';
 *   // or
 *   import { useSOS } from 'src/modules/emergency/useSOS';
 */

export { useSOS } from './SOSProvider';

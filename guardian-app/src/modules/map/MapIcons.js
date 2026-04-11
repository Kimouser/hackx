/**
 * MapIcons.js
 * Project Guardian – Map Module
 *
 * Thin-stroke, geometric SVG icons for Leaflet DivIcon markers.
 * Each export is a function that returns an `L.divIcon`-compatible config.
 *
 * Usage in LeafletMap (inside the WebView HTML):
 * const icon = L.divIcon({ html: ICONS.home, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
 * L.marker([lat, lng], { icon }).addTo(map);
 *
 * Drop into: src/modules/map/MapIcons.js
 */

// ─── Colour palette ────────────────────────────────────────────────────────────
export const ICON_COLORS = {
  safe:   '#06d6a0',  // teal – safe zones
  threat: '#ff3c3c',  // red  – threats
  path:   '#7c4dff',  // purple – safe paths
  sos:    '#7c4dff',  // purple – SOS button
};

// ─── Stroke style shared by all icons ────────────────────────────────────────
const S = (color = ICON_COLORS.safe) =>
  `stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

// ─── SVG wrapper ──────────────────────────────────────────────────────────────
const icon = (paths, color = ICON_COLORS.safe, size = 32) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${S(color)}>${paths}</svg>`;

// ─── Icon definitions ─────────────────────────────────────────────────────────

/** Residential / safe house */
export const HOME_ICON = (color = ICON_COLORS.safe) => icon(
  `<path d="M3 9.5L12 3l9 6.5V21H15v-5h-6v5H3V9.5z"/>`,
  color
);

/** Hospital / medical centre */
export const HOSPITAL_ICON = (color = ICON_COLORS.safe) => icon(
  `<rect x="3" y="3" width="18" height="18" rx="2"/>
   <path d="M12 8v8M8 12h8"/>`,
  color
);

/** Police station / law enforcement */
export const POLICE_ICON = (color = ICON_COLORS.safe) => icon(
  `<path d="M12 2l7 4v5c0 5-3.5 8.5-7 10C8.5 19.5 5 16 5 11V6l7-4z"/>
   <path d="M9 12l2 2 4-4"/>`,
  color
);

/** Metro / train station */
export const METRO_ICON = (color = ICON_COLORS.safe) => icon(
  `<rect x="5" y="2" width="14" height="16" rx="3"/>
   <path d="M8 18l-2 4M16 18l2 4M8 10h8M8 6h8"/>
   <circle cx="9" cy="14" r="1" fill="${color}" stroke="none"/>
   <circle cx="15" cy="14" r="1" fill="${color}" stroke="none"/>`,
  color
);

/** Market / safe commercial area */
export const MARKET_ICON = (color = ICON_COLORS.safe) => icon(
  `<path d="M3 6h18l-2 7H5L3 6zM3 6l-1-3M16 13v7M8 13v7M5 20h14"/>
   <circle cx="9" cy="23" r="1" fill="${color}" stroke="none"/>
   <circle cx="15" cy="23" r="1" fill="${color}" stroke="none"/>`,
  color
);

/** General warning / threat */
export const THREAT_ICON = (color = ICON_COLORS.threat) => icon(
  `<path d="M12 3L2 21h20L12 3z"/>
   <path d="M12 10v5M12 17v1"/>`,
  color
);

/** CCTV / surveillance node (threat / watch zone) */
export const CCTV_ICON = (color = ICON_COLORS.threat) => icon(
  `<circle cx="12" cy="12" r="4"/>
   <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>`,
  color
);

/** Pulsing Current Location Pin */
export const CURRENT_LOCATION_ICON = () => `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="rgba(66, 133, 244, 0.3)">
      <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="16" cy="16" r="6" fill="#4285F4" stroke="#ffffff" stroke-width="2" />
  </svg>
`;

// ─── Leaflet DivIcon config factory ──────────────────────────────────────────

/**
 * Returns a plain object ready to spread into `L.divIcon({ … })`.
 *
 * @param {string} svgString   One of the *_ICON() results above
 * @param {number} [size=32]
 */
export function divIconConfig(svgString, size = 32) {
  return {
    html: svgString,
    className: '',          // suppress Leaflet's default white box
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  };
}

// ─── Convenience map (keyed by safe zone "type" field) ───────────────────────

/**
 * Pick the right icon for a safe-zone marker based on its `type` property.
 * Matches what getMapOverlay() puts in overlay.safeZones[n].type
 *
 * @param {'home'|'hospital'|'police'|'metro'|'market'} type
 * @param {string} [color]
 * @returns {string}  SVG string
 */
export function safeZoneIcon(type, color = ICON_COLORS.safe) {
  switch (type) {
    case 'hospital': return HOSPITAL_ICON(color);
    case 'police':   return POLICE_ICON(color);
    case 'metro':    return METRO_ICON(color);
    case 'market':   return MARKET_ICON(color);
    case 'home':
    default:         return HOME_ICON(color);
  }
}
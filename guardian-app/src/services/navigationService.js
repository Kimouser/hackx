/**
 * navigationService.js - Project Guardian
 * Implements Weighted A* Navigation based on Live Supabase Threats
 */

// Safety configuration
const THREAT_RADIUS = 0.005; // ~500 meters
const SAFETY_WEIGHT = 50;    // How much to avoid threats (higher = safer/longer)

/**
 * Calculates a safe path between two points.
 * @param {Array} start - [lat, lng]
 * @param {Array} end - [lat, lng]
 * @param {Array} threats - Array of threats from Supabase
 */
export const calculateSafePath = (start, end, threats) => {
  // For the hackathon demo, we use a grid-based approximation
  // centered around your Mumbai viewport.
  const gridResolution = 0.001; // Step size
  
  // 1. Simple Safety Check
  // We calculate a heuristic 'Safety Score' for any coordinate
  const getSafetyPenalty = (lat, lng) => {
    let penalty = 0;
    threats.forEach(t => {
      const dist = Math.sqrt(Math.pow(lat - t.latitude, 2) + Math.pow(lng - t.longitude, 2));
      if (dist < THREAT_RADIUS) {
        // Linear penalty: higher cost the closer you are to the threat center
        penalty += (THREAT_RADIUS - dist) * SAFETY_WEIGHT * 1000;
      }
    });
    return penalty;
  };

  // 2. The A* Search (Simplified for Real-time Demo)
  // In a production app, this would hit an OSRM or GraphHopper API.
  // For the demo, we'll generate a path that "bends" away from threats.
  
  let current = { lat: start[0], lng: start[1] };
  const path = [[current.lat, current.lng]];
  const maxSteps = 50; // Prevent infinite loops
  
  for (let i = 0; i < maxSteps; i++) {
    const dLat = end[0] - current.lat;
    const dLng = end[1] - current.lng;
    const totalDist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (totalDist < gridResolution) break;

    // Look at 8 possible directions
    let bestNext = null;
    let minCost = Infinity;

    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1], 
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    directions.forEach(([stepLat, stepLng]) => {
      const nextLat = current.lat + (stepLat * gridResolution);
      const nextLng = current.lng + (stepLng * gridResolution);
      
      // Cost = Distance to Goal + Safety Penalty
      const distToGoal = Math.sqrt(Math.pow(end[0] - nextLat, 2) + Math.pow(end[1] - nextLng, 2));
      const safetyPenalty = getSafetyPenalty(nextLat, nextLng);
      const totalCost = distToGoal + safetyPenalty;

      if (totalCost < minCost) {
        minCost = totalCost;
        bestNext = { lat: nextLat, lng: nextLng };
      }
    });

    if (bestNext) {
      current = bestNext;
      path.push([current.lat, current.lng]);
    }
  }

  path.push([end[0], end[1]]); // Snap to end
  return path;
};
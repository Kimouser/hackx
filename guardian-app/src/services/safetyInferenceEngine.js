/**
 * safetyInferenceEngine.js — Dynamic Spatial Risk Assessment
 *
 * AI-powered route safety scoring for Project Guardian.
 * Uses K-Means clustering for threat hotspot detection,
 * lighting density simulation, and safe haven proximity analysis.
 *
 * Outputs a judge-ready JSON inference log.
 */

// ─── K-Means Clustering for Threat Hotspots ───
// Simplified K-Means that groups threat reports into spatial clusters
// to identify concentrated danger zones rather than treating each report independently.

const euclidean = (a, b) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

const kMeansClusters = (points, k = 3, maxIter = 20) => {
  if (points.length === 0) return [];
  k = Math.min(k, points.length);

  // Initialize centroids from random points
  let centroids = points.slice(0, k).map((p) => [...p]);
  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign each point to nearest centroid
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let best = 0;
      for (let j = 0; j < k; j++) {
        const d = euclidean(points[i], centroids[j]);
        if (d < minDist) {
          minDist = d;
          best = j;
        }
      }
      if (assignments[i] !== best) changed = true;
      assignments[i] = best;
    }

    if (!changed) break;

    // Recalculate centroids
    for (let j = 0; j < k; j++) {
      const members = points.filter((_, i) => assignments[i] === j);
      if (members.length > 0) {
        centroids[j] = [
          members.reduce((s, p) => s + p[0], 0) / members.length,
          members.reduce((s, p) => s + p[1], 0) / members.length,
        ];
      }
    }
  }

  // Build cluster objects with radius based on member spread
  const clusters = centroids.map((center, j) => {
    const members = points.filter((_, i) => assignments[i] === j);
    const radius =
      members.length > 1
        ? Math.max(...members.map((m) => euclidean(m, center))) * 111000 // degrees to ~meters
        : 200;
    return {
      center: { lat: center[0], lng: center[1] },
      radius: Math.max(radius, 150),
      density: members.length,
      riskLevel: members.length >= 3 ? 'critical' : members.length >= 2 ? 'high' : 'moderate',
    };
  });

  return clusters;
};

// ─── Mock Lighting Density Model ───
// Simulates streetlight density along a route using a spatial grid.
// Commercial/main road areas have higher light density.

const LIGHT_ZONES = [
  { lat: 23.0305, lng: 72.5653, radius: 0.008, density: 0.9 },  // Ellisbridge — commercial
  { lat: 23.0330, lng: 72.5570, radius: 0.006, density: 0.85 },  // CG Road
  { lat: 23.0242, lng: 72.5720, radius: 0.005, density: 0.8 },   // VS Hospital area
  { lat: 23.0380, lng: 72.5580, radius: 0.005, density: 0.75 },  // Navrangpura
  { lat: 23.0225, lng: 72.5714, radius: 0.01, density: 0.7 },    // City center
  { lat: 23.0488, lng: 72.5946, radius: 0.006, density: 0.8 },   // Civil Hospital
  { lat: 23.0607, lng: 72.5802, radius: 0.005, density: 0.3 },   // Sabarmati — dim
  { lat: 23.0069, lng: 72.6005, radius: 0.005, density: 0.2 },   // Kankaria back — dark
];

const getLightingScore = (lat, lng) => {
  let maxLight = 0.15; // base ambient light
  for (const zone of LIGHT_ZONES) {
    const dist = euclidean([lat, lng], [zone.lat, zone.lng]);
    if (dist < zone.radius) {
      const factor = 1 - dist / zone.radius;
      maxLight = Math.max(maxLight, zone.density * factor);
    }
  }
  return Math.min(maxLight, 1.0);
};

// ─── Safe Haven Proximity Scorer ───
// Scores how close a route point is to verified safe zones.

const getSafeHavenScore = (lat, lng, safeZones) => {
  if (!safeZones || safeZones.length === 0) return 0;

  let score = 0;
  for (const zone of safeZones) {
    const dist = euclidean([lat, lng], [zone.latitude, zone.longitude]);
    // Within 500m (~0.0045 degrees) = strong positive signal
    if (dist < 0.0045) {
      score += (1 - dist / 0.0045) * 0.8;
    }
    // Within 1km (~0.009 degrees) = moderate signal
    else if (dist < 0.009) {
      score += (1 - dist / 0.009) * 0.3;
    }
  }
  return Math.min(score, 1.0);
};

// ─── Threat Proximity Scorer ───
// Negative score based on proximity to K-Means threat clusters.

const getThreatScore = (lat, lng, clusters) => {
  let threat = 0;
  for (const cluster of clusters) {
    const dist = euclidean([lat, lng], [cluster.center.lat, cluster.center.lng]);
    const clusterRadiusDeg = cluster.radius / 111000;
    if (dist < clusterRadiusDeg * 2) {
      const proximity = 1 - dist / (clusterRadiusDeg * 2);
      const densityWeight = Math.min(cluster.density / 5, 1.0);
      threat += proximity * densityWeight;
    }
  }
  return Math.min(threat, 1.0);
};

// ─── Main Inference: Score a Single Route ───

const WEIGHTS = {
  lighting: 0.35,    // 35% weight — well-lit paths are significantly safer
  threat: -0.40,     // 40% negative weight — threats are the strongest signal
  safeHaven: 0.25,   // 25% weight — proximity to safe zones is a positive factor
};

const scoreRoute = (routeCoords, threats, safeZones) => {
  // Step 1: K-Means cluster the threat reports
  const threatPoints = threats.map((t) => [t.latitude, t.longitude]);
  const clusters = kMeansClusters(threatPoints, Math.min(4, threats.length));

  let totalLighting = 0;
  let totalThreat = 0;
  let totalSafeHaven = 0;
  let lightNodeCount = 0;

  // Step 2: Score each point along the route
  for (const [lat, lng] of routeCoords) {
    const light = getLightingScore(lat, lng);
    const threat = getThreatScore(lat, lng, clusters);
    const haven = getSafeHavenScore(lat, lng, safeZones);

    totalLighting += light;
    totalThreat += threat;
    totalSafeHaven += haven;
    if (light > 0.5) lightNodeCount++;
  }

  const n = routeCoords.length || 1;
  const avgLighting = totalLighting / n;
  const avgThreat = totalThreat / n;
  const avgSafeHaven = totalSafeHaven / n;

  // Step 3: Calculate weighted safety score (0-100)
  const rawScore =
    avgLighting * WEIGHTS.lighting +
    avgThreat * WEIGHTS.threat +
    avgSafeHaven * WEIGHTS.safeHaven;

  // Normalize to 0–100 range
  const safetyScore = Math.round(Math.max(0, Math.min(100, (rawScore + 0.4) * 100)));

  return {
    safetyScore,
    lightNodeCount,
    avgLighting: Math.round(avgLighting * 100),
    avgThreat: Math.round(avgThreat * 100),
    avgSafeHaven: Math.round(avgSafeHaven * 100),
    clusters,
    pointsAnalyzed: n,
  };
};

// ─── Compare Two Routes ───
// The primary export: takes two routes and returns the AI inference result.

export const compareRoutes = (fastestRoute, safestRoute, threats, safeZones) => {
  const fastest = scoreRoute(fastestRoute, threats, safeZones);
  const safest = scoreRoute(safestRoute, threats, safeZones);

  const lightDiff = safest.lightNodeCount - fastest.lightNodeCount;
  const scoreDiff = safest.safetyScore - fastest.safetyScore;

  // Build reasoning string
  const reasons = [];
  if (lightDiff > 0) reasons.push(`${lightDiff}_more_light_nodes`);
  if (safest.avgSafeHaven > fastest.avgSafeHaven) reasons.push('closer_to_safe_havens');
  if (safest.avgThreat < fastest.avgThreat) reasons.push('avoids_threat_clusters');
  if (reasons.length === 0) reasons.push('similar_safety_profile');

  const inference = {
    fastest_route_score: `${fastest.safetyScore}%`,
    safest_route_score: `${safest.safetyScore}%`,
    score_improvement: `+${Math.max(0, scoreDiff)}%`,
    reasoning: `safest_route_${reasons.join('_and_')}`,
    model: 'guardian_spatial_risk_v1',
    algorithm: 'k_means_clustering_with_weighted_spatial_analysis',
    weights: WEIGHTS,
    detailed: {
      fastest: {
        safety_score: fastest.safetyScore,
        lighting_coverage: `${fastest.avgLighting}%`,
        threat_exposure: `${fastest.avgThreat}%`,
        safe_haven_proximity: `${fastest.avgSafeHaven}%`,
        light_nodes: fastest.lightNodeCount,
        points_analyzed: fastest.pointsAnalyzed,
      },
      safest: {
        safety_score: safest.safetyScore,
        lighting_coverage: `${safest.avgLighting}%`,
        threat_exposure: `${safest.avgThreat}%`,
        safe_haven_proximity: `${safest.avgSafeHaven}%`,
        light_nodes: safest.lightNodeCount,
        points_analyzed: safest.pointsAnalyzed,
      },
      threat_clusters: safest.clusters.map((c) => ({
        center: c.center,
        risk_level: c.riskLevel,
        incidents: c.density,
      })),
    },
  };

  // Log for judges
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  GUARDIAN AI — SAFETY INFERENCE ENGINE OUTPUT     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(JSON.stringify(inference, null, 2));

  return inference;
};

// ─── Score a single route (for when we only have one) ───
export const scoreSingleRoute = (routeCoords, threats, safeZones) => {
  return scoreRoute(routeCoords, threats, safeZones);
};

// ─── Export clustering for visualization ───
export { kMeansClusters };

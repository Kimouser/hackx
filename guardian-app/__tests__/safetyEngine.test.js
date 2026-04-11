/**
 * Unit tests for Guardian AI Safety Inference Engine
 * Run: npx jest __tests__/safetyEngine.test.js
 */

import { compareRoutes, kMeansClusters, scoreSingleRoute } from '../src/services/safetyInferenceEngine';

const mockThreats = [
  { latitude: 23.017, longitude: 72.58, upvotes: 5, severity: 'high' },
  { latitude: 23.018, longitude: 72.581, upvotes: 3, severity: 'medium' },
  { latitude: 23.016, longitude: 72.579, upvotes: 7, severity: 'critical' },
  { latitude: 23.060, longitude: 72.590, upvotes: 2, severity: 'low' },
];

const mockSafeZones = [
  { latitude: 23.0305, longitude: 72.5653, name: 'Police Station', category: 'police_station' },
  { latitude: 23.0242, longitude: 72.5720, name: 'VS Hospital', category: 'hospital' },
];

const fastRoute = [
  [23.0225, 72.5714], [23.0200, 72.5750], [23.0170, 72.5800],
  [23.0140, 72.5850], [23.0100, 72.5900], [23.0069, 72.6005],
];

const safeRoute = [
  [23.0225, 72.5714], [23.0242, 72.5720], [23.0220, 72.5750],
  [23.0195, 72.5680], [23.0140, 72.5680], [23.0120, 72.5750],
  [23.0100, 72.5850], [23.0069, 72.6005],
];

describe('K-Means Clustering', () => {
  test('clusters threat points into groups', () => {
    const points = mockThreats.map((t) => [t.latitude, t.longitude]);
    const clusters = kMeansClusters(points, 2);

    expect(clusters.length).toBe(2);
    clusters.forEach((c) => {
      expect(c).toHaveProperty('center');
      expect(c).toHaveProperty('radius');
      expect(c).toHaveProperty('density');
      expect(c).toHaveProperty('riskLevel');
      expect(c.center).toHaveProperty('lat');
      expect(c.center).toHaveProperty('lng');
    });
  });

  test('handles empty input', () => {
    const clusters = kMeansClusters([], 3);
    expect(clusters).toEqual([]);
  });

  test('handles single point', () => {
    const clusters = kMeansClusters([[23.0, 72.5]], 1);
    expect(clusters.length).toBe(1);
    expect(clusters[0].density).toBe(1);
  });
});

describe('Route Comparison', () => {
  test('returns valid inference result', () => {
    const result = compareRoutes(fastRoute, safeRoute, mockThreats, mockSafeZones);

    expect(result).toHaveProperty('fastest_route_score');
    expect(result).toHaveProperty('safest_route_score');
    expect(result).toHaveProperty('score_improvement');
    expect(result).toHaveProperty('reasoning');
    expect(result).toHaveProperty('model', 'guardian_spatial_risk_v1');
    expect(result).toHaveProperty('algorithm');
    expect(result).toHaveProperty('weights');
    expect(result).toHaveProperty('detailed');
  });

  test('scores are percentage strings', () => {
    const result = compareRoutes(fastRoute, safeRoute, mockThreats, mockSafeZones);
    expect(result.fastest_route_score).toMatch(/^\d+%$/);
    expect(result.safest_route_score).toMatch(/^\d+%$/);
  });

  test('safest route scores higher than or equal to fastest', () => {
    const result = compareRoutes(fastRoute, safeRoute, mockThreats, mockSafeZones);
    const fastScore = parseInt(result.fastest_route_score);
    const safeScore = parseInt(result.safest_route_score);
    expect(safeScore).toBeGreaterThanOrEqual(fastScore);
  });

  test('detailed breakdown has required fields', () => {
    const result = compareRoutes(fastRoute, safeRoute, mockThreats, mockSafeZones);
    const { detailed } = result;

    expect(detailed.fastest).toHaveProperty('safety_score');
    expect(detailed.fastest).toHaveProperty('lighting_coverage');
    expect(detailed.fastest).toHaveProperty('threat_exposure');
    expect(detailed.fastest).toHaveProperty('safe_haven_proximity');
    expect(detailed.safest).toHaveProperty('safety_score');
    expect(detailed).toHaveProperty('threat_clusters');
    expect(Array.isArray(detailed.threat_clusters)).toBe(true);
  });
});

describe('Single Route Scoring', () => {
  test('scores a single route', () => {
    const result = scoreSingleRoute(safeRoute, mockThreats, mockSafeZones);
    expect(result).toHaveProperty('safetyScore');
    expect(result.safetyScore).toBeGreaterThanOrEqual(0);
    expect(result.safetyScore).toBeLessThanOrEqual(100);
    expect(result).toHaveProperty('avgLighting');
    expect(result).toHaveProperty('avgThreat');
    expect(result).toHaveProperty('avgSafeHaven');
    expect(result).toHaveProperty('pointsAnalyzed', safeRoute.length);
  });
});

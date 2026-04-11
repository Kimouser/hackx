/**
 * Unit tests for Guardian AI Safety Inference Engine
 * Run: npx jest __tests__/safetyEngine.test.js
 */

import { compareRoutes, kMeansClusters, scoreSingleRoute } from '../src/services/safetyInferenceEngine';

const mockThreats = [
  { latitude: 19.1197, longitude: 72.8464, upvotes: 28, severity: 'critical' },
  { latitude: 19.0195, longitude: 72.8425, upvotes: 21, severity: 'critical' },
  { latitude: 19.1030, longitude: 72.8258, upvotes: 9, severity: 'high' },
  { latitude: 18.9554, longitude: 72.8146, upvotes: 7, severity: 'medium' },
];

const mockSafeZones = [
  { latitude: 19.0515, longitude: 72.8286, name: 'Lilavati Hospital', category: 'hospital' },
  { latitude: 19.0553, longitude: 72.8340, name: 'Bandra Police Station', category: 'police_station' },
  { latitude: 19.0041, longitude: 72.8407, name: 'KEM Hospital', category: 'hospital' },
];

const fastRoute = [
  [19.0760, 72.8777], [19.0800, 72.8700], [19.0900, 72.8600],
  [19.1050, 72.8500], [19.1197, 72.8464],
];

const safeRoute = [
  [19.0760, 72.8777], [19.0750, 72.8750], [19.0700, 72.8680],
  [19.0660, 72.8640], [19.0700, 72.8500], [19.0900, 72.8400],
  [19.1170, 72.8400], [19.1197, 72.8464],
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
    const clusters = kMeansClusters([[19.0, 72.8]], 1);
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

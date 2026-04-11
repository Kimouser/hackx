/**
 * technicalLog.js — TECHNICAL_LOG.json Generator
 *
 * Captures live AI inference data for judges during the demo.
 * Logs every route comparison, safety score calculation, and
 * K-Means cluster analysis to an in-memory log with timestamps.
 *
 * Usage: import { getTechnicalLog } from './technicalLog';
 *        console.log(JSON.stringify(getTechnicalLog(), null, 2));
 */

const TECHNICAL_LOG = {
  project: 'Project Guardian',
  track: 'AI Track — Safety-First Navigation',
  version: '1.0.0',
  model: 'guardian_spatial_risk_v1',
  description: 'Predictive Risk Model using K-Means clustering, lighting density simulation, and safe haven proximity scoring to compute optimal safe routes for women.',
  algorithms: [
    'K-Means Clustering (threat hotspot detection)',
    'Weighted Spatial Risk Assessment (lighting 35%, threat -40%, safe haven 25%)',
    'Dynamic Route Comparison (multi-point polyline scoring)',
  ],
  inference_log: [],
};

let logId = 1;

/**
 * Append a new entry to the technical log.
 * Called by MapScreen after every AI inference.
 */
export const appendToTechnicalLog = (entry) => {
  const logEntry = {
    id: logId++,
    timestamp: entry.timestamp || new Date().toISOString(),
    event: entry.event || 'inference',
    destination: entry.destination || 'unknown',
    inference: {
      fastest_score: entry.result?.fastest_route_score || '—',
      safest_score: entry.result?.safest_route_score || '—',
      improvement: entry.result?.score_improvement || '—',
      reasoning: entry.result?.reasoning || '',
      algorithm: entry.result?.algorithm || 'k_means_clustering',
      weights: entry.result?.weights || {},
      threat_clusters_analyzed: entry.result?.detailed?.threat_clusters?.length || 0,
      fastest_points_analyzed: entry.result?.detailed?.fastest?.points_analyzed || 0,
      safest_points_analyzed: entry.result?.detailed?.safest?.points_analyzed || 0,
    },
    narrative: buildNarrative(entry),
  };

  TECHNICAL_LOG.inference_log.push(logEntry);

  // Pretty-print for judges watching console
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│  TECHNICAL_LOG — Live AI Inference               │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│  ID: ${logEntry.id}  |  ${logEntry.timestamp}   `);
  console.log(`│  Destination: ${logEntry.destination}`);
  console.log(`│  ${logEntry.narrative}`);
  console.log('└─────────────────────────────────────────────────┘');

  return logEntry;
};

/**
 * Build a human-readable narrative for the judges.
 * Example: "Analyzing route to Bandra... Safety Score: 62% vs 48%...
 *           Reason: 2 more lit nodes and avoids 3 threat clusters"
 */
const buildNarrative = (entry) => {
  if (!entry.result) return 'No inference data.';

  const fastest = entry.result.fastest_route_score || '?';
  const safest = entry.result.safest_route_score || '?';
  const improvement = entry.result.score_improvement || '0%';
  const reasoning = (entry.result.reasoning || '')
    .replace(/_/g, ' ')
    .replace('safest route', 'Safest route');
  const clusters = entry.result.detailed?.threat_clusters?.length || 0;
  const lightDiff = (entry.result.detailed?.safest?.light_nodes || 0) -
                    (entry.result.detailed?.fastest?.light_nodes || 0);

  return `Analyzing route to ${entry.destination}... ` +
    `Safety Score: ${safest} vs ${fastest} (${improvement} safer). ` +
    `${lightDiff > 0 ? `${lightDiff} more lit node${lightDiff > 1 ? 's' : ''}. ` : ''}` +
    `${clusters} threat cluster${clusters !== 1 ? 's' : ''} analyzed. ` +
    `Reason: ${reasoning}.`;
};

/**
 * Get the full technical log (for export/display to judges).
 */
export const getTechnicalLog = () => ({
  ...TECHNICAL_LOG,
  generated_at: new Date().toISOString(),
  total_inferences: TECHNICAL_LOG.inference_log.length,
});

/**
 * Reset the log (for testing).
 */
export const resetTechnicalLog = () => {
  TECHNICAL_LOG.inference_log = [];
  logId = 1;
};

export default TECHNICAL_LOG;

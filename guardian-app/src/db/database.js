/**
 * Guardian Database — In-Memory Store
 *
 * Uses a pure JS in-memory data store that works on Web + iOS + Android
 * with zero native dependencies. Data is pre-seeded from seed.js on init.
 *
 * For production: swap this with expo-sqlite (native) or an API backend.
 */

import { SEED_REPORTS, SEED_SAFE_ZONES } from './seed';

// ─── In-Memory Tables ───
let reports = [];
let safeZones = [];
let emergencyLogs = [];
let nextReportId = 1;
let nextLogId = 1;
let initialized = false;

// ─── Init & Seed ───
export const getDatabase = async () => {
  if (initialized) return;
  initialized = true;

  // Seed with mock data
  reports = SEED_REPORTS.map((r, i) => ({
    id: i + 1,
    ...r,
    created_at: new Date().toISOString(),
  }));
  nextReportId = reports.length + 1;

  safeZones = SEED_SAFE_ZONES.map((z, i) => ({
    id: i + 1,
    ...z,
    is_verified: 1,
    operating_hours: '24/7',
    created_at: new Date().toISOString(),
  }));

  console.log(`[Guardian DB] Seeded ${reports.length} threat reports + ${safeZones.length} safe zones`);
};

// ─── Report CRUD ───
export const getAllReports = async () => {
  return [...reports]
    .filter((r) => r.status !== 'resolved')
    .sort((a, b) => b.upvotes - a.upvotes);
};

export const getReportsForMap = async () => {
  return reports
    .filter((r) => r.status !== 'resolved')
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      severity: r.severity,
      latitude: r.latitude,
      longitude: r.longitude,
      upvotes: r.upvotes,
      status: r.status,
    }));
};

export const createReport = async ({ title, description, category, severity, latitude, longitude }) => {
  const id = nextReportId++;
  const report = {
    id,
    title,
    description: description || '',
    category,
    severity: severity || 'medium',
    latitude,
    longitude,
    upvotes: 0,
    status: 'active',
    municipal_email_sent: 0,
    municipal_email_date: null,
    image_uri: '',
    created_at: new Date().toISOString(),
  };
  reports.push(report);
  console.log(`[Guardian DB] New report #${id}: ${title}`);
  return id;
};

export const upvoteReport = async (id) => {
  const report = reports.find((r) => r.id === id);
  if (!report) throw new Error('Report not found');

  report.upvotes += 1;

  // Municipal Loop: auto-trigger at 10 upvotes
  if (report.upvotes >= 10 && !report.municipal_email_sent) {
    report.municipal_email_sent = 1;
    report.municipal_email_date = new Date().toISOString();
    report.status = 'municipal_notified';
    console.log(`[Guardian DB] Municipal Loop triggered for report #${id}`);
    return { ...report, municipalTriggered: true };
  }

  return { ...report, municipalTriggered: false };
};

// ─── SafeZone Queries ───
export const getAllSafeZones = async () => {
  return [...safeZones].sort((a, b) => a.category.localeCompare(b.category));
};

export const getSafeZonesForMap = async () => {
  return safeZones.map((z) => ({
    id: z.id,
    name: z.name,
    category: z.category,
    latitude: z.latitude,
    longitude: z.longitude,
    phone: z.phone,
  }));
};

// ─── Map Overlay (combined) ───
export const getMapOverlay = async () => {
  const [threats, zones] = await Promise.all([
    getReportsForMap(),
    getSafeZonesForMap(),
  ]);
  return { threats, safeZones: zones };
};

// ─── Emergency Logs ───
export const logEmergency = async (triggerType, latitude, longitude) => {
  const id = nextLogId++;
  emergencyLogs.push({
    id,
    trigger_type: triggerType,
    latitude: latitude || 23.0225,
    longitude: longitude || 72.5714,
    status: 'triggered',
    created_at: new Date().toISOString(),
  });
  console.log(`[Guardian DB] Emergency logged: ${triggerType}`);
  return id;
};

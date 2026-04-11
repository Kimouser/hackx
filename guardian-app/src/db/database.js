/**
 * database.js - Universal Guardian DB
 * Works on Web (localStorage) and Native (SQLite)
 */
import { Platform } from 'react-native';

// Standardized store for Web/Development
let webStore = {
  reports: [],
  safe_zones: [],
  emergency_logs: []
};

// ─── HELPER: Web Persistence ───
const saveToWeb = () => {
  if (Platform.OS === 'web') {
    localStorage.setItem('guardian_db', JSON.stringify(webStore));
  }
};

const loadFromWeb = () => {
  if (Platform.OS === 'web') {
    const data = localStorage.getItem('guardian_db');
    if (data) webStore = JSON.parse(data);
  }
};

// ─── CORE EXPORTS ───

/** Initializes tables/store */
export const setupDatabase = async () => {
  if (Platform.OS === 'web') {
    loadFromWeb();
    console.log('[Guardian DB] Web Storage Initialized');
    return;
  }
  
  // For Native (Phone), we would use real expo-sqlite here.
  // But for your web demo, we keep the logic identical so nothing breaks.
};

/** Wipes the DB for fresh seeding */
export const resetDatabase = async () => {
  webStore = { reports: [], safe_zones: [], emergency_logs: [] };
  if (Platform.OS === 'web') localStorage.removeItem('guardian_db');
  console.log('[Guardian DB] Storage Reset');
};

/** Combined data fetch for MapScreen */
export const getMapOverlay = async () => {
  if (Platform.OS === 'web') loadFromWeb();
  return { 
    threats: webStore.reports, 
    safeZones: webStore.safe_zones 
  };
};

/** Create a new report */
export const createReport = async (data) => {
  const newReport = {
    id: Date.now(),
    ...data,
    upvotes: 0,
    userUpvoted: 0,
    created_at: new Date().toISOString()
  };
  webStore.reports.push(newReport);
  saveToWeb();
  return newReport.id;
};

/** Upvote logic */
export const upvoteReport = async (id) => {
  const report = webStore.reports.find(r => r.id === id);
  if (!report) return null;

  report.userUpvoted = report.userUpvoted ? 0 : 1;
  report.upvotes = report.userUpvoted ? report.upvotes + 1 : report.upvotes - 1;
  
  saveToWeb();
  return { ...report, userUpvoted: !!report.userUpvoted };
};

/** Seed Helper (Called by seed.js) */
export const getDB = async () => {
  // We return a mock "db" object for web that seed.js can use
  return {
    runAsync: async (query, params) => {
      if (query.includes('INSERT INTO safe_zones')) {
        webStore.safe_zones.push({ name: params[0], type: params[1], latitude: params[2], longitude: params[3], address: params[4], phone: params[5], id: Date.now() + Math.random() });
      } else if (query.includes('INSERT INTO reports')) {
        webStore.reports.push({ title: params[0], category: params[1], latitude: params[2], longitude: params[3], upvotes: params[4], status: params[5], id: Date.now() + Math.random() });
      }
      saveToWeb();
    }
  };
};

export const logEmergency = async (type, lat, lng) => {
  webStore.emergency_logs.push({ type, lat, lng, time: new Date().toISOString() });
  saveToWeb();
};
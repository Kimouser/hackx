/**
 * database.js - Project Guardian
 * Persistent SQLite storage using expo-sqlite.
 */

import * as SQLite from 'expo-sqlite';

// Singleton DB connection
let _db = null;

export const getDB = async () => {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('guardian.db');
  }
  return _db;
};

/** Initializes tables if they don't exist */
export const setupDatabase = async () => {
  const db = await getDB();
  
  // Threats / Reports Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      category TEXT,
      severity TEXT,
      latitude REAL,
      longitude REAL,
      upvotes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      municipal_email_sent INTEGER DEFAULT 0,
      municipal_email_date TEXT,
      image_uri TEXT,
      userUpvoted INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);

  // Safe Zones Table (Includes the 'type' column for icons)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS safe_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT, 
      latitude REAL,
      longitude REAL,
      address TEXT,
      phone TEXT,
      is_verified INTEGER DEFAULT 1,
      operating_hours TEXT DEFAULT '24/7',
      created_at TEXT
    );
  `);

  // Emergency Logs Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS emergency_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_type TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT,
      created_at TEXT
    );
  `);
};

/** Wipes the DB for fresh seeding - useful for demos */
export const resetDatabase = async () => {
  const db = await getDB();
  await db.execAsync('DROP TABLE IF EXISTS reports;');
  await db.execAsync('DROP TABLE IF EXISTS safe_zones;');
  await db.execAsync('DROP TABLE IF EXISTS emergency_logs;');
  await setupDatabase();
};

/** Combined data fetch for the MapScreen */
export const getMapOverlay = async () => {
  const db = await getDB();
  const threats = await db.getAllAsync('SELECT * FROM reports WHERE status != "resolved"');
  const safeZones = await db.getAllAsync('SELECT * FROM safe_zones');
  return { threats, safeZones };
};

export const createReport = async (data) => {
  const db = await getDB();
  const res = await db.runAsync(
    `INSERT INTO reports (title, description, category, severity, latitude, longitude, image_uri, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description || '', data.category, data.severity || 'medium', data.latitude, data.longitude, data.imageUri || '', new Date().toISOString()]
  );
  return res.lastInsertRowId;
};

export const upvoteReport = async (id) => {
  const db = await getDB();
  const report = await db.getFirstAsync('SELECT * FROM reports WHERE id = ?', [id]);
  if (!report) return null;

  const newUpvotes = report.userUpvoted ? report.upvotes - 1 : report.upvotes + 1;
  const newUserUpvoted = report.userUpvoted ? 0 : 1;

  await db.runAsync(
    'UPDATE reports SET upvotes = ?, userUpvoted = ? WHERE id = ?',
    [newUpvotes, newUserUpvoted, id]
  );
  
  return { ...report, upvotes: newUpvotes, userUpvoted: !!newUserUpvoted };
};

export const logEmergency = async (triggerType, latitude, longitude) => {
  const db = await getDB();
  const res = await db.runAsync(
    'INSERT INTO emergency_logs (trigger_type, latitude, longitude, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [triggerType, latitude || 19.073, longitude || 72.899, 'triggered', new Date().toISOString()]
  );
  return res.lastInsertRowId;
};
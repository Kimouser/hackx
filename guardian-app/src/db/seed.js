/**
 * seed.js - Project Guardian
 * Mumbai (Vidyavihar) dataset for demo purposes.
 */

import { resetDatabase, getDB } from './database';

const MUMBAI_SAFE_ZONES = [
  { name: 'Rajawadi Hospital', type: 'hospital', lat: 19.0780, lng: 72.8970, addr: 'Ghatkopar East', phone: '022-21021234' },
  { name: 'Vidyavihar Police Station', type: 'police', lat: 19.0805, lng: 72.8965, addr: 'Near Station', phone: '022-25121000' },
  { name: 'Apollo Pharmacy Vidyavihar', type: 'pharmacy', lat: 19.0765, lng: 72.9000, addr: 'Vidyavihar West', phone: '022-25101111' },
  { name: 'Ghatkopar Fire Brigade', type: 'fire', lat: 19.0850, lng: 72.9080, addr: 'LBS Marg', phone: '101' },
  { name: 'Vidyavihar Railway Station', type: 'railway', lat: 19.0798, lng: 72.8988, addr: 'Vidyavihar West', phone: '' },
  { name: 'Ghatkopar West Market', type: 'market', lat: 19.0860, lng: 72.9005, addr: 'Station Road', phone: '' },
  { name: 'KJSCE Safe Haven', type: 'home', lat: 19.0730, lng: 72.8995, addr: 'Somaiya Campus', phone: '' },
];

const MUMBAI_THREATS = [
  { title: 'Dimly lit pathway near Campus', cat: 'broken_light', lat: 19.0745, lng: 72.8990, up: 12 },
  { title: 'Harassment hotspot - Station Alley', cat: 'harassment', lat: 19.0810, lng: 72.8950, up: 24 },
  { title: 'Abandoned Site - Security Issue', cat: 'unsafe_area', lat: 19.0710, lng: 72.9020, up: 8 }
];

export const initMockData = async () => {
  console.log('[Seed] Wiping database and seeding Mumbai data...');
  
  await resetDatabase(); // Recreates tables empty
  const db = await getDB();

  // Insert Safe Zones
  for (const zone of MUMBAI_SAFE_ZONES) {
    await db.runAsync(
      `INSERT INTO safe_zones (name, type, latitude, longitude, address, phone, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [zone.name, zone.type, zone.lat, zone.lng, zone.addr, zone.phone, new Date().toISOString()]
    );
  }

  // Insert Threats
  for (const threat of MUMBAI_THREATS) {
    await db.runAsync(
      `INSERT INTO reports (title, category, latitude, longitude, upvotes, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [threat.title, threat.cat, threat.lat, threat.lng, threat.up, threat.up >= 10 ? 'municipal_notified' : 'active', new Date().toISOString()]
    );
  }

  console.log(`[Seed] Successfully inserted ${MUMBAI_SAFE_ZONES.length} landmarks and ${MUMBAI_THREATS.length} threats.`);
};
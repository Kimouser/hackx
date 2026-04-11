/**
 * seed.js - Populate MongoDB with mock Threat Zones and Safe Spaces
 * Centered around Ahmedabad (23.0225, 72.5714)
 *
 * Usage: node seed.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const Report = require('./src/models/Report');
const SafeZone = require('./src/models/SafeZone');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/guardian';

// Ahmedabad center coordinates
const CENTER_LAT = 23.0225;
const CENTER_LNG = 72.5714;

// Helper to create slight offsets from center
const offset = (baseLat, baseLng, latOff, lngOff) => [baseLng + lngOff, baseLat + latOff];

const mockReports = [
  {
    title: 'Broken streetlight near Sabarmati Ashram',
    description: 'Streetlight has been non-functional for 2 weeks. Very dark at night.',
    category: 'broken_light',
    severity: 'high',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.008, -0.005) },
    upvotes: 12,
    status: 'municipal_notified',
    municipalEmailSent: true,
    municipalEmailDate: new Date(),
  },
  {
    title: 'Harassment reports near Manek Chowk',
    description: 'Multiple women reported eve-teasing incidents after 9 PM.',
    category: 'harassment',
    severity: 'critical',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, -0.002, 0.003) },
    upvotes: 25,
    status: 'escalated',
    municipalEmailSent: true,
    municipalEmailDate: new Date(),
  },
  {
    title: 'Dimly lit underpass near Gujarat University',
    description: 'The underpass near the university has poor visibility at night.',
    category: 'unsafe_area',
    severity: 'high',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.012, 0.008) },
    upvotes: 8,
    status: 'active',
  },
  {
    title: 'Non-functional lights on CG Road',
    description: 'Three consecutive streetlights are broken on CG Road near Parimal Garden.',
    category: 'broken_light',
    severity: 'medium',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.005, 0.012) },
    upvotes: 6,
    status: 'active',
  },
  {
    title: 'Unsafe alley near Kankaria Lake',
    description: 'Narrow alley with no lighting. Reports of chain snatching.',
    category: 'unsafe_area',
    severity: 'critical',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, -0.015, 0.006) },
    upvotes: 18,
    status: 'municipal_notified',
    municipalEmailSent: true,
    municipalEmailDate: new Date(),
  },
  {
    title: 'Unresponsive police booth near Paldi',
    description: 'Police booth is unmanned after 10 PM despite being listed as 24/7.',
    category: 'unresponsive_police',
    severity: 'high',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, -0.008, -0.003) },
    upvotes: 14,
    status: 'municipal_notified',
    municipalEmailSent: true,
    municipalEmailDate: new Date(),
  },
  {
    title: 'Dark stretch on SG Highway',
    description: 'A 200m stretch of SG Highway has no working lights near Iscon Mega Mall.',
    category: 'broken_light',
    severity: 'medium',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.003, 0.025) },
    upvotes: 4,
    status: 'active',
  },
  {
    title: 'Harassment zone near Ahmedabad Railway Station',
    description: 'Women commuters report feeling unsafe during late-night arrivals.',
    category: 'harassment',
    severity: 'high',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.001, -0.008) },
    upvotes: 11,
    status: 'municipal_notified',
    municipalEmailSent: true,
    municipalEmailDate: new Date(),
  },
];

const mockSafeZones = [
  {
    name: 'Civil Hospital Ahmedabad',
    category: 'hospital',
    description: 'Major government hospital with 24/7 emergency services.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.006, -0.002) },
    address: 'Asarwa, Ahmedabad 380016',
    phone: '079-22683721',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'Ellisbridge Police Station',
    category: 'police_station',
    description: 'Active police station with night patrol units.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.004, 0.006) },
    address: 'Ellisbridge, Ahmedabad 380006',
    phone: '079-26577100',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'Navrangpura Fire Station',
    category: 'fire_station',
    description: 'Fire station with emergency response team.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.009, 0.004) },
    address: 'Navrangpura, Ahmedabad 380009',
    phone: '101',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'CCD - CG Road (24/7)',
    category: '24x7_hotspot',
    description: 'Late-night cafe with good footfall and well-lit area.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.005, 0.010) },
    address: 'CG Road, Navrangpura, Ahmedabad',
    phone: '',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'Apollo Pharmacy - Paldi',
    category: 'pharmacy',
    description: '24-hour pharmacy with staff always present.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, -0.007, -0.001) },
    address: 'Paldi, Ahmedabad 380007',
    phone: '079-26578900',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'Satellite Police Chowky',
    category: 'police_station',
    description: 'Community police outpost with active night presence.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, -0.003, 0.015) },
    address: 'Satellite, Ahmedabad 380015',
    phone: '079-26922100',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'VS Hospital',
    category: 'hospital',
    description: 'Government hospital with emergency ward.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.002, 0.001) },
    address: 'Ellisbridge, Ahmedabad 380006',
    phone: '079-26577621',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'Indian Oil Petrol Pump - SG Highway',
    category: '24x7_hotspot',
    description: '24-hour petrol pump with CCTV and staff.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, 0.001, 0.022) },
    address: 'SG Highway, Ahmedabad',
    phone: '',
    isVerified: true,
    operatingHours: '24/7',
  },
  {
    name: 'Nari Suraksha Kendra (Women Shelter)',
    category: 'shelter',
    description: 'Government-run women safety shelter with 24/7 helpline.',
    location: { type: 'Point', coordinates: offset(CENTER_LAT, CENTER_LNG, -0.005, 0.009) },
    address: 'Maninagar, Ahmedabad',
    phone: '1091',
    isVerified: true,
    operatingHours: '24/7',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Report.deleteMany({});
    await SafeZone.deleteMany({});
    console.log('Cleared existing reports and safe zones');

    // Insert mock data
    const reports = await Report.insertMany(mockReports);
    console.log(`Inserted ${reports.length} mock threat reports`);

    const safeZones = await SafeZone.insertMany(mockSafeZones);
    console.log(`Inserted ${safeZones.length} mock safe zones`);

    console.log('\nSeed completed successfully!');
    console.log(`Center: Ahmedabad (${CENTER_LAT}, ${CENTER_LNG})`);
    console.log(`Threat Zones: ${reports.length}`);
    console.log(`Safe Zones: ${safeZones.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedDB();

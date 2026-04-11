const Report = require('../models/Report');
const SafeZone = require('../models/SafeZone');
const logger = require('../utils/logger');

// Fetch all threat zones (active reports) within a bounding box or radius
const getThreatZones = async (longitude, latitude, radiusKm = 5) => {
  try {
    const threats = await Report.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radiusKm * 1000,
        },
      },
      status: { $in: ['active', 'escalated', 'municipal_notified'] },
    });

    return threats.map((t) => ({
      id: t._id,
      title: t.title,
      category: t.category,
      severity: t.severity,
      coordinates: [t.location.coordinates[1], t.location.coordinates[0]], // [lat, lng] for Leaflet
      upvotes: t.upvotes,
      status: t.status,
    }));
  } catch (error) {
    logger.error('Error fetching threat zones:', error.message);
    return [];
  }
};

// Fetch all safe zones within a radius
const getSafeZones = async (longitude, latitude, radiusKm = 5) => {
  try {
    const zones = await SafeZone.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radiusKm * 1000,
        },
      },
    });

    return zones.map((z) => ({
      id: z._id,
      name: z.name,
      category: z.category,
      coordinates: [z.location.coordinates[1], z.location.coordinates[0]], // [lat, lng] for Leaflet
      address: z.address,
      phone: z.phone,
      operatingHours: z.operatingHours,
    }));
  } catch (error) {
    logger.error('Error fetching safe zones:', error.message);
    return [];
  }
};

// Get combined map overlay data for the frontend
const getMapOverlay = async (longitude, latitude, radiusKm = 5) => {
  const [threats, safeZones] = await Promise.all([
    getThreatZones(longitude, latitude, radiusKm),
    getSafeZones(longitude, latitude, radiusKm),
  ]);

  return { threats, safeZones };
};

module.exports = { getThreatZones, getSafeZones, getMapOverlay };

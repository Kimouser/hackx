const mapService = require('../services/mapService');

const getOverlay = async (req, res) => {
  try {
    const { lng, lat, radius } = req.query;
    const longitude = parseFloat(lng) || 72.5714;
    const latitude = parseFloat(lat) || 23.0225;
    const radiusKm = parseFloat(radius) || 5;

    const overlay = await mapService.getMapOverlay(longitude, latitude, radiusKm);
    res.status(200).json({ success: true, data: overlay });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getThreatZones = async (req, res) => {
  try {
    const { lng, lat, radius } = req.query;
    const threats = await mapService.getThreatZones(
      parseFloat(lng) || 72.5714,
      parseFloat(lat) || 23.0225,
      parseFloat(radius) || 5
    );
    res.status(200).json({ success: true, data: threats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSafeZones = async (req, res) => {
  try {
    const { lng, lat, radius } = req.query;
    const safeZones = await mapService.getSafeZones(
      parseFloat(lng) || 72.5714,
      parseFloat(lat) || 23.0225,
      parseFloat(radius) || 5
    );
    res.status(200).json({ success: true, data: safeZones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOverlay, getThreatZones, getSafeZones };

const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

router.get('/overlay', mapController.getOverlay);
router.get('/threats', mapController.getThreatZones);
router.get('/safezones', mapController.getSafeZones);

module.exports = router;

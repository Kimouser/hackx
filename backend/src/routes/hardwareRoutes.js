const express = require('express');
const router = express.Router();
const hardwareController = require('../controllers/hardwareController');

router.post('/connect', hardwareController.connect);
router.post('/disconnect', hardwareController.disconnect);
router.post('/panic', hardwareController.triggerPanic);
router.get('/status', hardwareController.getStatus);

module.exports = router;

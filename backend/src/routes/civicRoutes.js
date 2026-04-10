const express = require('express');
const router = express.Router();
const civicController = require('../controllers/civicController');

router.post('/reports', civicController.createReport);
router.post('/reports/:id/upvote', civicController.upvoteReport);
router.get('/reports', civicController.getReports);

module.exports = router;

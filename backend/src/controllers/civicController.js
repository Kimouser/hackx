const civicService = require('../services/civicService');

const createReport = async (req, res) => {
  try {
    const { title, description, category, severity, longitude, latitude, imageUrl } = req.body;
    if (!title || !category || !longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Title, category, and location are required' });
    }

    const report = await civicService.createReport({
      title,
      description,
      category,
      severity,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      imageUrl,
      reportedBy: req.body.userId || null,
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const upvoteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const report = await civicService.upvoteReport(id, userId);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { lng, lat, radius } = req.query;
    let reports;
    if (lng && lat) {
      reports = await civicService.getReportsByArea(
        parseFloat(lng),
        parseFloat(lat),
        parseFloat(radius) || 5
      );
    } else {
      reports = await civicService.getAllReports();
    }
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReport, upvoteReport, getReports };

const nodemailer = require('nodemailer');
const config = require('../config/env');
const Report = require('../models/Report');
const logger = require('../utils/logger');

const UPVOTE_THRESHOLD = 10;

// Create Nodemailer transporter for Municipal Loop emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

const sendMunicipalEmail = async (report) => {
  const mailOptions = {
    from: `"Project Guardian" <${config.EMAIL_USER}>`,
    to: 'municipal.ahmedabad@example.com', // Mock municipal email
    subject: `[URGENT] Community Safety Report: ${report.title}`,
    html: `
      <h2>🛡️ Project Guardian - Municipal Alert</h2>
      <p><strong>Report:</strong> ${report.title}</p>
      <p><strong>Category:</strong> ${report.category}</p>
      <p><strong>Severity:</strong> ${report.severity}</p>
      <p><strong>Description:</strong> ${report.description}</p>
      <p><strong>Location:</strong> Lat ${report.location.coordinates[1]}, Lng ${report.location.coordinates[0]}</p>
      <p><strong>Community Upvotes:</strong> ${report.upvotes}</p>
      <p><strong>Reported On:</strong> ${report.createdAt}</p>
      <hr>
      <p>This issue has reached the community upvote threshold of ${UPVOTE_THRESHOLD} and requires immediate municipal attention.</p>
      <p><em>Automated by Project Guardian - AI-Powered Safe-Passage & Civic Accountability</em></p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Municipal email sent for report ${report._id}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send municipal email for report ${report._id}: ${error.message}`);
    // Don't throw — email failure shouldn't block the upvote
    return null;
  }
};

const createReport = async (reportData) => {
  const report = await Report.create(reportData);
  logger.info(`New report created: ${report._id} - ${report.title}`);
  return report;
};

const upvoteReport = async (reportId, userId) => {
  const report = await Report.findById(reportId);
  if (!report) throw new Error('Report not found');

  if (report.upvotedBy.includes(userId)) {
    throw new Error('You have already upvoted this report');
  }

  report.upvotes += 1;
  report.upvotedBy.push(userId);

  // Municipal Loop: auto-email when threshold is reached
  if (report.upvotes >= UPVOTE_THRESHOLD && !report.municipalEmailSent) {
    await sendMunicipalEmail(report);
    report.municipalEmailSent = true;
    report.municipalEmailDate = new Date();
    report.status = 'municipal_notified';
    logger.info(`Municipal Loop triggered for report ${report._id}`);
  }

  await report.save();
  return report;
};

const getReportsByArea = async (longitude, latitude, radiusKm = 5) => {
  return Report.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: radiusKm * 1000,
      },
    },
    status: { $ne: 'resolved' },
  }).sort({ upvotes: -1 });
};

const getAllReports = async () => {
  return Report.find({ status: { $ne: 'resolved' } }).sort({ upvotes: -1 });
};

module.exports = {
  createReport,
  upvoteReport,
  getReportsByArea,
  getAllReports,
  sendMunicipalEmail,
};

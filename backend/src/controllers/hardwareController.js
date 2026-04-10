const hardwareService = require('../services/hardwareService');

const connect = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const status = hardwareService.connectBracelet(userId);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const disconnect = async (req, res) => {
  try {
    const status = hardwareService.disconnectBracelet();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const triggerPanic = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const escalation = await hardwareService.triggerPanic(userId);
    res.status(200).json({ success: true, data: escalation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const status = hardwareService.getBraceletStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { connect, disconnect, triggerPanic, getStatus };

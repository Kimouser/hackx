const logger = require('../utils/logger');

// Mock Guardian Bracelet hardware integration
// In production, this would interface with BLE peripheral events

let braceletState = {
  isConnected: false,
  lastPing: null,
  batteryLevel: 85,
  userId: null,
};

const connectBracelet = (userId) => {
  braceletState = {
    isConnected: true,
    lastPing: new Date(),
    batteryLevel: 85,
    userId,
  };
  logger.info(`Guardian Bracelet connected for user ${userId}`);
  return braceletState;
};

const disconnectBracelet = () => {
  braceletState.isConnected = false;
  logger.info('Guardian Bracelet disconnected');
  return braceletState;
};

// Simulate a capacitive touch trigger from the bracelet
const triggerPanic = async (userId) => {
  logger.warn(`PANIC TRIGGERED by user ${userId} via Guardian Bracelet`);

  // Escalation flow:
  // 1. Send push notification to emergency contacts
  // 2. Start GPS tracking
  // 3. If no "safe" confirmation in 5 min, alert police
  const escalation = {
    userId,
    triggeredAt: new Date(),
    gpsLocation: { lat: 23.0225, lng: 72.5714 }, // Mock — would come from phone GPS
    status: 'emergency_contacts_notified',
    escalationSteps: [
      { step: 1, action: 'Emergency contacts notified', completed: true },
      { step: 2, action: 'GPS tracking started', completed: true },
      { step: 3, action: 'Awaiting safe confirmation (5 min timeout)', completed: false },
      { step: 4, action: 'Police alert (if no confirmation)', completed: false },
    ],
  };

  return escalation;
};

const getBraceletStatus = () => braceletState;

module.exports = {
  connectBracelet,
  disconnectBracelet,
  triggerPanic,
  getBraceletStatus,
};

const mongoose = require('mongoose');

const safeZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Safe zone name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['hospital', 'police_station', 'fire_station', '24x7_hotspot', 'pharmacy', 'shelter', 'other'],
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    operatingHours: {
      type: String,
      default: '24/7',
    },
  },
  { timestamps: true }
);

safeZoneSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SafeZone', safeZoneSchema);

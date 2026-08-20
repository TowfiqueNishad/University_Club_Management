const mongoose = require('mongoose');

const EquipmentReservationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    default: null,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String, // HH:mm
    required: true,
  },
  endTime: {
    type: String, // HH:mm
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'],
    default: 'PENDING',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const EquipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Audio/Visual', 'Camera & Video', 'Computing', 'Staging & Lighting', 'Sports', 'Other'],
      default: 'Audio/Visual',
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: 5,
    },
    availableQuantity: {
      type: Number,
      default: 5,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'MAINTENANCE'],
      default: 'EXCELLENT',
    },
    location: {
      type: String,
      default: 'Resource Center Locker #3',
    },
    description: {
      type: String,
      default: '',
    },
    reservations: [EquipmentReservationSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Equipment', EquipmentSchema);

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scanTimestamp: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'EXCUSED'],
      default: 'PRESENT',
    },
    method: {
      type: String,
      enum: ['QR_SCAN', 'MANUAL'],
      default: 'QR_SCAN',
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);

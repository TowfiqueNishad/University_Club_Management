const mongoose = require('mongoose');

const InterviewSlotSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: String, // Format: HH:mm (e.g. 14:00)
      required: true,
    },
    endTime: {
      type: String, // Format: HH:mm (e.g. 14:30)
      required: true,
    },
    location: {
      type: String,
      default: 'Faculty Building Room 402 / Google Meet',
    },
    maxApplicants: {
      type: Number,
      default: 1,
      min: 1,
    },
    bookedApplicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate slot for the same interviewer at the same time
InterviewSlotSchema.index({ interviewer: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('InterviewSlot', InterviewSlotSchema);

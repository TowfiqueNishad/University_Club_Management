const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['REGISTERED', 'WAITLISTED', 'CANCELLED', 'ATTENDED'],
      default: 'REGISTERED',
    },
    waitlistPosition: {
      type: Number,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    ticketCode: {
      type: String,
      default: function () {
        return 'TKT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      },
    },
  },
  {
    timestamps: true,
  }
);

EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);

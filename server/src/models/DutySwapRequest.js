const mongoose = require('mongoose');

const DutySwapRequestSchema = new mongoose.Schema(
  {
    duty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VolunteerDuty',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for duty swap is required'],
    },
    status: {
      type: String,
      enum: [
        'PENDING_TARGET_ACCEPT',
        'PENDING_LEADER_APPROVAL',
        'APPROVED',
        'REJECTED_BY_TARGET',
        'REJECTED_BY_LEADER',
        'CANCELLED',
      ],
      default: 'PENDING_TARGET_ACCEPT',
    },
    targetAcceptedAt: {
      type: Date,
      default: null,
    },
    leaderApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    leaderApprovedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DutySwapRequest', DutySwapRequestSchema);

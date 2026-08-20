const mongoose = require('mongoose');

const RecruitmentWaitlistSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubApplication',
      required: true,
    },
    evaluationScore: {
      type: Number,
      default: 0,
    },
    priorityRank: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['WAITING', 'PROMOTED', 'WITHDRAWN', 'EXPIRED'],
      default: 'WAITING',
    },
    promotedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

RecruitmentWaitlistSchema.index({ club: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('RecruitmentWaitlist', RecruitmentWaitlistSchema);

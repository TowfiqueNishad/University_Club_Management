const mongoose = require('mongoose');

const InterviewEvaluationSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubApplication',
      required: true,
      unique: true,
    },
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
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scores: {
      communication: { type: Number, min: 0, max: 20, required: true },
      technicalKnowledge: { type: Number, min: 0, max: 20, required: true },
      leadership: { type: Number, min: 0, max: 20, required: true },
      creativity: { type: Number, min: 0, max: 20, required: true },
      problemSolving: { type: Number, min: 0, max: 20, required: true },
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    averageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    recommendation: {
      type: String,
      enum: ['STRONG_ACCEPT', 'ACCEPT', 'WAITLIST', 'REJECT'],
      default: 'ACCEPT',
    },
    comments: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewEvaluation', InterviewEvaluationSchema);

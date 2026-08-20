const mongoose = require('mongoose');

const ClubApplicationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: [
        'PENDING',
        'ELIGIBLE',
        'INELIGIBLE',
        'INTERVIEW_SCHEDULED',
        'INTERVIEWED',
        'ACCEPTED',
        'REJECTED',
        'WAITLISTED',
      ],
      default: 'PENDING',
    },
    eligibilitySnapshot: {
      cgpa: Number,
      department: String,
      semester: Number,
      completedCredits: Number,
      isEligible: Boolean,
      rejectionReasons: [String],
    },
    statement: {
      type: String,
      required: [true, 'Statement of purpose is required'],
    },
    experience: {
      type: String,
      default: '',
    },
    interviewSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSlot',
      default: null,
    },
    evaluationScore: {
      type: Number,
      default: null,
    },
    decisionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending applications from the same user to the same club
ClubApplicationSchema.index({ club: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('ClubApplication', ClubApplicationSchema);

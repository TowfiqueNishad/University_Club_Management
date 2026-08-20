const mongoose = require('mongoose');

const VolunteerDutySchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Duty title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Duty description is required'],
    },
    requiredSkills: {
      type: [String],
      default: ['Event Management'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'],
      default: 'ASSIGNED',
    },
    hoursLogged: {
      type: Number,
      default: 2,
    },
    pointsReward: {
      type: Number,
      default: 50,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VolunteerDuty', VolunteerDutySchema);

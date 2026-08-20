const mongoose = require('mongoose');

const EventMilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  responsibleUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'],
    default: 'NOT_STARTED',
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
});

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    eventType: {
      type: String,
      enum: ['Workshop', 'Hackathon', 'Seminar', 'Cultural Night', 'Sports Tournament', 'Networking', 'Exhibition', 'General Meeting'],
      default: 'Workshop',
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    collaboratingClubs: [
      {
        club: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Club',
        },
        status: {
          type: String,
          enum: ['INVITED', 'ACCEPTED', 'REJECTED'],
          default: 'INVITED',
        },
        roleDescription: {
          type: String,
          default: 'Co-organizer & Logistics partner',
        },
      },
    ],
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
    },
    customLocation: {
      type: String,
      default: 'University Main Auditorium',
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: String, // Format: HH:mm (e.g. 10:00)
      required: true,
    },
    endTime: {
      type: String, // Format: HH:mm (e.g. 16:00)
      required: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Participant capacity is required'],
      default: 50,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    budgetPlanned: {
      type: Number,
      default: 1000,
    },
    budgetSpent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'COMPLETED', 'CANCELLED'],
      default: 'PUBLISHED',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    qrCodeSecret: {
      type: String,
      default: function () {
        return 'EVT-QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      },
    },
    milestones: [EventMilestoneSchema],
    requiredVolunteers: [
      {
        skill: String,
        count: { type: Number, default: 1 },
      },
    ],
    requiredEquipment: [
      {
        equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
        quantity: { type: Number, default: 1 },
      },
    ],
    banner: {
      type: String,
      default: '',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', EventSchema);

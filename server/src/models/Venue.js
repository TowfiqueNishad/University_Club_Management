const mongoose = require('mongoose');

const VenueReservationSchema = new mongoose.Schema({
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
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
    default: 'CONFIRMED',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VenueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      unique: true,
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    facilities: {
      type: [String],
      default: ['Projector', 'Air Conditioning', 'Surround Sound', 'High-Speed WiFi', 'Podium'],
    },
    description: {
      type: String,
      default: 'State-of-the-art auditorium equipped with modern AV technology.',
    },
    image: {
      type: String,
      default: '',
    },
    reservations: [VenueReservationSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Venue', VenueSchema);

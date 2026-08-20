const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: ['EVENT', 'VOLUNTEER', 'LEADERSHIP', 'ACHIEVEMENT', 'GENERAL'],
      default: 'GENERAL',
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'Award', // Lucide icon name
    },
    color: {
      type: String,
      default: 'indigo',
    },
    pointsRequirement: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Badge', BadgeSchema);

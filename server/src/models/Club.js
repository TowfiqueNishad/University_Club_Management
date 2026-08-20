const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Club code/slug is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Technology', 'Cultural', 'Sports', 'Robotics', 'Business', 'Arts & Media', 'Community Service', 'Academic'],
      default: 'Technology',
    },
    description: {
      type: String,
      required: [true, 'Club description is required'],
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    executives: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMembers: {
      type: Number,
      default: 50,
    },
    eligibilityRequirements: {
      minCgpa: {
        type: Number,
        default: 2.5,
        min: 0,
        max: 4.0,
      },
      allowedDepartments: {
        type: [String],
        default: [], // empty means all departments allowed
      },
      minSemester: {
        type: Number,
        default: 1,
        min: 1,
      },
      minCredits: {
        type: Number,
        default: 0,
      },
      customQuestion: {
        type: String,
        default: 'Why are you passionate about joining our club?',
      },
    },
    budget: {
      allocated: { type: Number, default: 5000 },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RECRUITING', 'INACTIVE'],
      default: 'RECRUITING',
    },
    socialLinks: {
      website: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Club', ClubSchema);

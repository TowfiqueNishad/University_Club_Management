const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'CLUB_MEMBER', 'CLUB_LEADER', 'INTERVIEWER', 'ADMIN'],
      default: 'STUDENT',
    },
    studentId: {
      type: String,
      default: function () {
        return 'STU-' + Math.floor(100000 + Math.random() * 900000);
      },
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true,
    },
    semester: {
      type: Number,
      default: 4,
      min: 1,
      max: 12,
    },
    cgpa: {
      type: Number,
      default: 3.5,
      min: 0.0,
      max: 4.0,
    },
    completedCredits: {
      type: Number,
      default: 45,
      min: 0,
    },
    avatar: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: ['Event Management', 'Public Speaking', 'Graphic Design'],
    },
    bio: {
      type: String,
      default: 'Enthusiastic university student eager to lead and participate in campus activities.',
    },
    phone: {
      type: String,
      default: '+1 (555) 019-2834',
    },
    points: {
      type: Number,
      default: 100,
    },
    attendanceStats: {
      totalRegistrations: { type: Number, default: 0 },
      attendedCount: { type: Number, default: 0 },
      noShowCount: { type: Number, default: 0 },
      attendanceRate: { type: Number, default: 100 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

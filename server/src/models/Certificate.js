const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      default: function () {
        return 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Certificate of Outstanding Participation',
    },
    achievement: {
      type: String,
      default: 'Successfully organized and participated in the annual campus initiative.',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    verificationUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['VALID', 'REVOKED'],
      default: 'VALID',
    },
    issuerName: {
      type: String,
      default: 'Office of Student Affairs & Club Council',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Certificate', CertificateSchema);

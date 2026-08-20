const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Issue a digital certificate
// @route   POST /api/certificates/issue
// @access  Private (CLUB_LEADER, ADMIN)
const issueCertificate = async (req, res, next) => {
  try {
    const { userId, eventId, clubId, title, achievement, issuerName } = req.body;

    const user = await User.findById(userId);
    const club = await Club.findById(clubId);
    if (!user || !club) {
      return res.status(404).json({ success: false, message: 'User or Club not found' });
    }

    const certificate = await Certificate.create({
      user: userId,
      event: eventId || null,
      club: clubId,
      title: title || 'Certificate of Outstanding Contribution',
      achievement: achievement || 'Demonstrated exemplary dedication, teamwork, and excellence.',
      issuerName: issuerName || `${club.name} Executive Board`,
      status: 'VALID',
      issueDate: new Date(),
    });

    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
    certificate.verificationUrl = `${clientBase}/verify-certificate/${certificate.certificateId}`;
    await certificate.save();

    await createNotification({
      recipient: userId,
      title: '🎓 Certificate Awarded!',
      message: `You have been awarded a digital certificate: "${certificate.title}".`,
      type: 'CERTIFICATE',
      link: '/certificates',
    });

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully!',
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's earned certificates
// @route   GET /api/certificates/my-certificates
// @access  Private
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id, status: 'VALID' })
      .populate('club', 'name code logo banner')
      .populate('event', 'title date customLocation')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public certificate verification endpoint
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificatePublic = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId: certificateId.toUpperCase() })
      .populate('user', 'name email studentId department avatar')
      .populate('club', 'name code logo category')
      .populate('event', 'title date eventType customLocation');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found. The ID might be invalid or does not exist.',
        error: 'CERTIFICATE_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      valid: certificate.status === 'VALID',
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueCertificate,
  getMyCertificates,
  verifyCertificatePublic,
};

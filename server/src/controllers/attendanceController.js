const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ClubApplication = require('../models/ClubApplication');
const VolunteerDuty = require('../models/VolunteerDuty');
const Certificate = require('../models/Certificate');
const { promoteEventWaitlist } = require('../services/waitlistService');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Register for an event (handles capacity and automatic waitlisting)
// @route   POST /api/attendance/events/:id/register
// @access  Private (STUDENT, CLUB_MEMBER, CLUB_LEADER)
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check if already registered or waitlisted
    const existing = await EventRegistration.findOne({ event: eventId, user: userId });
    if (existing && existing.status !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `You are already ${existing.status.toLowerCase()} for this event.`,
        data: existing,
      });
    }

    // Count current active registrations
    const activeCount = await EventRegistration.countDocuments({
      event: eventId,
      status: 'REGISTERED',
    });

    let registrationStatus = 'REGISTERED';
    let waitlistPosition = null;

    if (activeCount >= event.capacity) {
      registrationStatus = 'WAITLISTED';
      const waitlistCount = await EventRegistration.countDocuments({
        event: eventId,
        status: 'WAITLISTED',
      });
      waitlistPosition = waitlistCount + 1;
    }

    const registration = await EventRegistration.findOneAndUpdate(
      { event: eventId, user: userId },
      {
        event: eventId,
        user: userId,
        status: registrationStatus,
        waitlistPosition,
        registeredAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update event registered count if registered
    if (registrationStatus === 'REGISTERED') {
      event.registeredCount = activeCount + 1;
      await event.save();
    }

    // Update user stats
    const user = await User.findById(userId);
    user.attendanceStats.totalRegistrations += 1;
    user.attendanceStats.attendanceRate = Math.round(
      (user.attendanceStats.attendedCount / Math.max(1, user.attendanceStats.totalRegistrations)) * 100
    );
    await user.save();

    // Send in-app notification
    await createNotification({
      recipient: userId,
      title: registrationStatus === 'REGISTERED' ? '🎟️ Event Registration Confirmed' : '⏳ Added to Event Waitlist',
      message: registrationStatus === 'REGISTERED'
        ? `You are registered for "${event.title}". Present your QR pass at the entrance.`
        : `"${event.title}" is currently full. You have been placed on the waiting list at position #${waitlistPosition}.`,
      type: 'EVENT',
      link: `/events/${event._id}`,
    });

    res.status(201).json({
      success: true,
      message: registrationStatus === 'REGISTERED'
        ? 'Successfully registered for event!'
        : `Event is full. You have been placed on the waitlist at position #${waitlistPosition}.`,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel event registration (triggers automatic waitlist promotion)
// @route   POST /api/attendance/events/:id/cancel
// @access  Private
const cancelRegistration = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const registration = await EventRegistration.findOne({ event: eventId, user: userId });
    if (!registration || registration.status === 'CANCELLED') {
      return res.status(404).json({ success: false, message: 'Active registration not found' });
    }

    const wasRegistered = registration.status === 'REGISTERED';
    registration.status = 'CANCELLED';
    registration.waitlistPosition = null;
    await registration.save();

    let promotedUser = null;
    if (wasRegistered) {
      // Trigger auto-promotion from waitlist
      promotedUser = await promoteEventWaitlist(eventId);
    }

    res.status(200).json({
      success: true,
      message: 'Event registration cancelled successfully',
      promotedWaitlistParticipant: promotedUser ? promotedUser.user : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event QR Code data (for organizers)
// @route   GET /api/attendance/events/:id/qr-code
// @access  Private (CLUB_LEADER, ADMIN, CLUB_MEMBER)
const getEventQRData = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Format QR payload
    const qrPayload = JSON.stringify({
      type: 'CAMPUSHUB_EVENT_ATTENDANCE',
      eventId: event._id,
      title: event.title,
      secret: event.qrCodeSecret,
      date: event.date,
    });

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        title: event.title,
        secret: event.qrCodeSecret,
        qrPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and mark attendance via QR Scan
// @route   POST /api/attendance/verify-qr
// @access  Private
const verifyAttendanceQR = async (req, res, next) => {
  try {
    const { qrData, eventId } = req.body;
    let targetEventId = eventId;
    let qrSecret = null;

    if (qrData) {
      try {
        const parsed = typeof qrData === 'object' ? qrData : JSON.parse(qrData);
        if (parsed.eventId) targetEventId = parsed.eventId;
        if (parsed.secret) qrSecret = parsed.secret;
      } catch (err) {
        // Raw secret or string passed
        qrSecret = qrData;
      }
    }

    const event = await Event.findById(targetEventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR Code: Event not found.',
        error: 'INVALID_QR_EVENT',
      });
    }

    // Verify event secret token if provided
    if (qrSecret && qrSecret !== event.qrCodeSecret && !qrSecret.includes(event.qrCodeSecret)) {
      return res.status(400).json({
        success: false,
        message: 'QR code does not match this event.',
        error: 'QR_MISMATCH',
      });
    }

    const userId = req.user._id;

    // Check duplicate scan
    const alreadyScanned = await Attendance.findOne({ event: targetEventId, user: userId });
    if (alreadyScanned) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this event!',
        error: 'DUPLICATE_SCAN',
        attendance: alreadyScanned,
      });
    }

    // Record attendance
    const attendance = await Attendance.create({
      event: targetEventId,
      user: userId,
      verifiedBy: req.user._id,
      status: 'PRESENT',
      method: 'QR_SCAN',
      scanTimestamp: new Date(),
    });

    // Update event registration status to ATTENDED
    await EventRegistration.findOneAndUpdate(
      { event: targetEventId, user: userId },
      { status: 'ATTENDED' }
    );

    // Update user stats & reward points
    const user = await User.findById(userId);
    user.points += 20; // 20 points per event attendance
    user.attendanceStats.attendedCount += 1;
    user.attendanceStats.attendanceRate = Math.round(
      (user.attendanceStats.attendedCount / Math.max(1, user.attendanceStats.totalRegistrations)) * 100
    );
    await user.save();

    // Send confirmation notification
    await createNotification({
      recipient: userId,
      title: '✅ Attendance Verified (+20 pts)',
      message: `Your attendance for "${event.title}" has been successfully recorded.`,
      type: 'EVENT',
      link: `/events/${event._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Attendance verified successfully for "${event.title}"! (+20 Points)`,
      data: attendance,
      pointsEarned: 20,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete student participation history & consistency metrics
// @route   GET /api/attendance/student-history/:userId?
// @access  Private
const getStudentParticipationHistory = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.user._id;
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 1. Applications & Interviews
    const applications = await ClubApplication.find({ applicant: targetUserId })
      .populate('club', 'name code logo category')
      .populate('interviewSlot');

    // 2. Event Registrations & Attendances
    const registrations = await EventRegistration.find({ user: targetUserId })
      .populate({
        path: 'event',
        populate: { path: 'club', select: 'name logo' },
      })
      .sort({ registeredAt: -1 });

    const attendances = await Attendance.find({ user: targetUserId })
      .populate({
        path: 'event',
        populate: { path: 'club', select: 'name logo' },
      })
      .sort({ scanTimestamp: -1 });

    // 3. Volunteer duties
    const duties = await VolunteerDuty.find({ assignedTo: targetUserId })
      .populate('event', 'title date')
      .populate('club', 'name');

    // 4. Certificates
    const certificates = await Certificate.find({ user: targetUserId })
      .populate('club', 'name logo')
      .populate('event', 'title');

    // Calculate Consistency Metric
    const totalReg = registrations.length;
    const attendedCount = attendances.length;
    const noShowCount = Math.max(0, totalReg - attendedCount);
    const attendancePercentage = totalReg > 0 ? Math.round((attendedCount / totalReg) * 100) : 100;

    let consistencyStatus = 'Excellent';
    if (attendancePercentage < 50) consistencyStatus = 'Poor';
    else if (attendancePercentage < 75) consistencyStatus = 'Warning';
    else if (attendancePercentage < 90) consistencyStatus = 'Good';

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          points: user.points,
        },
        consistencyMetrics: {
          totalRegistrations: totalReg,
          attendedCount,
          noShowCount,
          attendancePercentage,
          status: consistencyStatus,
        },
        applications,
        registrations,
        attendances,
        duties,
        certificates,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance consistency report for club leaders & university admins
// @route   GET /api/attendance/consistency-report
// @access  Private (CLUB_LEADER, ADMIN)
const getAttendanceConsistencyReport = async (req, res, next) => {
  try {
    const students = await User.find({ role: { $in: ['STUDENT', 'CLUB_MEMBER'] } })
      .select('name email studentId department attendanceStats points avatar')
      .sort({ 'attendanceStats.attendanceRate': 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance list for a specific event
// @route   GET /api/attendance/events/:id/list
// @access  Private (CLUB_LEADER, ADMIN, CLUB_MEMBER)
const getEventAttendanceList = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const attendees = await Attendance.find({ event: eventId })
      .populate('user', 'name email studentId department avatar')
      .populate('verifiedBy', 'name email')
      .sort({ scanTimestamp: -1 });

    const registrations = await EventRegistration.find({ event: eventId })
      .populate('user', 'name email studentId department avatar')
      .sort({ registeredAt: 1 });

    res.status(200).json({
      success: true,
      attendees,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getEventQRData,
  verifyAttendanceQR,
  getStudentParticipationHistory,
  getAttendanceConsistencyReport,
  getEventAttendanceList,
};

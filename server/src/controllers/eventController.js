const Event = require('../models/Event');
const Club = require('../models/Club');
const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment');
const { checkVenueConflict, checkEquipmentConflict } = require('../services/conflictService');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all events with search, date, club, and status filters
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const { search, clubId, status, eventType } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { customLocation: { $regex: search, $options: 'i' } },
      ];
    }

    if (clubId) query.club = clubId;
    if (eventType && eventType !== 'ALL') query.eventType = eventType;

    // Default to published events for public, unless specific status requested
    if (status && status !== 'ALL') {
      query.status = status;
    } else if (!status && (!req.user || req.user.role === 'STUDENT')) {
      query.status = { $in: ['PUBLISHED', 'COMPLETED'] };
    }

    const events = await Event.find(query)
      .populate('club', 'name code logo category')
      .populate('collaboratingClubs.club', 'name code logo')
      .populate('venue', 'name building roomNumber capacity')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event by ID with milestones, venue, and collaboration info
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name code logo category lead executives members')
      .populate('collaboratingClubs.club', 'name code logo lead')
      .populate('venue', 'name building roomNumber capacity facilities')
      .populate('milestones.responsibleUser', 'name email avatar')
      .populate('requiredEquipment.equipment', 'name category totalQuantity');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check potential conflicts for an event (Real-time validator)
// @route   POST /api/events/check-conflicts
// @access  Private
const checkEventConflictsAPI = async (req, res, next) => {
  try {
    const { venue, date, startTime, endTime, requiredEquipment, excludeEventId } = req.body;

    const venueConflict = await checkVenueConflict(venue, date, startTime, endTime, excludeEventId);
    const equipmentConflict = await checkEquipmentConflict(requiredEquipment, date, startTime, endTime, excludeEventId);

    const hasAnyConflict = venueConflict.hasConflict || equipmentConflict.hasConflict;

    res.status(200).json({
      success: true,
      hasConflict: hasAnyConflict,
      venueConflict,
      equipmentConflict,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event proposal (with backend conflict check)
// @route   POST /api/events
// @access  Private (CLUB_MEMBER, CLUB_LEADER, ADMIN)
const createEventProposal = async (req, res, next) => {
  try {
    const {
      title,
      description,
      eventType,
      club,
      collaboratingClubs,
      venue,
      customLocation,
      date,
      startTime,
      endTime,
      capacity,
      budgetPlanned,
      milestones,
      requiredVolunteers,
      requiredEquipment,
      tags,
      submitForReview,
    } = req.body;

    // 1. Strict backend conflict detection for venue
    if (venue) {
      const venueConflict = await checkVenueConflict(venue, date, startTime, endTime);
      if (venueConflict.hasConflict) {
        return res.status(409).json({
          success: false,
          message: `Venue conflict detected: ${venueConflict.venueName} is already booked during ${date} (${startTime} - ${endTime}).`,
          error: 'VENUE_CONFLICT',
          conflicts: venueConflict.conflicts,
        });
      }
    }

    // 2. Strict backend conflict detection for equipment
    if (requiredEquipment && requiredEquipment.length > 0) {
      const equipmentConflict = await checkEquipmentConflict(requiredEquipment, date, startTime, endTime);
      if (equipmentConflict.hasConflict) {
        return res.status(409).json({
          success: false,
          message: `Equipment shortage detected for the selected time window.`,
          error: 'EQUIPMENT_CONFLICT',
          conflictedItems: equipmentConflict.conflictedItems,
        });
      }
    }

    // Initial milestones setup if not provided
    const defaultMilestones = milestones && milestones.length > 0 ? milestones : [
      { title: 'Venue Booking Confirmation', description: 'Confirm venue and AV setup', deadline: new Date(date), status: 'NOT_STARTED', progressPercentage: 0 },
      { title: 'Volunteer Recruitment', description: 'Recruit and assign student volunteers', deadline: new Date(date), status: 'NOT_STARTED', progressPercentage: 0 },
      { title: 'Marketing & Promotion', description: 'Launch social media campaign and posters', deadline: new Date(date), status: 'NOT_STARTED', progressPercentage: 0 },
      { title: 'Final Logistics & Rehearsal', description: 'Dry run and equipment test', deadline: new Date(date), status: 'NOT_STARTED', progressPercentage: 0 },
    ];

    const initialStatus = req.user.role === 'ADMIN' || req.user.role === 'CLUB_LEADER'
      ? (submitForReview ? 'SUBMITTED' : 'APPROVED')
      : 'SUBMITTED';

    const event = await Event.create({
      title,
      description,
      eventType: eventType || 'Workshop',
      club,
      collaboratingClubs: Array.isArray(collaboratingClubs) ? collaboratingClubs : [],
      venue: venue || null,
      customLocation: customLocation || 'University Campus',
      date,
      startTime,
      endTime,
      capacity: Number(capacity) || 50,
      budgetPlanned: Number(budgetPlanned) || 1000,
      status: initialStatus,
      milestones: defaultMilestones,
      requiredVolunteers: requiredVolunteers || [],
      requiredEquipment: requiredEquipment || [],
      tags: tags || ['Campus', 'StudentActivity'],
    });

    // If venue was specified and event is approved/submitted, log reservation in Venue
    if (venue) {
      await Venue.findByIdAndUpdate(venue, {
        $push: {
          reservations: {
            event: event._id,
            club,
            bookedBy: req.user._id,
            date,
            startTime,
            endTime,
            purpose: title,
            status: 'CONFIRMED',
          },
        },
      });
    }

    // Notify club members and leaders
    const clubDoc = await Club.findById(club);
    if (clubDoc) {
      await createNotification({
        recipient: clubDoc.lead,
        title: '📢 New Event Proposal Created',
        message: `Event "${event.title}" has been created with status: ${event.status}.`,
        type: 'EVENT',
        link: `/events/${event._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject event proposal (Leader / Admin)
// @route   PUT /api/events/:id/review
// @access  Private (ADMIN, CLUB_LEADER)
const reviewEventProposal = async (req, res, next) => {
  try {
    const { decision, rejectionReason } = req.body; // 'APPROVED' or 'REJECTED'
    const event = await Event.findById(req.params.id).populate('club');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (decision === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is mandatory when rejecting a proposal.',
        error: 'REJECTION_REASON_REQUIRED',
      });
    }

    if (decision === 'APPROVED') {
      event.status = 'PUBLISHED';
      event.rejectionReason = '';
    } else if (decision === 'REJECTED') {
      event.status = 'REJECTED';
      event.rejectionReason = rejectionReason;
    }

    await event.save();

    // Notify club lead
    await createNotification({
      recipient: event.club.lead,
      title: `Event Proposal ${decision}`,
      message: `Your event proposal "${event.title}" was ${decision.toLowerCase()}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      type: 'EVENT',
      link: `/events/${event._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Event proposal marked as ${decision}`,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite collaborating partner club
// @route   POST /api/events/:id/invite-partner
// @access  Private (CLUB_LEADER, ADMIN)
const invitePartnerClub = async (req, res, next) => {
  try {
    const { partnerClubId, roleDescription } = req.body;
    const event = await Event.findById(req.params.id);
    const partnerClub = await Club.findById(partnerClubId);

    if (!event || !partnerClub) {
      return res.status(404).json({ success: false, message: 'Event or Club not found' });
    }

    // Check if already invited
    const exists = event.collaboratingClubs.some(
      (c) => c.club && c.club.toString() === partnerClubId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'This club is already a collaborator or has a pending invite.',
      });
    }

    event.collaboratingClubs.push({
      club: partnerClubId,
      status: 'INVITED',
      roleDescription: roleDescription || 'Co-organizer',
    });

    await event.save();

    // Notify partner club lead
    await createNotification({
      recipient: partnerClub.lead,
      title: '🤝 Collaboration Invite!',
      message: `Your club "${partnerClub.name}" has been invited to co-organize "${event.title}".`,
      type: 'EVENT',
      link: `/events/${event._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Collaboration invite sent successfully',
      data: event.collaboratingClubs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to collaboration invite (ACCEPT / REJECT)
// @route   PUT /api/events/:id/respond-invite
// @access  Private (CLUB_LEADER of invited club)
const respondPartnerInvite = async (req, res, next) => {
  try {
    const { clubId, response } = req.body; // 'ACCEPTED' or 'REJECTED'
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const collab = event.collaboratingClubs.find(
      (c) => c.club && c.club.toString() === clubId
    );

    if (!collab) {
      return res.status(404).json({ success: false, message: 'Invite not found for this club' });
    }

    collab.status = response;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Invitation ${response.toLowerCase()} successfully`,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update milestone progress & status
// @route   PUT /api/events/:id/milestones/:milestoneId
// @access  Private (CLUB_MEMBER, CLUB_LEADER, ADMIN)
const updateMilestone = async (req, res, next) => {
  try {
    const { status, progressPercentage, responsibleUser } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const milestone = event.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    if (status) milestone.status = status;
    if (progressPercentage !== undefined) milestone.progressPercentage = Number(progressPercentage);
    if (responsibleUser) milestone.responsibleUser = responsibleUser;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Milestone updated successfully',
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  checkEventConflictsAPI,
  createEventProposal,
  reviewEventProposal,
  invitePartnerClub,
  respondPartnerInvite,
  updateMilestone,
};

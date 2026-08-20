const VolunteerDuty = require('../models/VolunteerDuty');
const DutySwapRequest = require('../models/DutySwapRequest');
const User = require('../models/User');
const Event = require('../models/Event');
const { matchVolunteers } = require('../services/volunteerMatchService');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get recommended volunteers for a specific set of skills
// @route   POST /api/volunteers/recommendations
// @access  Private (CLUB_LEADER, ADMIN, CLUB_MEMBER)
const getVolunteerRecommendations = async (req, res, next) => {
  try {
    const { requiredSkills, clubId } = req.body;
    const recommendations = await matchVolunteers(requiredSkills, clubId);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer duties
// @route   GET /api/volunteers/duties
// @access  Private
const getDuties = async (req, res, next) => {
  try {
    const { eventId, clubId, status, myDuties } = req.query;
    const query = {};

    if (eventId) query.event = eventId;
    if (clubId) query.club = clubId;
    if (status && status !== 'ALL') query.status = status;
    if (myDuties === 'true') query.assignedTo = req.user._id;

    const duties = await VolunteerDuty.find(query)
      .populate('event', 'title date startTime endTime')
      .populate('club', 'name code logo')
      .populate('assignedTo', 'name email department avatar studentId skills')
      .populate('verifiedBy', 'name email')
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: duties.length,
      data: duties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new volunteer duty
// @route   POST /api/volunteers/duties
// @access  Private (CLUB_LEADER, ADMIN, CLUB_MEMBER)
const createDuty = async (req, res, next) => {
  try {
    const { event, club, title, description, requiredSkills, assignedTo, deadline, hoursLogged, pointsReward } = req.body;

    const duty = await VolunteerDuty.create({
      event,
      club,
      title,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : ['Event Management'],
      assignedTo: assignedTo || null,
      deadline,
      hoursLogged: Number(hoursLogged) || 2,
      pointsReward: Number(pointsReward) || 50,
      status: assignedTo ? 'ASSIGNED' : 'ASSIGNED',
    });

    if (assignedTo) {
      await createNotification({
        recipient: assignedTo,
        title: '🎯 New Volunteer Duty Assigned',
        message: `You have been assigned the duty "${duty.title}".`,
        type: 'VOLUNTEER',
        link: '/volunteers',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Volunteer duty created successfully',
      data: duty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign candidate to a duty
// @route   PUT /api/volunteers/duties/:id/assign
// @access  Private (CLUB_LEADER, ADMIN)
const assignDuty = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const duty = await VolunteerDuty.findById(req.params.id).populate('event');
    if (!duty) return res.status(404).json({ success: false, message: 'Duty not found' });

    duty.assignedTo = userId;
    duty.status = 'ASSIGNED';
    await duty.save();

    await createNotification({
      recipient: userId,
      title: '🎯 Volunteer Duty Assigned',
      message: `You have been assigned to "${duty.title}" for ${duty.event?.title || 'an event'}.`,
      type: 'VOLUNTEER',
      link: '/volunteers',
    });

    res.status(200).json({
      success: true,
      message: 'Volunteer assigned successfully',
      data: duty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update duty progress by volunteer (ACCEPTED, IN_PROGRESS, COMPLETED)
// @route   PUT /api/volunteers/duties/:id/status
// @access  Private
const updateDutyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const duty = await VolunteerDuty.findById(req.params.id);
    if (!duty) return res.status(404).json({ success: false, message: 'Duty not found' });

    // Ensure only the assigned volunteer can update their duty progress
    if (duty.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN' && req.user.role !== 'CLUB_LEADER') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this duty' });
    }

    duty.status = status;
    await duty.save();

    res.status(200).json({
      success: true,
      message: `Duty status updated to ${status}`,
      data: duty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify completed duty and award points to volunteer
// @route   PUT /api/volunteers/duties/:id/verify
// @access  Private (CLUB_LEADER, ADMIN)
const verifyDuty = async (req, res, next) => {
  try {
    const duty = await VolunteerDuty.findById(req.params.id).populate('assignedTo');
    if (!duty) return res.status(404).json({ success: false, message: 'Duty not found' });

    duty.status = 'VERIFIED';
    duty.verifiedBy = req.user._id;
    duty.verifiedAt = new Date();
    await duty.save();

    // Reward points to student
    if (duty.assignedTo) {
      await User.findByIdAndUpdate(duty.assignedTo._id, {
        $inc: { points: duty.pointsReward || 50 },
      });

      await createNotification({
        recipient: duty.assignedTo._id,
        title: `🌟 Duty Verified (+${duty.pointsReward || 50} pts)`,
        message: `Your completed duty "${duty.title}" has been verified by the club leader.`,
        type: 'VOLUNTEER',
        link: '/volunteers',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Volunteer duty verified successfully!',
      data: duty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request duty swap with another volunteer
// @route   POST /api/volunteers/duties/:id/swap-request
// @access  Private
const requestDutySwap = async (req, res, next) => {
  try {
    const { targetVolunteerId, reason } = req.body;
    const duty = await VolunteerDuty.findById(req.params.id);
    if (!duty) return res.status(404).json({ success: false, message: 'Duty not found' });

    if (duty.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only swap duties assigned to you' });
    }

    const swapRequest = await DutySwapRequest.create({
      duty: duty._id,
      requestedBy: req.user._id,
      targetVolunteer: targetVolunteerId,
      reason,
      status: 'PENDING_TARGET_ACCEPT',
    });

    // Notify target volunteer
    await createNotification({
      recipient: targetVolunteerId,
      title: '🔄 Duty Swap Request',
      message: `${req.user.name} requested to swap duty "${duty.title}" with you.`,
      type: 'DUTY_SWAP',
      link: '/volunteers/swaps',
    });

    res.status(201).json({
      success: true,
      message: 'Duty swap request sent to volunteer for acceptance.',
      data: swapRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get swap requests for current user or club leader
// @route   GET /api/volunteers/swaps
// @access  Private
const getDutySwapRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isLeader = req.user.role === 'CLUB_LEADER' || req.user.role === 'ADMIN';

    let query = {};
    if (!isLeader) {
      query = {
        $or: [{ requestedBy: userId }, { targetVolunteer: userId }],
      };
    }

    const swapRequests = await DutySwapRequest.find(query)
      .populate({
        path: 'duty',
        populate: [{ path: 'event', select: 'title date' }, { path: 'club', select: 'name' }],
      })
      .populate('requestedBy', 'name email department avatar studentId')
      .populate('targetVolunteer', 'name email department avatar studentId')
      .populate('leaderApprovedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: swapRequests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Target volunteer accepts or rejects swap
// @route   PUT /api/volunteers/swaps/:id/target-response
// @access  Private
const respondDutySwapTarget = async (req, res, next) => {
  try {
    const { accept } = req.body;
    const swap = await DutySwapRequest.findById(req.params.id)
      .populate('duty')
      .populate('requestedBy', 'name email');

    if (!swap) return res.status(404).json({ success: false, message: 'Swap request not found' });

    if (swap.targetVolunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (accept) {
      swap.status = 'PENDING_LEADER_APPROVAL';
      swap.targetAcceptedAt = new Date();
      await swap.save();

      // Notify requester
      await createNotification({
        recipient: swap.requestedBy._id,
        title: '🔄 Duty Swap Accepted by Peer',
        message: `${req.user.name} accepted your swap request. Awaiting Club Leader final approval.`,
        type: 'DUTY_SWAP',
        link: '/volunteers/swaps',
      });
    } else {
      swap.status = 'REJECTED_BY_TARGET';
      await swap.save();

      await createNotification({
        recipient: swap.requestedBy._id,
        title: '❌ Duty Swap Declined',
        message: `${req.user.name} declined the swap request for "${swap.duty?.title}".`,
        type: 'DUTY_SWAP',
        link: '/volunteers/swaps',
      });
    }

    res.status(200).json({
      success: true,
      message: accept ? 'Swap accepted. Awaiting leader approval.' : 'Swap declined.',
      data: swap,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Club leader approves or rejects swap (reassigns duty ownership on approval!)
// @route   PUT /api/volunteers/swaps/:id/leader-decision
// @access  Private (CLUB_LEADER, ADMIN)
const reviewDutySwapLeader = async (req, res, next) => {
  try {
    const { approve, reviewNotes } = req.body;
    const swap = await DutySwapRequest.findById(req.params.id)
      .populate('duty')
      .populate('requestedBy', 'name email')
      .populate('targetVolunteer', 'name email');

    if (!swap) return res.status(404).json({ success: false, message: 'Swap request not found' });

    if (approve) {
      swap.status = 'APPROVED';
      swap.leaderApprovedBy = req.user._id;
      swap.leaderApprovedAt = new Date();
      swap.reviewNotes = reviewNotes || 'Approved by club management.';
      await swap.save();

      // Reassign Duty to Target Volunteer
      await VolunteerDuty.findByIdAndUpdate(swap.duty._id, {
        assignedTo: swap.targetVolunteer._id,
        status: 'ACCEPTED',
      });

      // Notify both parties
      await createNotification({
        recipient: swap.requestedBy._id,
        title: '✅ Duty Swap Approved',
        message: `Your duty "${swap.duty.title}" was transferred to ${swap.targetVolunteer.name}.`,
        type: 'DUTY_SWAP',
        link: '/volunteers',
      });

      await createNotification({
        recipient: swap.targetVolunteer._id,
        title: '✅ Duty Swap Finalized',
        message: `You are now the official owner of duty "${swap.duty.title}".`,
        type: 'DUTY_SWAP',
        link: '/volunteers',
      });
    } else {
      swap.status = 'REJECTED_BY_LEADER';
      swap.leaderApprovedBy = req.user._id;
      swap.reviewNotes = reviewNotes || 'Rejected by club management.';
      await swap.save();
    }

    res.status(200).json({
      success: true,
      message: approve ? 'Swap approved and duty ownership transferred!' : 'Swap rejected.',
      data: swap,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVolunteerRecommendations,
  getDuties,
  createDuty,
  assignDuty,
  updateDutyStatus,
  verifyDuty,
  requestDutySwap,
  getDutySwapRequests,
  respondDutySwapTarget,
  reviewDutySwapLeader,
};

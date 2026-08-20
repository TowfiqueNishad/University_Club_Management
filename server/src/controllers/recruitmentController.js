const Club = require('../models/Club');
const User = require('../models/User');
const ClubApplication = require('../models/ClubApplication');
const InterviewSlot = require('../models/InterviewSlot');
const InterviewEvaluation = require('../models/InterviewEvaluation');
const RecruitmentWaitlist = require('../models/RecruitmentWaitlist');
const { checkEligibility } = require('../services/eligibilityService');
const { promoteRecruitmentWaitlist } = require('../services/waitlistService');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Check student eligibility for a specific club
// @route   POST /api/recruitment/check-eligibility
// @access  Private (STUDENT)
const checkEligibilityHandler = async (req, res, next) => {
  try {
    const { clubId } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const user = await User.findById(req.user._id);
    const result = checkEligibility(user, club);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply to a club
// @route   POST /api/recruitment/apply
// @access  Private (STUDENT)
const applyToClub = async (req, res, next) => {
  try {
    const { clubId, statement, experience } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    // Check if already applied
    const existing = await ClubApplication.findOne({ club: clubId, applicant: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application to this club.',
        error: 'ALREADY_APPLIED',
      });
    }

    const user = await User.findById(req.user._id);
    const eligibilityResult = checkEligibility(user, club);

    // Enforce eligibility rule: Do not allow submission if failing requirements
    if (!eligibilityResult.isEligible) {
      return res.status(400).json({
        success: false,
        message: 'Application rejected: You do not satisfy the mandatory eligibility requirements for this club.',
        error: 'INELIGIBLE',
        reasons: eligibilityResult.rejectionReasons,
      });
    }

    const application = await ClubApplication.create({
      club: clubId,
      applicant: req.user._id,
      status: 'PENDING',
      statement,
      experience: experience || '',
      eligibilitySnapshot: {
        cgpa: user.cgpa,
        department: user.department,
        semester: user.semester,
        completedCredits: user.completedCredits,
        isEligible: true,
        rejectionReasons: [],
      },
    });

    // Notify club leader
    await createNotification({
      recipient: club.lead,
      title: '📋 New Club Application Received',
      message: `${user.name} applied for recruitment in "${club.name}".`,
      type: 'APPLICATION',
      link: `/clubs/${club._id}/applications`,
    });

    // Notify student
    await createNotification({
      recipient: req.user._id,
      title: '✅ Application Submitted',
      message: `Your application to "${club.name}" was successfully received and is under review.`,
      type: 'APPLICATION',
      link: '/applications',
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for a club (Leader / Admin / Interviewer)
// @route   GET /api/recruitment/club/:clubId/applications
// @access  Private (CLUB_LEADER, ADMIN, INTERVIEWER)
const getClubApplications = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { status, search, department, minCgpa } = req.query;

    const query = { club: clubId };
    if (status && status !== 'ALL') query.status = status;

    let applications = await ClubApplication.find(query)
      .populate('applicant', 'name email studentId department semester cgpa completedCredits avatar phone')
      .populate({
        path: 'interviewSlot',
        populate: { path: 'interviewer', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    // Client search filtering
    if (search) {
      const s = search.toLowerCase();
      applications = applications.filter(
        (app) =>
          app.applicant?.name?.toLowerCase().includes(s) ||
          app.applicant?.email?.toLowerCase().includes(s) ||
          app.applicant?.studentId?.toLowerCase().includes(s)
      );
    }

    if (department && department !== 'ALL') {
      applications = applications.filter((app) => app.applicant?.department === department);
    }

    if (minCgpa) {
      applications = applications.filter((app) => (app.applicant?.cgpa || 0) >= Number(minCgpa));
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's submitted applications
// @route   GET /api/recruitment/my-applications
// @access  Private (STUDENT)
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await ClubApplication.find({ applicant: req.user._id })
      .populate('club', 'name code category logo banner eligibilityRequirements')
      .populate({
        path: 'interviewSlot',
        populate: { path: 'interviewer', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create interview slot
// @route   POST /api/recruitment/interview-slots
// @access  Private (CLUB_LEADER, INTERVIEWER, ADMIN)
const createInterviewSlot = async (req, res, next) => {
  try {
    const { clubId, date, startTime, endTime, location, maxApplicants } = req.body;

    const interviewerId = req.user._id;

    // Check conflict for interviewer on same date/time
    const conflict = await InterviewSlot.findOne({
      interviewer: interviewerId,
      date,
      startTime,
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'You already have an interview slot scheduled at this time.',
        error: 'SLOT_CONFLICT',
      });
    }

    const slot = await InterviewSlot.create({
      club: clubId,
      interviewer: interviewerId,
      date,
      startTime,
      endTime,
      location: location || 'Faculty Building Room 402 / Meet',
      maxApplicants: Number(maxApplicants) || 1,
      bookedApplicants: [],
      status: 'AVAILABLE',
    });

    res.status(201).json({
      success: true,
      message: 'Interview slot created successfully',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interview slots for a club
// @route   GET /api/recruitment/club/:clubId/interview-slots
// @access  Private
const getInterviewSlots = async (req, res, next) => {
  try {
    const slots = await InterviewSlot.find({ club: req.params.clubId })
      .populate('interviewer', 'name email department avatar')
      .populate('bookedApplicants', 'name email studentId')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book interview slot by student
// @route   POST /api/recruitment/book-interview
// @access  Private (STUDENT)
const bookInterviewSlot = async (req, res, next) => {
  try {
    const { applicationId, slotId } = req.body;

    const application = await ClubApplication.findOne({
      _id: applicationId,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const slot = await InterviewSlot.findById(slotId).populate('interviewer', 'name email');
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Interview slot not found' });
    }

    if (slot.status === 'FULL' || slot.bookedApplicants.length >= slot.maxApplicants) {
      return res.status(400).json({
        success: false,
        message: 'This interview slot is already fully booked.',
        error: 'SLOT_FULL',
      });
    }

    if (slot.bookedApplicants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already booked this slot.',
        error: 'DUPLICATE_BOOKING',
      });
    }

    // Atomic update
    slot.bookedApplicants.push(req.user._id);
    if (slot.bookedApplicants.length >= slot.maxApplicants) {
      slot.status = 'FULL';
    }
    await slot.save();

    // Update application
    application.interviewSlot = slot._id;
    application.status = 'INTERVIEW_SCHEDULED';
    await application.save();

    // Notify interviewer
    await createNotification({
      recipient: slot.interviewer._id,
      title: '📅 Interview Booked',
      message: `${req.user.name} booked an interview on ${slot.date} at ${slot.startTime}.`,
      type: 'INTERVIEW',
      link: `/interviews`,
    });

    // Notify student
    await createNotification({
      recipient: req.user._id,
      title: '📅 Interview Confirmed',
      message: `Your interview is confirmed for ${slot.date} at ${slot.startTime} (${slot.location}).`,
      type: 'INTERVIEW',
      link: '/applications',
    });

    res.status(200).json({
      success: true,
      message: 'Interview slot booked successfully!',
      data: { application, slot },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate applicant with 5 criteria
// @route   POST /api/recruitment/evaluate
// @access  Private (INTERVIEWER, CLUB_LEADER, ADMIN)
const evaluateApplicant = async (req, res, next) => {
  try {
    const { applicationId, communication, technicalKnowledge, leadership, creativity, problemSolving, comments, recommendation } = req.body;

    const application = await ClubApplication.findById(applicationId).populate('club');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const c = Math.min(20, Math.max(0, Number(communication) || 0));
    const t = Math.min(20, Math.max(0, Number(technicalKnowledge) || 0));
    const l = Math.min(20, Math.max(0, Number(leadership) || 0));
    const cr = Math.min(20, Math.max(0, Number(creativity) || 0));
    const ps = Math.min(20, Math.max(0, Number(problemSolving) || 0));

    const totalScore = c + t + l + cr + ps;
    const averageScore = Number((totalScore / 5).toFixed(2));

    const evaluation = await InterviewEvaluation.findOneAndUpdate(
      { application: applicationId },
      {
        application: applicationId,
        club: application.club._id,
        interviewer: req.user._id,
        applicant: application.applicant,
        scores: {
          communication: c,
          technicalKnowledge: t,
          leadership: l,
          creativity: cr,
          problemSolving: ps,
        },
        totalScore,
        averageScore,
        recommendation: recommendation || 'ACCEPT',
        comments: comments || '',
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update application
    application.evaluationScore = totalScore;
    application.status = 'INTERVIEWED';
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully!',
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidate rankings for a club
// @route   GET /api/recruitment/club/:clubId/rankings
// @access  Private (CLUB_LEADER, ADMIN, INTERVIEWER)
const getRecruitmentRankings = async (req, res, next) => {
  try {
    const evaluations = await InterviewEvaluation.find({ club: req.params.clubId })
      .populate('applicant', 'name email studentId department cgpa avatar')
      .populate('interviewer', 'name email')
      .populate('application')
      .sort({ totalScore: -1 });

    res.status(200).json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Final decision on candidate (ACCEPT, REJECT, WAITLIST)
// @route   PUT /api/recruitment/application/:id/decision
// @access  Private (CLUB_LEADER, ADMIN)
const updateApplicationDecision = async (req, res, next) => {
  try {
    const { decision, notes } = req.body; // 'ACCEPTED', 'REJECTED', 'WAITLISTED'
    const application = await ClubApplication.findById(req.params.id)
      .populate('club')
      .populate('applicant', 'name email');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const club = application.club;

    if (decision === 'ACCEPTED') {
      // Check if club is at maximum capacity
      if (club.members.length >= club.maxMembers) {
        // Club is full -> Place on recruitment waitlist
        const count = await RecruitmentWaitlist.countDocuments({ club: club._id, status: 'WAITING' });
        const waitlistItem = await RecruitmentWaitlist.create({
          club: club._id,
          applicant: application.applicant._id,
          application: application._id,
          evaluationScore: application.evaluationScore || 0,
          priorityRank: count + 1,
          status: 'WAITING',
        });

        application.status = 'WAITLISTED';
        application.decisionNotes = notes || 'Club is at capacity. Placed on priority recruitment waiting list.';
        await application.save();

        await createNotification({
          recipient: application.applicant._id,
          title: '⏳ Placed on Club Waiting List',
          message: `Your interview was successful, but "${club.name}" is currently full. You are on the waiting list at rank #${count + 1}.`,
          type: 'APPLICATION',
          link: '/applications',
        });

        return res.status(200).json({
          success: true,
          message: 'Club is full. Applicant placed on recruitment waitlist.',
          waitlist: waitlistItem,
          application,
        });
      }

      // Add to club members
      if (!club.members.includes(application.applicant._id)) {
        club.members.push(application.applicant._id);
        await club.save();
      }

      // Update user role if was student
      await User.findByIdAndUpdate(application.applicant._id, { role: 'CLUB_MEMBER' });

      application.status = 'ACCEPTED';
      application.decisionNotes = notes || 'Accepted into club.';
      await application.save();

      await createNotification({
        recipient: application.applicant._id,
        title: '🎉 Welcome to the Club!',
        message: `Congratulations! Your application to "${club.name}" has been accepted.`,
        type: 'APPLICATION',
        link: `/clubs/${club._id}`,
      });
    } else if (decision === 'REJECTED') {
      application.status = 'REJECTED';
      application.decisionNotes = notes || 'Application rejected.';
      await application.save();

      await createNotification({
        recipient: application.applicant._id,
        title: 'Application Status Update',
        message: `Your application to "${club.name}" was not selected at this time.`,
        type: 'APPLICATION',
        link: '/applications',
      });
    } else if (decision === 'WAITLISTED') {
      const count = await RecruitmentWaitlist.countDocuments({ club: club._id, status: 'WAITING' });
      await RecruitmentWaitlist.create({
        club: club._id,
        applicant: application.applicant._id,
        application: application._id,
        evaluationScore: application.evaluationScore || 0,
        priorityRank: count + 1,
        status: 'WAITING',
      });

      application.status = 'WAITLISTED';
      application.decisionNotes = notes || 'Placed on recruitment waiting list.';
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: `Application marked as ${decision}`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recruitment waiting list
// @route   GET /api/recruitment/club/:clubId/waitlist
// @access  Private (CLUB_LEADER, ADMIN)
const getClubWaitlist = async (req, res, next) => {
  try {
    const waitlist = await RecruitmentWaitlist.find({ club: req.params.clubId })
      .populate('applicant', 'name email studentId department avatar cgpa')
      .sort({ priorityRank: 1 });

    res.status(200).json({
      success: true,
      data: waitlist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkEligibilityHandler,
  applyToClub,
  getClubApplications,
  getMyApplications,
  createInterviewSlot,
  getInterviewSlots,
  bookInterviewSlot,
  evaluateApplicant,
  getRecruitmentRankings,
  updateApplicationDecision,
  getClubWaitlist,
};

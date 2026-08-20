const Club = require('../models/Club');
const User = require('../models/User');
const ClubApplication = require('../models/ClubApplication');
const { promoteRecruitmentWaitlist } = require('../services/waitlistService');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all clubs with search, category filtering & statistics
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const clubs = await Club.find(query)
      .populate('lead', 'name email department avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single club details with member statistics
// @route   GET /api/clubs/:id
// @access  Public
const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('lead', 'name email department phone avatar bio')
      .populate('executives', 'name email department avatar')
      .populate('members', 'name email department studentId avatar cgpa semester');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
        error: 'CLUB_NOT_FOUND',
      });
    }

    // Count pending applications for leader badge
    const pendingApplicationsCount = await ClubApplication.countDocuments({
      club: club._id,
      status: { $in: ['PENDING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'] },
    });

    res.status(200).json({
      success: true,
      data: {
        ...club.toObject(),
        pendingApplicationsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new club
// @route   POST /api/clubs
// @access  Private (ADMIN, CLUB_LEADER)
const createClub = async (req, res, next) => {
  try {
    const {
      name,
      code,
      category,
      description,
      logo,
      banner,
      maxMembers,
      eligibilityRequirements,
      budget,
      socialLinks,
      lead,
    } = req.body;

    const clubLead = lead || req.user._id;

    const newClub = await Club.create({
      name,
      code: code ? code.toUpperCase() : name.substring(0, 4).toUpperCase(),
      category: category || 'Technology',
      description,
      logo: logo || '',
      banner: banner || '',
      lead: clubLead,
      executives: [clubLead],
      members: [clubLead],
      maxMembers: Number(maxMembers) || 50,
      eligibilityRequirements: eligibilityRequirements || {
        minCgpa: 2.5,
        allowedDepartments: [],
        minSemester: 1,
        minCredits: 0,
      },
      budget: budget || { allocated: 5000, spent: 0, currency: 'USD' },
      socialLinks: socialLinks || {},
    });

    // Update user role if student created it or was designated lead
    await User.findByIdAndUpdate(clubLead, { role: 'CLUB_LEADER' });

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: newClub,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update club details
// @route   PUT /api/clubs/:id
// @access  Private (CLUB_LEADER of club, ADMIN)
const updateClub = async (req, res, next) => {
  try {
    let club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    // Permission check
    const isLead = club.lead.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isLead && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the club leader or university administrator can modify this club',
        error: 'FORBIDDEN',
      });
    }

    club = await Club.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('lead', 'name email');

    res.status(200).json({
      success: true,
      message: 'Club details updated successfully',
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Configure club eligibility requirements
// @route   PUT /api/clubs/:id/eligibility
// @access  Private (CLUB_LEADER of club, ADMIN)
const updateEligibility = async (req, res, next) => {
  try {
    const { minCgpa, allowedDepartments, minSemester, minCredits, customQuestion } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const isLead = club.lead.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isLead && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to configure eligibility for this club',
        error: 'FORBIDDEN',
      });
    }

    club.eligibilityRequirements = {
      minCgpa: minCgpa !== undefined ? Number(minCgpa) : club.eligibilityRequirements.minCgpa,
      allowedDepartments: Array.isArray(allowedDepartments) ? allowedDepartments : club.eligibilityRequirements.allowedDepartments,
      minSemester: minSemester !== undefined ? Number(minSemester) : club.eligibilityRequirements.minSemester,
      minCredits: minCredits !== undefined ? Number(minCredits) : club.eligibilityRequirements.minCredits,
      customQuestion: customQuestion || club.eligibilityRequirements.customQuestion,
    };

    await club.save();

    res.status(200).json({
      success: true,
      message: 'Recruitment eligibility requirements updated successfully',
      data: club.eligibilityRequirements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from the club (triggers waitlist auto-promotion!)
// @route   DELETE /api/clubs/:id/members/:userId
// @access  Private (CLUB_LEADER, ADMIN)
const removeMember = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const isLead = club.lead.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isLead && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    const memberId = req.params.userId;
    club.members = club.members.filter((m) => m.toString() !== memberId);
    club.executives = club.executives.filter((e) => e.toString() !== memberId);
    await club.save();

    // Trigger auto-promotion from recruitment waitlist if any candidate is queued
    const promotedCandidate = await promoteRecruitmentWaitlist(club._id);

    res.status(200).json({
      success: true,
      message: 'Member removed from club',
      promotedCandidate: promotedCandidate ? promotedCandidate.applicant : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  updateEligibility,
  removeMember,
};

const User = require('../models/User');
const Badge = require('../models/Badge');
const Attendance = require('../models/Attendance');
const VolunteerDuty = require('../models/VolunteerDuty');

// @desc    Get system leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
const getLeaderboard = async (req, res, next) => {
  try {
    const topStudents = await User.find({ role: { $in: ['STUDENT', 'CLUB_MEMBER'] } })
      .select('name email studentId department avatar points attendanceStats skills')
      .sort({ points: -1 })
      .limit(20);

    const formatted = await Promise.all(
      topStudents.map(async (student, index) => {
        const eventsAttended = await Attendance.countDocuments({ user: student._id });
        const dutiesCompleted = await VolunteerDuty.countDocuments({
          assignedTo: student._id,
          status: 'VERIFIED',
        });

        return {
          rank: index + 1,
          user: student,
          points: student.points || 0,
          eventsAttended,
          dutiesCompleted,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available badges & user unlocked status
// @route   GET /api/gamification/badges
// @access  Private
const getBadges = async (req, res, next) => {
  try {
    const badges = await Badge.find().sort({ pointsRequirement: 1 });
    const user = await User.findById(req.user._id);

    const badgesWithStatus = badges.map((badge) => {
      const isUnlocked = (user.points || 0) >= badge.pointsRequirement;
      return {
        ...badge.toObject(),
        isUnlocked,
        currentPoints: user.points || 0,
        progress: Math.min(100, Math.round(((user.points || 0) / badge.pointsRequirement) * 100)),
      };
    });

    res.status(200).json({
      success: true,
      data: badgesWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  getBadges,
};

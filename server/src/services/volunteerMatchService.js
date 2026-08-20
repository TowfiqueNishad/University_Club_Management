const User = require('../models/User');
const VolunteerDuty = require('../models/VolunteerDuty');

/**
 * Recommends and ranks student volunteers for an event duty based on skill overlap,
 * current workload, and past completed duties.
 *
 * @param {Array<string>} requiredSkills
 * @param {string} [clubId]
 * @returns {Promise<Array>} Ranked list of volunteers with match %, workload, and experience
 */
const matchVolunteers = async (requiredSkills = [], clubId = null) => {
  const students = await User.find({
    role: { $in: ['STUDENT', 'CLUB_MEMBER'] },
  }).select('name email studentId department skills avatar points');

  if (!requiredSkills || requiredSkills.length === 0) {
    requiredSkills = ['Event Management'];
  }

  const normalizedRequired = requiredSkills.map((s) => s.trim().toLowerCase());

  const results = [];

  for (const student of students) {
    const studentSkills = (student.skills || []).map((s) => s.trim().toLowerCase());

    // 1. Calculate Skill Match
    const matchingSkills = studentSkills.filter((s) =>
      normalizedRequired.some((req) => req.includes(s) || s.includes(req))
    );

    const matchPercentage = Math.min(
      100,
      Math.round((matchingSkills.length / Math.max(1, normalizedRequired.length)) * 100)
    );

    // 2. Active Workload (Duties assigned or in progress)
    const activeDutiesCount = await VolunteerDuty.countDocuments({
      assignedTo: student._id,
      status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
    });

    // 3. Past Completed Experience
    const completedDutiesCount = await VolunteerDuty.countDocuments({
      assignedTo: student._id,
      status: 'VERIFIED',
    });

    results.push({
      user: student,
      matchPercentage,
      matchingSkills,
      activeDutiesCount,
      completedDutiesCount,
      workloadScore: activeDutiesCount > 3 ? 'Heavy' : activeDutiesCount > 1 ? 'Moderate' : 'Available',
    });
  }

  // Sort by match percentage DESC, then active workload ASC, then experience DESC
  results.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    if (a.activeDutiesCount !== b.activeDutiesCount) {
      return a.activeDutiesCount - b.activeDutiesCount;
    }
    return b.completedDutiesCount - a.completedDutiesCount;
  });

  return results;
};

module.exports = {
  matchVolunteers,
};

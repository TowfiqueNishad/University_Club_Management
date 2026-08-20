/**
 * Validates whether a student satisfies the club's configurable eligibility requirements.
 *
 * @param {Object} user - User document with studentId, cgpa, department, semester, completedCredits
 * @param {Object} club - Club document with eligibilityRequirements
 * @returns {Object} { isEligible: boolean, rejectionReasons: string[], metrics: object }
 */
const checkEligibility = (user, club) => {
  const reqs = club.eligibilityRequirements || {};
  const reasons = [];

  const userCgpa = Number(user.cgpa || 0);
  const userSemester = Number(user.semester || 1);
  const userCredits = Number(user.completedCredits || 0);
  const userDepartment = (user.department || '').trim();

  const minCgpa = Number(reqs.minCgpa || 0);
  const minSemester = Number(reqs.minSemester || 1);
  const minCredits = Number(reqs.minCredits || 0);
  const allowedDepartments = Array.isArray(reqs.allowedDepartments)
    ? reqs.allowedDepartments.filter(Boolean)
    : [];

  // 1. CGPA check
  if (userCgpa < minCgpa) {
    reasons.push(
      `CGPA requirement not met: minimum ${minCgpa.toFixed(2)} required (your CGPA: ${userCgpa.toFixed(2)})`
    );
  }

  // 2. Department check
  if (allowedDepartments.length > 0 && !allowedDepartments.includes(userDepartment)) {
    reasons.push(
      `Department restriction: only open to [${allowedDepartments.join(', ')}] (your department: ${userDepartment})`
    );
  }

  // 3. Semester check
  if (userSemester < minSemester) {
    reasons.push(
      `Semester requirement not met: minimum Semester ${minSemester} required (your semester: ${userSemester})`
    );
  }

  // 4. Credits check
  if (userCredits < minCredits) {
    reasons.push(
      `Credit completion requirement not met: minimum ${minCredits} credits required (your completed credits: ${userCredits})`
    );
  }

  return {
    isEligible: reasons.length === 0,
    rejectionReasons: reasons,
    metrics: {
      cgpa: userCgpa,
      minCgpa,
      department: userDepartment,
      allowedDepartments,
      semester: userSemester,
      minSemester,
      completedCredits: userCredits,
      minCredits,
    },
  };
};

module.exports = {
  checkEligibility,
};

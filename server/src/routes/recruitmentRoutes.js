const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/recruitmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/check-eligibility', protect, checkEligibilityHandler);
router.post('/apply', protect, applyToClub);
router.get('/my-applications', protect, getMyApplications);
router.get('/club/:clubId/applications', protect, authorize('CLUB_LEADER', 'ADMIN', 'INTERVIEWER'), getClubApplications);
router.get('/club/:clubId/interview-slots', protect, getInterviewSlots);
router.post('/interview-slots', protect, authorize('CLUB_LEADER', 'ADMIN', 'INTERVIEWER'), createInterviewSlot);
router.post('/book-interview', protect, bookInterviewSlot);
router.post('/evaluate', protect, authorize('INTERVIEWER', 'CLUB_LEADER', 'ADMIN'), evaluateApplicant);
router.get('/club/:clubId/rankings', protect, authorize('CLUB_LEADER', 'ADMIN', 'INTERVIEWER'), getRecruitmentRankings);
router.put('/application/:id/decision', protect, authorize('CLUB_LEADER', 'ADMIN'), updateApplicationDecision);
router.get('/club/:clubId/waitlist', protect, authorize('CLUB_LEADER', 'ADMIN'), getClubWaitlist);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

router.post('/recommendations', protect, authorize('CLUB_LEADER', 'ADMIN', 'CLUB_MEMBER'), getVolunteerRecommendations);
router.get('/duties', protect, getDuties);
router.post('/duties', protect, authorize('CLUB_LEADER', 'ADMIN', 'CLUB_MEMBER'), createDuty);
router.put('/duties/:id/assign', protect, authorize('CLUB_LEADER', 'ADMIN'), assignDuty);
router.put('/duties/:id/status', protect, updateDutyStatus);
router.put('/duties/:id/verify', protect, authorize('CLUB_LEADER', 'ADMIN'), verifyDuty);
router.post('/duties/:id/swap-request', protect, requestDutySwap);
router.get('/swaps', protect, getDutySwapRequests);
router.put('/swaps/:id/target-response', protect, respondDutySwapTarget);
router.put('/swaps/:id/leader-decision', protect, authorize('CLUB_LEADER', 'ADMIN'), reviewDutySwapLeader);

module.exports = router;

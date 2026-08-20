const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  checkEventConflictsAPI,
  createEventProposal,
  reviewEventProposal,
  invitePartnerClub,
  respondPartnerInvite,
  updateMilestone,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getEvents);
router.post('/check-conflicts', protect, checkEventConflictsAPI);
router.post('/', protect, authorize('CLUB_MEMBER', 'CLUB_LEADER', 'ADMIN'), createEventProposal);
router.get('/:id', getEventById);
router.put('/:id/review', protect, authorize('CLUB_LEADER', 'ADMIN'), reviewEventProposal);
router.post('/:id/invite-partner', protect, authorize('CLUB_LEADER', 'ADMIN'), invitePartnerClub);
router.put('/:id/respond-invite', protect, respondPartnerInvite);
router.put('/:id/milestones/:milestoneId', protect, updateMilestone);

module.exports = router;

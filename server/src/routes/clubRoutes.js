const express = require('express');
const router = express.Router();
const {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  updateEligibility,
  removeMember,
} = require('../controllers/clubController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getClubs)
  .post(protect, authorize('ADMIN', 'CLUB_LEADER'), createClub);

router.route('/:id')
  .get(getClubById)
  .put(protect, updateClub);

router.put('/:id/eligibility', protect, updateEligibility);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getBadges,
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard);
router.get('/badges', protect, getBadges);

module.exports = router;

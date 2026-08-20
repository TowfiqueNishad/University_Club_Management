const express = require('express');
const router = express.Router();
const {
  getClubBudgetSummary,
  getExpenses,
  addExpense,
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/club/:clubId/summary', protect, getClubBudgetSummary);
router.get('/club/:clubId/expenses', protect, getExpenses);
router.post('/expenses', protect, authorize('CLUB_LEADER', 'ADMIN', 'CLUB_MEMBER'), addExpense);

module.exports = router;

const Expense = require('../models/Expense');
const Club = require('../models/Club');
const Event = require('../models/Event');

// @desc    Get club budget & expense summary with category breakdown
// @route   GET /api/finance/club/:clubId/summary
// @access  Private (CLUB_LEADER, ADMIN, CLUB_MEMBER)
const getClubBudgetSummary = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const expenses = await Expense.find({ club: req.params.clubId, status: 'APPROVED' });

    const totalAllocated = club.budget.allocated || 5000;
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = totalAllocated - totalSpent;
    const isOverBudget = remaining < 0;

    // Category breakdown
    const categoryTotals = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        club: {
          _id: club._id,
          name: club.name,
          currency: club.budget.currency || 'USD',
        },
        totalAllocated,
        totalSpent,
        remaining,
        isOverBudget,
        burnRatePercentage: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses list for a club
// @route   GET /api/finance/club/:clubId/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { eventId, category, status } = req.query;
    const query = { club: req.params.clubId };

    if (eventId) query.event = eventId;
    if (category && category !== 'ALL') query.category = category;
    if (status && status !== 'ALL') query.status = status;

    const expenses = await Expense.find(query)
      .populate('event', 'title date')
      .populate('recordedBy', 'name email avatar')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new expense
// @route   POST /api/finance/expenses
// @access  Private (CLUB_LEADER, ADMIN, CLUB_MEMBER)
const addExpense = async (req, res, next) => {
  try {
    const { club, event, title, category, amount, date, receiptUrl, notes } = req.body;

    const expense = await Expense.create({
      club,
      event: event || null,
      title,
      category: category || 'Other',
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
      recordedBy: req.user._id,
      receiptUrl: receiptUrl || '',
      notes: notes || '',
      status: 'APPROVED',
    });

    // Update club spent amount
    await Club.findByIdAndUpdate(club, {
      $inc: { 'budget.spent': Number(amount) },
    });

    // If event tied, update event budgetSpent
    if (event) {
      await Event.findByIdAndUpdate(event, {
        $inc: { budgetSpent: Number(amount) },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClubBudgetSummary,
  getExpenses,
  addExpense,
};

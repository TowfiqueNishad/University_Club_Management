const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { protect, authorize } = require('./middleware/auth');

// Models for system overview
const User = require('./models/User');
const Club = require('./models/Club');
const Event = require('./models/Event');
const ClubApplication = require('./models/ClubApplication');
const Attendance = require('./models/Attendance');
const Expense = require('./models/Expense');
const Certificate = require('./models/Certificate');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'CampusHub - University Club Management System API',
    timestamp: new Date().toISOString(),
  });
});

// System Analytics endpoint (Admin Dashboard KPIs & Charts)
app.get('/api/analytics/system-overview', protect, authorize('ADMIN', 'CLUB_LEADER'), async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'CLUB_MEMBER'] } });
    const totalClubs = await Club.countDocuments();
    const activeEvents = await Event.countDocuments({ status: { $in: ['PUBLISHED', 'APPROVED'] } });
    const pendingApplications = await ClubApplication.countDocuments({ status: 'PENDING' });
    const totalCertificates = await Certificate.countDocuments({ status: 'VALID' });
    const totalAttendances = await Attendance.countDocuments();

    // Total expenses
    const expenses = await Expense.find({ status: 'APPROVED' });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Club category distribution
    const clubs = await Club.find();
    const categoryCounts = {};
    clubs.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Event type distribution
    const events = await Event.find();
    const eventTypeCounts = {};
    events.forEach((e) => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;
    });

    const eventTypeDistribution = Object.entries(eventTypeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalClubs,
        activeEvents,
        pendingApplications,
        totalCertificates,
        totalAttendances,
        totalExpenses,
        categoryDistribution,
        eventTypeDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clubs', require('./routes/clubRoutes'));
app.use('/api/recruitment', require('./routes/recruitmentRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
    error: 'NOT_FOUND',
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[CampusHub Backend Running]: Port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;

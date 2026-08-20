const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  cancelRegistration,
  getEventQRData,
  verifyAttendanceQR,
  getStudentParticipationHistory,
  getAttendanceConsistencyReport,
  getEventAttendanceList,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/events/:id/register', protect, registerForEvent);
router.post('/events/:id/cancel', protect, cancelRegistration);
router.get('/events/:id/qr-code', protect, getEventQRData);
router.post('/verify-qr', protect, verifyAttendanceQR);
router.get('/student-history/:userId?', protect, getStudentParticipationHistory);
router.get('/consistency-report', protect, authorize('CLUB_LEADER', 'ADMIN'), getAttendanceConsistencyReport);
router.get('/events/:id/list', protect, authorize('CLUB_LEADER', 'ADMIN', 'CLUB_MEMBER'), getEventAttendanceList);

module.exports = router;

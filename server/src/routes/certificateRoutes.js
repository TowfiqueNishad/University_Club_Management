const express = require('express');
const router = express.Router();
const {
  issueCertificate,
  getMyCertificates,
  verifyCertificatePublic,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

router.post('/issue', protect, authorize('CLUB_LEADER', 'ADMIN'), issueCertificate);
router.get('/my-certificates', protect, getMyCertificates);
router.get('/verify/:certificateId', verifyCertificatePublic);

module.exports = router;

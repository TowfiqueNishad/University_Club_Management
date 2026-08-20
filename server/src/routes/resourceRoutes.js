const express = require('express');
const router = express.Router();
const {
  getVenues,
  getVenueById,
  createVenue,
  reserveVenue,
  getEquipmentList,
  createEquipment,
  reserveEquipment,
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/venues', getVenues);
router.post('/venues', protect, authorize('ADMIN'), createVenue);
router.get('/venues/:id', getVenueById);
router.post('/venues/:id/reserve', protect, reserveVenue);

router.get('/equipment', getEquipmentList);
router.post('/equipment', protect, authorize('ADMIN'), createEquipment);
router.post('/equipment/:id/reserve', protect, reserveEquipment);

module.exports = router;

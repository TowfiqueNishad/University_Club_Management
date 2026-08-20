const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment');
const { checkVenueConflict, checkEquipmentConflict } = require('../services/conflictService');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all venues
// @route   GET /api/resources/venues
// @access  Public
const getVenues = async (req, res, next) => {
  try {
    const { search, minCapacity } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (minCapacity) {
      query.capacity = { $gte: Number(minCapacity) };
    }

    const venues = await Venue.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get venue by ID with active reservation schedule
// @route   GET /api/resources/venues/:id
// @access  Public
const getVenueById = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('reservations.bookedBy', 'name email')
      .populate('reservations.club', 'name code');

    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

    res.status(200).json({
      success: true,
      data: venue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new venue
// @route   POST /api/resources/venues
// @access  Private (ADMIN)
const createVenue = async (req, res, next) => {
  try {
    const { name, building, roomNumber, capacity, facilities, description, image } = req.body;

    const venue = await Venue.create({
      name,
      building,
      roomNumber,
      capacity: Number(capacity) || 100,
      facilities: Array.isArray(facilities) ? facilities : ['Projector', 'Air Conditioning', 'WiFi'],
      description: description || '',
      image: image || '',
      reservations: [],
    });

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reserve venue with strict conflict checking
// @route   POST /api/resources/venues/:id/reserve
// @access  Private
const reserveVenue = async (req, res, next) => {
  try {
    const venueId = req.params.id;
    const { date, startTime, endTime, purpose, clubId } = req.body;

    // Run collision detection
    const conflict = await checkVenueConflict(venueId, date, startTime, endTime);
    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: `Venue conflict detected: ${conflict.venueName} is already booked on ${date} between ${startTime} and ${endTime}.`,
        error: 'VENUE_CONFLICT',
        conflicts: conflict.conflicts,
      });
    }

    const reservation = {
      club: clubId || null,
      bookedBy: req.user._id,
      date,
      startTime,
      endTime,
      purpose,
      status: 'CONFIRMED',
      createdAt: new Date(),
    };

    const updatedVenue = await Venue.findByIdAndUpdate(
      venueId,
      { $push: { reservations: reservation } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Venue reserved successfully!',
      data: updatedVenue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get equipment list
// @route   GET /api/resources/equipment
// @access  Public
const getEquipmentList = async (req, res, next) => {
  try {
    const { category, condition, search } = req.query;
    const query = {};

    if (category && category !== 'ALL') query.category = category;
    if (condition && condition !== 'ALL') query.condition = condition;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const equipment = await Equipment.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create equipment
// @route   POST /api/resources/equipment
// @access  Private (ADMIN)
const createEquipment = async (req, res, next) => {
  try {
    const { name, category, totalQuantity, condition, location, description } = req.body;

    const eq = await Equipment.create({
      name,
      category: category || 'Audio/Visual',
      totalQuantity: Number(totalQuantity) || 5,
      availableQuantity: Number(totalQuantity) || 5,
      condition: condition || 'EXCELLENT',
      location: location || 'Campus Resource Center',
      description: description || '',
      reservations: [],
    });

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: eq,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reserve equipment with stock conflict checking
// @route   POST /api/resources/equipment/:id/reserve
// @access  Private
const reserveEquipment = async (req, res, next) => {
  try {
    const equipmentId = req.params.id;
    const { quantity, date, startTime, endTime, purpose, clubId } = req.body;
    const qty = Number(quantity) || 1;

    const conflict = await checkEquipmentConflict([{ equipment: equipmentId, quantity: qty }], date, startTime, endTime);
    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Insufficient equipment stock for the requested time period.',
        error: 'EQUIPMENT_STOCK_EXCEEDED',
        conflictedItems: conflict.conflictedItems,
      });
    }

    const reservation = {
      club: clubId || null,
      requestedBy: req.user._id,
      quantity: qty,
      date,
      startTime,
      endTime,
      purpose,
      status: 'APPROVED',
      createdAt: new Date(),
    };

    const updatedEquipment = await Equipment.findByIdAndUpdate(
      equipmentId,
      { $push: { reservations: reservation } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Equipment reservation confirmed!',
      data: updatedEquipment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVenues,
  getVenueById,
  createVenue,
  reserveVenue,
  getEquipmentList,
  createEquipment,
  reserveEquipment,
};

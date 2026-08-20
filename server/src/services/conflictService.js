const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment');
const Event = require('../models/Event');

/**
 * Checks for venue scheduling collisions.
 * Overlap formula: (startA < endB) AND (endA > startB) on the same date.
 *
 * @param {string} venueId
 * @param {string} date - 'YYYY-MM-DD'
 * @param {string} startTime - 'HH:mm'
 * @param {string} endTime - 'HH:mm'
 * @param {string} [excludeEventId] - Exclude current event when updating
 * @returns {Promise<Object>} { hasConflict: boolean, conflictingEvents: Array, venue: Object }
 */
const checkVenueConflict = async (venueId, date, startTime, endTime, excludeEventId = null) => {
  if (!venueId || !date || !startTime || !endTime) {
    return { hasConflict: false, conflictingEvents: [] };
  }

  const venue = await Venue.findById(venueId);
  if (!venue) {
    return { hasConflict: false, conflictingEvents: [] };
  }

  // 1. Check existing confirmed venue reservations
  const conflictingReservations = venue.reservations.filter((r) => {
    if (r.status === 'CANCELLED' || r.status === 'REJECTED') return false;
    if (r.date !== date) return false;
    if (excludeEventId && r.event && r.event.toString() === excludeEventId.toString()) return false;

    return startTime < r.endTime && endTime > r.startTime;
  });

  // 2. Check active events that booked this venue
  const eventQuery = {
    venue: venueId,
    date,
    status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'] },
    $expr: {
      $and: [
        { $lt: [startTime, '$endTime'] },
        { $gt: [endTime, '$startTime'] },
      ],
    },
  };

  if (excludeEventId) {
    eventQuery._id = { $ne: excludeEventId };
  }

  const conflictingEvents = await Event.find(eventQuery).populate('club', 'name');

  const hasConflict = conflictingReservations.length > 0 || conflictingEvents.length > 0;

  return {
    hasConflict,
    venueName: venue.name,
    roomNumber: venue.roomNumber,
    conflicts: [
      ...conflictingEvents.map((e) => ({
        type: 'EVENT',
        title: e.title,
        clubName: e.club?.name || 'Club',
        time: `${e.startTime} - ${e.endTime}`,
      })),
      ...conflictingReservations.map((r) => ({
        type: 'RESERVATION',
        purpose: r.purpose,
        time: `${r.startTime} - ${r.endTime}`,
      })),
    ],
  };
};

/**
 * Checks for equipment quantity collisions across the requested time window.
 *
 * @param {Array<{ equipment: string, quantity: number }>} items
 * @param {string} date
 * @param {string} startTime
 * @param {string} endTime
 * @param {string} [excludeEventId]
 * @returns {Promise<Object>} { hasConflict: boolean, conflictedItems: Array }
 */
const checkEquipmentConflict = async (items, date, startTime, endTime, excludeEventId = null) => {
  if (!Array.isArray(items) || items.length === 0 || !date || !startTime || !endTime) {
    return { hasConflict: false, conflictedItems: [] };
  }

  const conflictedItems = [];

  for (const item of items) {
    const eqId = item.equipment || item._id;
    const requestedQty = Number(item.quantity) || 1;

    const equipment = await Equipment.findById(eqId);
    if (!equipment) continue;

    // Sum all overlapping reservations for this equipment
    let reservedInWindow = 0;
    for (const res of equipment.reservations) {
      if (res.status === 'REJECTED' || res.status === 'RETURNED') continue;
      if (res.date !== date) continue;
      if (excludeEventId && res.event && res.event.toString() === excludeEventId.toString()) continue;

      if (startTime < res.endTime && endTime > res.startTime) {
        reservedInWindow += res.quantity;
      }
    }

    const availableInWindow = equipment.totalQuantity - reservedInWindow;
    if (requestedQty > availableInWindow) {
      conflictedItems.push({
        equipmentId: equipment._id,
        name: equipment.name,
        requested: requestedQty,
        available: Math.max(0, availableInWindow),
        totalStock: equipment.totalQuantity,
      });
    }
  }

  return {
    hasConflict: conflictedItems.length > 0,
    conflictedItems,
  };
};

module.exports = {
  checkVenueConflict,
  checkEquipmentConflict,
};

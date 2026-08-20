const RecruitmentWaitlist = require('../models/RecruitmentWaitlist');
const ClubApplication = require('../models/ClubApplication');
const Club = require('../models/Club');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Promotes the highest-ranked candidate from the recruitment waitlist when a club member position opens up.
 *
 * @param {string} clubId
 * @returns {Promise<Object|null>} Promoted waitlist item
 */
const promoteRecruitmentWaitlist = async (clubId) => {
  const club = await Club.findById(clubId);
  if (!club) return null;

  // Check if club still has room
  if (club.members.length >= club.maxMembers) {
    return null;
  }

  // Find highest priority candidate (lowest rank number = highest priority)
  const candidate = await RecruitmentWaitlist.findOne({
    club: clubId,
    status: 'WAITING',
  })
    .sort({ priorityRank: 1, evaluationScore: -1, createdAt: 1 })
    .populate('applicant', 'name email');

  if (!candidate) return null;

  // Promote candidate
  candidate.status = 'PROMOTED';
  candidate.promotedAt = new Date();
  await candidate.save();

  // Add to club members
  if (!club.members.includes(candidate.applicant._id)) {
    club.members.push(candidate.applicant._id);
    await club.save();
  }

  // Update application status
  await ClubApplication.findByIdAndUpdate(candidate.application, {
    status: 'ACCEPTED',
    decisionNotes: 'Automatically promoted from recruitment waiting list due to open capacity.',
  });

  // Send notification to promoted student
  await createNotification({
    recipient: candidate.applicant._id,
    title: '🎉 Promoted from Club Waiting List!',
    message: `Congratulations! A position opened up in "${club.name}" and you have been promoted to an official Club Member.`,
    type: 'APPLICATION',
    link: `/clubs/${club._id}`,
  });

  return candidate;
};

/**
 * Promotes the next waitlisted event participant when an active registration is cancelled.
 *
 * @param {string} eventId
 * @returns {Promise<Object|null>} Promoted event registration
 */
const promoteEventWaitlist = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) return null;

  // Count active registered participants
  const activeCount = await EventRegistration.countDocuments({
    event: eventId,
    status: 'REGISTERED',
  });

  if (activeCount >= event.capacity) {
    return null;
  }

  // Find next waitlisted participant
  const nextWaitlisted = await EventRegistration.findOne({
    event: eventId,
    status: 'WAITLISTED',
  })
    .sort({ waitlistPosition: 1, registeredAt: 1 })
    .populate('user', 'name email');

  if (!nextWaitlisted) return null;

  // Promote to REGISTERED
  nextWaitlisted.status = 'REGISTERED';
  nextWaitlisted.waitlistPosition = null;
  await nextWaitlisted.save();

  // Update event registered count
  event.registeredCount = activeCount + 1;
  await event.save();

  // Notify the promoted participant
  await createNotification({
    recipient: nextWaitlisted.user._id,
    title: '🎟️ Event Registration Confirmed!',
    message: `A spot opened up for "${event.title}"! You have been automatically promoted from the waitlist to fully Registered.`,
    type: 'EVENT',
    link: `/events/${event._id}`,
  });

  return nextWaitlisted;
};

module.exports = {
  promoteRecruitmentWaitlist,
  promoteEventWaitlist,
};

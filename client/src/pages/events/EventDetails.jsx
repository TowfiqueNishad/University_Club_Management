import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Handshake,
  CheckCircle2,
  XCircle,
  QrCode,
  Sparkles,
  Award,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import MilestoneTracker from '../../components/common/MilestoneTracker';
import Modal from '../../components/common/Modal';
import { QRCodeSVG } from 'qrcode.react';

const EventDetails = () => {
  const { id } = useParams();
  const { user, isLeader, isAdmin, isStudent, isMember } = useAuth();
  const { showToast } = useNotification();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRegistration, setUserRegistration] = useState(null);
  const [clubs, setClubs] = useState([]);

  // Proposal Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Invite Partner Club Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [partnerClubId, setPartnerClubId] = useState('');
  const [collabRole, setCollabRole] = useState('Co-organizer & Logistics partner');
  const [inviting, setInviting] = useState(false);

  // Organizer QR Screen Modal state
  const [showOrganizerQR, setShowOrganizerQR] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchClubsList();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      if (res.data.success) {
        setEvent(res.data.data);
      }

      // Check current user's registration status
      const histRes = await api.get('/attendance/student-history');
      if (histRes.data.success) {
        const found = histRes.data.data.registrations.find(
          (r) => (r.event?._id || r.event) === id
        );
        setUserRegistration(found || null);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubsList = async () => {
    try {
      const res = await api.get('/clubs');
      if (res.data.success) setClubs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
    }
  };

  const handleRegister = async () => {
    try {
      const res = await api.post(`/attendance/events/${id}/register`);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        fetchEventDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Cancel your registration? Next waitlisted student will be promoted.')) return;
    try {
      const res = await api.post(`/attendance/events/${id}/cancel`);
      if (res.data.success) {
        showToast(
          res.data.promotedWaitlistParticipant
            ? `Registration cancelled. Participant (${res.data.promotedWaitlistParticipant.name}) was automatically promoted!`
            : 'Registration cancelled',
          'success'
        );
        fetchEventDetails();
      }
    } catch (err) {
      showToast('Failed to cancel registration', 'error');
    }
  };

  const handleReviewProposal = async (e) => {
    e.preventDefault();
    if (reviewDecision === 'REJECTED' && !rejectionReason) {
      return showToast('Please provide a rejection reason.', 'warning');
    }

    setReviewing(true);
    try {
      const res = await api.put(`/events/${id}/review`, {
        decision: reviewDecision,
        rejectionReason,
      });

      if (res.data.success) {
        showToast(`Event proposal ${reviewDecision.toLowerCase()}!`, 'success');
        setShowReviewModal(false);
        fetchEventDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Review failed', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const handleInvitePartner = async (e) => {
    e.preventDefault();
    if (!partnerClubId) return;

    setInviting(true);
    try {
      const res = await api.post(`/events/${id}/invite-partner`, {
        partnerClubId,
        roleDescription: collabRole,
      });

      if (res.data.success) {
        showToast('Collaboration invite dispatched!', 'success');
        setShowInviteModal(false);
        fetchEventDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to invite club', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMilestone = async (milestoneId, status) => {
    try {
      const res = await api.put(`/events/${id}/milestones/${milestoneId}`, {
        status,
        progressPercentage: status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0,
      });

      if (res.data.success) {
        showToast('Milestone status updated', 'success');
        fetchEventDetails();
      }
    } catch (err) {
      showToast('Failed to update milestone', 'error');
    }
  };

  if (loading || !event) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading event details...</div>;
  }

  const isOrganizer =
    event.club?.lead?._id === user?._id ||
    event.club?.executives?.some((e) => (e._id || e) === user?._id) ||
    isAdmin;

  const isFull = event.registeredCount >= event.capacity;
  const isRegistered = userRegistration && userRegistration.status === 'REGISTERED';
  const isWaitlisted = userRegistration && userRegistration.status === 'WAITLISTED';

  return (
    <div className="space-y-6">
      {/* Event Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="relative h-56 sm:h-72 bg-slate-900 overflow-hidden">
          <img
            src={
              event.banner ||
              'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1000&auto=format&fit=crop&q=80'
            }
            alt=""
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <StatusBadge status={event.status} />
          </div>
          <div className="absolute bottom-4 left-6 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-bold">
            {event.eventType}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={event.club?.logo || 'https://via.placeholder.com/30'}
                  alt=""
                  className="h-6 w-6 rounded-lg object-cover"
                />
                <span className="text-xs font-bold text-slate-600">{event.club?.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{event.title}</h1>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              {/* Proposal Review Action (if SUBMITTED) */}
              {(isLeader || isAdmin) && event.status === 'SUBMITTED' && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
                >
                  <Award className="h-4 w-4" />
                  Review Proposal
                </button>
              )}

              {/* Organizer Actions */}
              {isOrganizer && (
                <>
                  <button
                    onClick={() => setShowOrganizerQR(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <QrCode className="h-4 w-4" />
                    Display Attendance QR
                  </button>

                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Handshake className="h-4 w-4" />
                    Invite Partner Club
                  </button>
                </>
              )}

              {/* Student Registration / Cancel */}
              {isRegistered ? (
                <button
                  onClick={handleCancelRegistration}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                >
                  Cancel My Registration
                </button>
              ) : isWaitlisted ? (
                <button
                  onClick={handleCancelRegistration}
                  className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold"
                >
                  On Waitlist (#{userRegistration.waitlistPosition}) • Leave Waitlist
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                    isFull
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/30'
                  }`}
                >
                  {isFull ? 'Event Full — Join Waitlist' : 'Register for Event'}
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Date & Time</span>
                <p className="font-bold text-slate-900 mt-0.5">{event.date}</p>
                <p className="text-[11px] text-slate-500">{event.startTime} - {event.endTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Venue</span>
                <p className="font-bold text-slate-900 mt-0.5 truncate max-w-[140px]">
                  {event.venue?.name || event.customLocation}
                </p>
                <p className="text-[11px] text-slate-500">{event.venue?.roomNumber || 'Campus'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Capacity</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {event.registeredCount || 0} / {event.capacity}
                </p>
                <p className="text-[11px] text-slate-500">
                  {Math.max(0, event.capacity - (event.registeredCount || 0))} open spots
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Planned Budget</span>
                <p className="font-bold text-slate-900 mt-0.5">${event.budgetPlanned || 1000} USD</p>
                <p className="text-[11px] text-slate-500">${event.budgetSpent || 0} Spent</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="py-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900">Event Overview</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{event.description}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Milestones, Multi-Club Collaborations, and Volunteer Duties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event Milestone Tracker (Module 2 Feature 8) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Preparation Milestones</h3>
              <p className="text-xs text-slate-500">
                Visual progress tracking for venue confirmation, sponsors, logistics & staging
              </p>
            </div>
          </div>

          <MilestoneTracker
            milestones={event.milestones}
            canEdit={isOrganizer}
            onUpdateStatus={handleUpdateMilestone}
          />
        </div>

        {/* Right Column: Multi-Club Collaborations & Volunteers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Multi-Club Collaboration Card (Module 2 Feature 7) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Participating Clubs</h3>
            </div>
            <p className="text-xs text-slate-500">
              Inter-society partnerships and shared responsibilities
            </p>

            <div className="space-y-3">
              {/* Primary Club */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={event.club?.logo || 'https://via.placeholder.com/35'}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                  <div>
                    <h5 className="font-bold text-slate-900">{event.club?.name}</h5>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase">
                      Primary Host
                    </span>
                  </div>
                </div>
              </div>

              {/* Collaborating Partner Clubs */}
              {event.collaboratingClubs?.map((collab, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={collab.club?.logo || 'https://via.placeholder.com/35'}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900">{collab.club?.name}</h5>
                      <p className="text-[10px] text-slate-500">{collab.roleDescription}</p>
                    </div>
                  </div>
                  <StatusBadge status={collab.status} />
                </div>
              ))}

              {(!event.collaboratingClubs || event.collaboratingClubs.length === 0) && (
                <p className="text-xs text-slate-400 italic">No external partner clubs invited yet.</p>
              )}
            </div>
          </div>

          {/* Volunteer Requirements */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Volunteer Requirements</h3>
              <Link to="/volunteers" className="text-xs font-bold text-brand-600 hover:text-brand-800">
                Volunteer Center →
              </Link>
            </div>

            {event.requiredVolunteers && event.requiredVolunteers.length > 0 ? (
              <div className="space-y-2 text-xs">
                {event.requiredVolunteers.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">{v.skill}</span>
                    <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md font-bold">
                      {v.count} Volunteers Needed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific volunteer duties specified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Review Proposal Modal (Approve / Reject with Reason) */}
      {showReviewModal && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Review Event Proposal"
          subtitle={`Proposal: ${event.title}`}
        >
          <form onSubmit={handleReviewProposal} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Decision</label>
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
              >
                <option value="APPROVED">APPROVE (Publish to public campus listings)</option>
                <option value="REJECTED">REJECT (Requires explicit reason)</option>
              </select>
            </div>

            {reviewDecision === 'REJECTED' && (
              <div>
                <label className="block font-bold text-rose-700 uppercase mb-1">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this proposal is rejected (e.g. budgetary limits, scheduling clash)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 focus:bg-white text-sm outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewing}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {reviewing ? 'Saving...' : 'Finalize Proposal Review'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invite Partner Club Modal */}
      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Collaborating University Club"
          subtitle="Co-organize this event with another campus student society"
        >
          <form onSubmit={handleInvitePartner} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Select Partner Club</label>
              <select
                required
                value={partnerClubId}
                onChange={(e) => setPartnerClubId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              >
                <option value="">-- Choose Club --</option>
                {clubs
                  .filter((c) => c._id !== event.club?._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Collaboration Role & Scope
              </label>
              <input
                type="text"
                value={collabRole}
                onChange={(e) => setCollabRole(e.target.value)}
                placeholder="e.g. Media & Photography partner, Hardware track co-host"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting || !partnerClubId}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {inviting ? 'Dispatching...' : 'Send Collaboration Invite'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Organizer Projected Attendance QR Modal */}
      {showOrganizerQR && (
        <Modal
          isOpen={showOrganizerQR}
          onClose={() => setShowOrganizerQR(false)}
          title="Live Event Attendance QR Verification Code"
          subtitle={`Event: ${event.title}`}
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={JSON.stringify({
                  type: 'CAMPUSHUB_EVENT_ATTENDANCE',
                  eventId: event._id,
                  title: event.title,
                  secret: event.qrCodeSecret,
                  date: event.date,
                })}
                size={220}
              />
            </div>

            <div className="text-xs space-y-1">
              <p className="font-extrabold text-sm text-slate-900">{event.title}</p>
              <p className="text-slate-500">
                Secret Token: <strong className="font-mono text-brand-600">{event.qrCodeSecret}</strong>
              </p>
            </div>

            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-brand-900 text-xs font-medium">
              Project this QR code on the auditorium screen or entrance standee for students to scan.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventDetails;

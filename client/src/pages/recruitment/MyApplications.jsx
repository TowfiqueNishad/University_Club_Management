import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CalendarCheck,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const MyApplications = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal state
  const [bookingApp, setBookingApp] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const res = await api.get('/recruitment/my-applications');
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = async (app) => {
    setBookingApp(app);
    try {
      const res = await api.get(`/recruitment/club/${app.club?._id}/interview-slots`);
      if (res.data.success) {
        setAvailableSlots(res.data.data.filter((s) => s.status === 'AVAILABLE'));
      }
    } catch (error) {
      showToast('Failed to load interview slots', 'error');
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlotId || !bookingApp) return;

    setBookingLoading(true);
    try {
      const res = await api.post('/recruitment/book-interview', {
        applicationId: bookingApp._id,
        slotId: selectedSlotId,
      });

      if (res.data.success) {
        showToast('Interview slot confirmed!', 'success', 'Booking Confirmed');
        setBookingApp(null);
        setSelectedSlotId('');
        fetchMyApplications();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Student Recruitment Hub
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">My Submitted Applications</h1>
          <p className="text-xs text-slate-500 font-medium">
            Track evaluation status, schedule interviews, and view admission offers.
          </p>
        </div>

        <Link
          to="/clubs"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all"
        >
          Explore More Clubs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Applications List */}
      {applications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={app.club?.logo || 'https://via.placeholder.com/50'}
                      alt=""
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{app.club?.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{app.club?.category} Society</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {/* Statement preview */}
                <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">Your Statement:</p>
                  <p className="line-clamp-2 italic">"{app.statement}"</p>
                </div>

                {/* Interview Info */}
                {app.interviewSlot ? (
                  <div className="mt-3.5 p-3.5 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-sky-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Calendar className="h-4 w-4 text-sky-600" />
                      Interview Scheduled
                    </div>
                    <p>
                      <strong>Date:</strong> {app.interviewSlot.date} at {app.interviewSlot.startTime} - {app.interviewSlot.endTime}
                    </p>
                    <p className="text-sky-700">
                      <strong>Location:</strong> {app.interviewSlot.location}
                    </p>
                  </div>
                ) : (
                  (app.status === 'PENDING' || app.status === 'ELIGIBLE') && (
                    <div className="mt-3.5 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <span>Ready to choose an interview slot:</span>
                      <button
                        onClick={() => handleOpenBooking(app)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm transition-all"
                      >
                        Book Slot
                      </button>
                    </div>
                  )
                )}

                {/* Evaluation Result if available */}
                {app.evaluationScore !== null && app.evaluationScore !== undefined && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-950 flex items-center justify-between">
                    <span>Interview Score:</span>
                    <strong className="text-sm font-black text-brand-600">{app.evaluationScore} / 100</strong>
                  </div>
                )}

                {app.decisionNotes && (
                  <p className="mt-2 text-xs text-slate-500 italic">
                    Decision notes: {app.decisionNotes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                <Link
                  to={`/clubs/${app.club?._id}`}
                  className="font-bold text-brand-600 hover:underline"
                >
                  View Club →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-3">
          <ClipboardList className="h-10 w-10 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">You haven't submitted any club applications yet.</p>
          <Link
            to="/clubs"
            className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20"
          >
            Explore Clubs Directory
          </Link>
        </div>
      )}

      {/* Book Interview Slot Modal */}
      {bookingApp && (
        <Modal
          isOpen={!!bookingApp}
          onClose={() => setBookingApp(null)}
          title="Select an Interview Slot"
          subtitle={`Available interview sessions for ${bookingApp.club?.name}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
            {availableSlots.length > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <label
                    key={slot._id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedSlotId === slot._id
                        ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value={slot._id}
                        checked={selectedSlotId === slot._id}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="accent-brand-600"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {slot.date} ({slot.startTime} - {slot.endTime})
                        </p>
                        <p className="text-slate-500">{slot.location}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                      Open
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No slots currently available. The club interviewer will open more slots shortly.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedSlotId || bookingLoading}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {bookingLoading ? 'Confirming...' : 'Confirm Slot Booking'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MyApplications;

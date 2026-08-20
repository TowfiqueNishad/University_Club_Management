import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const InterviewCenter = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Slot Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '14:30',
    location: 'Faculty Building Room 402 / Meet',
    maxApplicants: 1,
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      if (res.data.success && res.data.data.length > 0) {
        setClubs(res.data.data);
        const firstId = res.data.data[0]._id;
        setSelectedClubId(firstId);
        loadSlots(firstId);
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (clubId) => {
    try {
      const res = await api.get(`/recruitment/club/${clubId}/interview-slots`);
      if (res.data.success) {
        setSlots(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/recruitment/interview-slots', {
        clubId: selectedClubId,
        ...slotForm,
      });

      if (res.data.success) {
        showToast('Interview slot added to schedule!', 'success');
        setShowCreateModal(false);
        loadSlots(selectedClubId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create slot. Avoid time overlap.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            Recruitment Operations
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Interview Scheduling Center</h1>
          <p className="text-xs text-slate-500 font-medium">
            Publish assessment slots, prevent double-bookings, and coordinate faculty interviewers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {clubs.length > 0 && (
            <select
              value={selectedClubId}
              onChange={(e) => {
                setSelectedClubId(e.target.value);
                loadSlots(e.target.value);
              }}
              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
            >
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <PlusCircle className="h-4 w-4" />
            New Interview Slot
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900">Current Interview Slots Schedule</h3>

        {slots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((slot) => (
              <div
                key={slot._id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900 text-sm">{slot.date}</span>
                    <StatusBadge status={slot.status} />
                  </div>
                  <p className="font-bold text-purple-700">{slot.startTime} - {slot.endTime}</p>
                  <p className="text-slate-600 mt-1">Location: {slot.location}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Interviewer: {slot.interviewer?.name}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
                  <span>Booked: {slot.bookedApplicants?.length || 0} / {slot.maxApplicants}</span>
                  {slot.bookedApplicants?.length > 0 && (
                    <span className="font-bold text-emerald-700">Booked by candidate</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No interview slots created for this club. Click "New Interview Slot" to open time slots.
          </div>
        )}
      </div>

      {/* Create Slot Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Interview Time Slot"
          subtitle="Define date, time, location, and capacity"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
              <input
                type="date"
                required
                value={slotForm.date}
                onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Location / Room / Meet Link</label>
              <input
                type="text"
                value={slotForm.location}
                onChange={(e) => setSlotForm({ ...slotForm, location: e.target.value })}
                placeholder="Faculty Building Room 402 / Meet"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
              >
                Create Slot
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InterviewCenter;

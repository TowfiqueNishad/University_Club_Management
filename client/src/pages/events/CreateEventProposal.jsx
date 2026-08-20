import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Package,
  PlusCircle,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import ConflictAlert from '../../components/common/ConflictAlert';

const EVENT_TYPES = [
  'Workshop',
  'Hackathon',
  'Seminar',
  'Cultural Night',
  'Sports Tournament',
  'Networking',
  'Exhibition',
  'General Meeting',
];

const CreateEventProposal = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'Workshop',
    club: '',
    venue: '',
    customLocation: '',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days ahead
    startTime: '14:00',
    endTime: '17:00',
    capacity: 50,
    budgetPlanned: 1000,
    requiredEquipment: [],
    requiredVolunteers: [
      { skill: 'Event Management', count: 2 },
      { skill: 'Photography', count: 1 },
    ],
    milestones: [
      { title: 'Venue Booking Confirmation', description: 'Confirm venue and AV gear', deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], status: 'NOT_STARTED' },
      { title: 'Promotion & Registration Launch', description: 'Publish registration link', deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'NOT_STARTED' },
    ],
  });

  // Conflict state
  const [conflictState, setConflictState] = useState({
    hasConflict: false,
    venueConflict: null,
    equipmentConflict: null,
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [clubsRes, venuesRes, eqRes] = await Promise.all([
          api.get('/clubs'),
          api.get('/resources/venues'),
          api.get('/resources/equipment'),
        ]);

        if (clubsRes.data.success && clubsRes.data.data.length > 0) {
          setClubs(clubsRes.data.data);
          const firstClub = clubsRes.data.data.find(
            (c) => c.lead?._id === user?._id || c.lead === user?._id
          ) || clubsRes.data.data[0];
          setForm((prev) => ({ ...prev, club: firstClub._id }));
        }

        if (venuesRes.data.success) {
          setVenues(venuesRes.data.data);
          if (venuesRes.data.data.length > 0) {
            setForm((prev) => ({ ...prev, venue: venuesRes.data.data[0]._id }));
          }
        }

        if (eqRes.data.success) setEquipmentList(eqRes.data.data);
      } catch (error) {
        console.error('Failed to load resources:', error);
      }
    };

    fetchResources();
  }, [user]);

  // Run Real-time Conflict Check whenever booking params change
  useEffect(() => {
    const runConflictCheck = async () => {
      if (!form.date || !form.startTime || !form.endTime) return;

      try {
        const res = await api.post('/events/check-conflicts', {
          venue: form.venue,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          requiredEquipment: form.requiredEquipment,
        });

        if (res.data.success) {
          setConflictState({
            hasConflict: res.data.hasConflict,
            venueConflict: res.data.venueConflict,
            equipmentConflict: res.data.equipmentConflict,
          });
        }
      } catch (error) {
        console.error('Conflict checker error:', error);
      }
    };

    const timer = setTimeout(runConflictCheck, 300);
    return () => clearTimeout(timer);
  }, [form.venue, form.date, form.startTime, form.endTime, form.requiredEquipment]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddVolunteerReq = () => {
    setForm((prev) => ({
      ...prev,
      requiredVolunteers: [...prev.requiredVolunteers, { skill: 'Public Speaking', count: 1 }],
    }));
  };

  const handleRemoveVolunteerReq = (index) => {
    setForm((prev) => ({
      ...prev,
      requiredVolunteers: prev.requiredVolunteers.filter((_, i) => i !== index),
    }));
  };

  const handleAddEquipment = (eqId) => {
    if (!eqId) return;
    const exists = form.requiredEquipment.find((item) => item.equipment === eqId);
    if (exists) return;
    setForm((prev) => ({
      ...prev,
      requiredEquipment: [...prev.requiredEquipment, { equipment: eqId, quantity: 1 }],
    }));
  };

  const handleRemoveEquipment = (eqId) => {
    setForm((prev) => ({
      ...prev,
      requiredEquipment: prev.requiredEquipment.filter((item) => item.equipment !== eqId),
    }));
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (conflictState.hasConflict) {
      return showToast(
        'Cannot submit proposal with active venue or equipment scheduling conflicts. Please resolve clashes.',
        'error'
      );
    }

    setSubmitting(true);
    try {
      const res = await api.post('/events', {
        ...form,
        capacity: Number(form.capacity),
        budgetPlanned: Number(form.budgetPlanned),
        submitForReview: true,
      });

      if (res.data.success) {
        showToast('Event proposal submitted for governance review!', 'success', 'Proposal Created');
        navigate(`/events/${res.data.data._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Proposal submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Back to Events Catalog
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-card">
        <div className="mb-6">
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Event Planning Studio
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Create Event Proposal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit an official event plan with automated collision checks on venue booking and equipment inventory.
          </p>
        </div>

        {/* Live Conflict Warning Banner */}
        <ConflictAlert
          venueConflict={conflictState.venueConflict}
          equipmentConflict={conflictState.equipmentConflict}
        />

        <form onSubmit={handleSubmitProposal} className="space-y-6 text-xs">
          {/* General Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              1. General Event Information
            </h3>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Event Title *</label>
              <input
                type="text"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Annual Campus AI Hackathon 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-semibold focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Host Club *</label>
                <select
                  name="club"
                  value={form.club}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-medium"
                >
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Event Format *</label>
                <select
                  name="eventType"
                  value={form.eventType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-medium"
                >
                  {EVENT_TYPES.filter((t) => t !== 'ALL').map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Event Description & Schedule *</label>
              <textarea
                rows={3}
                name="description"
                required
                value={form.description}
                onChange={handleChange}
                placeholder="Keynote presentations, coding challenges, mentor hours..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Schedule & Venue */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              2. Venue & Scheduling (Conflict Checked)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Campus Venue</label>
                <select
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-medium"
                >
                  <option value="">-- None / Custom Location --</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.building} - Cap: {v.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Custom Location Name</label>
                <input
                  type="text"
                  name="customLocation"
                  value={form.customLocation}
                  onChange={handleChange}
                  placeholder="Main Campus Grounds / Virtual Meet"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Participant Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  min={5}
                  value={form.capacity}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Planned Budget (USD) *</label>
                <input
                  type="number"
                  name="budgetPlanned"
                  min={0}
                  value={form.budgetPlanned}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Equipment Reservation */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                3. Equipment Allocation (Stock Collision Checked)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                id="eqPicker"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium outline-none"
                defaultValue=""
                onChange={(e) => {
                  handleAddEquipment(e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="" disabled>+ Add Equipment (Cameras, Projectors, Mics, Speakers)...</option>
                {equipmentList.map((eq) => (
                  <option key={eq._id} value={eq._id}>
                    {eq.name} ({eq.category} - Total stock: {eq.totalQuantity})
                  </option>
                ))}
              </select>
            </div>

            {form.requiredEquipment.length > 0 && (
              <div className="space-y-2">
                {form.requiredEquipment.map((item, idx) => {
                  const eqDoc = equipmentList.find((e) => e._id === item.equipment);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">{eqDoc?.name || 'Equipment'}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-slate-600">
                          Qty:
                          <input
                            type="number"
                            min={1}
                            max={eqDoc?.totalQuantity || 10}
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                requiredEquipment: prev.requiredEquipment.map((req, i) =>
                                  i === idx ? { ...req, quantity: qty } : req
                                ),
                              }));
                            }}
                            className="w-16 p-1 rounded-lg border border-slate-300 bg-white text-center font-bold"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(item.equipment)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Volunteer Requirements */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                4. Volunteer Crew Requirements
              </h3>
              <button
                type="button"
                onClick={handleAddVolunteerReq}
                className="text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Volunteer Skill
              </button>
            </div>

            <div className="space-y-2">
              {form.requiredVolunteers.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <select
                    value={v.skill}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        requiredVolunteers: prev.requiredVolunteers.map((item, i) =>
                          i === idx ? { ...item, skill: val } : item
                        ),
                      }));
                    }}
                    className="flex-1 p-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Event Management">Event Management</option>
                    <option value="Photography">Photography</option>
                    <option value="Video Editing">Video Editing</option>
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="Public Speaking">Public Speaking</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Social Media">Social Media</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Volunteers Needed:</span>
                    <input
                      type="number"
                      min={1}
                      value={v.count}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        setForm((prev) => ({
                          ...prev,
                          requiredVolunteers: prev.requiredVolunteers.map((item, i) =>
                            i === idx ? { ...item, count } : item
                          ),
                        }));
                      }}
                      className="w-16 p-1 rounded-lg border border-slate-200 bg-white text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVolunteerReq(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to="/events"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || conflictState.hasConflict}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 text-xs"
            >
              {submitting ? 'Validating & Submitting...' : 'Submit Event Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventProposal;

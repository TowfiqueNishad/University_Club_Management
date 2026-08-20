import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Package,
  PlusCircle,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Box,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const ResourceManager = () => {
  const { user, isAdmin, isLeader } = useAuth();
  const { showToast } = useNotification();
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [activeTab, setActiveTab] = useState('venues'); // 'venues', 'equipment'
  const [loading, setLoading] = useState(true);

  // Reserve Venue Modal
  const [reserveVenueTarget, setReserveVenueTarget] = useState(null);
  const [venueForm, setVenueForm] = useState({
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    purpose: '',
  });

  // Reserve Equipment Modal
  const [reserveEqTarget, setReserveEqTarget] = useState(null);
  const [eqForm, setEqForm] = useState({
    quantity: 1,
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '14:00',
    purpose: '',
  });

  // Add Venue / Equipment Modals (Admin only)
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [newVenueForm, setNewVenueForm] = useState({
    name: '',
    building: '',
    roomNumber: '',
    capacity: 100,
    facilities: 'Projector, Air Conditioning, WiFi, Surround Sound',
  });

  const [showAddEqModal, setShowAddEqModal] = useState(false);
  const [newEqForm, setNewEqForm] = useState({
    name: '',
    category: 'Audio/Visual',
    totalQuantity: 5,
    location: 'Resource Center Locker #1',
    condition: 'EXCELLENT',
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const [vRes, eRes] = await Promise.all([
        api.get('/resources/venues'),
        api.get('/resources/equipment'),
      ]);

      if (vRes.data.success) setVenues(vRes.data.data);
      if (eRes.data.success) setEquipment(eRes.data.data);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveVenueSubmit = async (e) => {
    e.preventDefault();
    if (!reserveVenueTarget) return;

    try {
      const res = await api.post(`/resources/venues/${reserveVenueTarget._id}/reserve`, venueForm);
      if (res.data.success) {
        showToast('Venue reservation confirmed!', 'success');
        setReserveVenueTarget(null);
        fetchResources();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Venue clash detected', 'error');
    }
  };

  const handleReserveEquipmentSubmit = async (e) => {
    e.preventDefault();
    if (!reserveEqTarget) return;

    try {
      const res = await api.post(`/resources/equipment/${reserveEqTarget._id}/reserve`, eqForm);
      if (res.data.success) {
        showToast('Equipment reservation approved!', 'success');
        setReserveEqTarget(null);
        fetchResources();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Equipment conflict detected', 'error');
    }
  };

  const handleAddVenueSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/resources/venues', {
        ...newVenueForm,
        facilities: newVenueForm.facilities.split(',').map((f) => f.trim()),
      });
      if (res.data.success) {
        showToast('New venue registered', 'success');
        setShowAddVenueModal(false);
        fetchResources();
      }
    } catch (err) {
      showToast('Failed to register venue', 'error');
    }
  };

  const handleAddEquipmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/resources/equipment', newEqForm);
      if (res.data.success) {
        showToast('Equipment added to catalog', 'success');
        setShowAddEqModal(false);
        fetchResources();
      }
    } catch (err) {
      showToast('Failed to add equipment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Resource Logistics & Assets
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Campus Venues & Equipment Registry</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage university auditoriums, conference rooms, AV kits, and reserve gear with automated clash checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && activeTab === 'venues' && (
            <button
              onClick={() => setShowAddVenueModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> Add Venue
            </button>
          )}

          {isAdmin && activeTab === 'equipment' && (
            <button
              onClick={() => setShowAddEqModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('venues')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'venues'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Venues & Auditoriums ({venues.length})
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'equipment'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Equipment Catalog ({equipment.length})
        </button>
      </div>

      {/* Tab 1: Venues */}
      {activeTab === 'venues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="h-36 bg-slate-900 overflow-hidden relative">
                  <img
                    src={
                      venue.image ||
                      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'
                    }
                    alt={venue.name}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[11px] font-bold">
                    Capacity: {venue.capacity}
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    {venue.building}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{venue.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{venue.roomNumber}</p>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{venue.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {venue.facilities?.slice(0, 4).map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Reservations preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Active Bookings: <strong>{venue.reservations?.length || 0} scheduled</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => setReserveVenueTarget(venue)}
                  className="w-full py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-all"
                >
                  Reserve Venue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Equipment */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-brand-50 text-brand-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.condition}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{item.category}</span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.location}</p>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex justify-between">
                  <span className="text-slate-500">Stock Inventory:</span>
                  <strong className="text-slate-900">{item.totalQuantity} Units Available</strong>
                </div>
              </div>

              <button
                onClick={() => setReserveEqTarget(item)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm"
              >
                Request Equipment Reservation
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reserve Venue Modal */}
      {reserveVenueTarget && (
        <Modal
          isOpen={!!reserveVenueTarget}
          onClose={() => setReserveVenueTarget(null)}
          title={`Reserve Venue: ${reserveVenueTarget.name}`}
          subtitle={`Capacity: ${reserveVenueTarget.capacity} • Room: ${reserveVenueTarget.roomNumber}`}
        >
          <form onSubmit={handleReserveVenueSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Reservation Date *</label>
              <input
                type="date"
                required
                value={venueForm.date}
                onChange={(e) => setVenueForm({ ...venueForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={venueForm.startTime}
                  onChange={(e) => setVenueForm({ ...venueForm, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={venueForm.endTime}
                  onChange={(e) => setVenueForm({ ...venueForm, endTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Event / Meeting Purpose *</label>
              <textarea
                rows={2}
                required
                value={venueForm.purpose}
                onChange={(e) => setVenueForm({ ...venueForm, purpose: e.target.value })}
                placeholder="Club general assembly, workshop rehearsals..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReserveVenueTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Confirm Venue Booking
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reserve Equipment Modal */}
      {reserveEqTarget && (
        <Modal
          isOpen={!!reserveEqTarget}
          onClose={() => setReserveEqTarget(null)}
          title={`Reserve Gear: ${reserveEqTarget.name}`}
          subtitle={`Available Stock: ${reserveEqTarget.totalQuantity} Units`}
        >
          <form onSubmit={handleReserveEquipmentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Requested Quantity *</label>
              <input
                type="number"
                min={1}
                max={reserveEqTarget.totalQuantity}
                required
                value={eqForm.quantity}
                onChange={(e) => setEqForm({ ...eqForm, quantity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
              <input
                type="date"
                required
                value={eqForm.date}
                onChange={(e) => setEqForm({ ...eqForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={eqForm.startTime}
                  onChange={(e) => setEqForm({ ...eqForm, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={eqForm.endTime}
                  onChange={(e) => setEqForm({ ...eqForm, endTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Usage Purpose *</label>
              <input
                type="text"
                required
                value={eqForm.purpose}
                onChange={(e) => setEqForm({ ...eqForm, purpose: e.target.value })}
                placeholder="Keynote recording, presentation display..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReserveEqTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Confirm Gear Allocation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Venue Modal (Admin) */}
      {showAddVenueModal && (
        <Modal
          isOpen={showAddVenueModal}
          onClose={() => setShowAddVenueModal(false)}
          title="Register University Venue"
          subtitle="Add auditorium or laboratory to campus registry"
        >
          <form onSubmit={handleAddVenueSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Venue Name *</label>
              <input
                type="text"
                required
                value={newVenueForm.name}
                onChange={(e) => setNewVenueForm({ ...newVenueForm, name: e.target.value })}
                placeholder="e.g. Science Complex Lecture Hall 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Building *</label>
                <input
                  type="text"
                  required
                  value={newVenueForm.building}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, building: e.target.value })}
                  placeholder="Block B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={newVenueForm.roomNumber}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, roomNumber: e.target.value })}
                  placeholder="B-302"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Capacity *</label>
              <input
                type="number"
                min={10}
                required
                value={newVenueForm.capacity}
                onChange={(e) => setNewVenueForm({ ...newVenueForm, capacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Facilities (comma separated)</label>
              <input
                type="text"
                value={newVenueForm.facilities}
                onChange={(e) => setNewVenueForm({ ...newVenueForm, facilities: e.target.value })}
                placeholder="Projector, Air Conditioning, WiFi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVenueModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                Register Venue
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Equipment Modal (Admin) */}
      {showAddEqModal && (
        <Modal
          isOpen={showAddEqModal}
          onClose={() => setShowAddEqModal(false)}
          title="Add Gear to Equipment Catalog"
          subtitle="Manage AV and staging gear"
        >
          <form onSubmit={handleAddEquipmentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                value={newEqForm.name}
                onChange={(e) => setNewEqForm({ ...newEqForm, name: e.target.value })}
                placeholder="e.g. Blackmagic Pocket Cinema 6K"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                <select
                  value={newEqForm.category}
                  onChange={(e) => setNewEqForm({ ...newEqForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                >
                  <option value="Audio/Visual">Audio/Visual</option>
                  <option value="Camera & Video">Camera & Video</option>
                  <option value="Computing">Computing</option>
                  <option value="Staging & Lighting">Staging & Lighting</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Total Quantity *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newEqForm.totalQuantity}
                  onChange={(e) => setNewEqForm({ ...newEqForm, totalQuantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Storage Location *</label>
              <input
                type="text"
                required
                value={newEqForm.location}
                onChange={(e) => setNewEqForm({ ...newEqForm, location: e.target.value })}
                placeholder="Tech Locker 102"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEqModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                Add Equipment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ResourceManager;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  Shield,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const CATEGORIES = [
  'ALL',
  'Technology',
  'Robotics',
  'Arts & Media',
  'Business',
  'Community Service',
  'Sports',
  'Cultural',
  'Academic',
];

const ClubsList = () => {
  const { user, isLeader, isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Create Club Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    category: 'Technology',
    description: '',
    logo: '',
    banner: '',
    maxMembers: 50,
    minCgpa: 2.5,
    minSemester: 1,
    minCredits: 0,
    budget: 5000,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, [selectedCategory]);

  const fetchClubs = async () => {
    try {
      let url = `/clubs?category=${selectedCategory}`;
      const res = await api.get(url);
      if (res.data.success) {
        setClubs(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/clubs', {
        name: createForm.name,
        code: createForm.code || createForm.name.substring(0, 4).toUpperCase(),
        category: createForm.category,
        description: createForm.description,
        logo: createForm.logo || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80`,
        banner: createForm.banner || `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80`,
        maxMembers: Number(createForm.maxMembers),
        eligibilityRequirements: {
          minCgpa: Number(createForm.minCgpa),
          minSemester: Number(createForm.minSemester),
          minCredits: Number(createForm.minCredits),
          allowedDepartments: [],
        },
        budget: { allocated: Number(createForm.budget), spent: 0, currency: 'USD' },
      });

      if (res.data.success) {
        showToast('Club registered successfully!', 'success', 'Club Created');
        setShowCreateModal(false);
        fetchClubs();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create club', 'error');
    } finally {
      setCreating(false);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.code.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Campus Hub Directory
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">University Clubs & Societies</h1>
          <p className="text-xs text-slate-500 font-medium">
            Explore active organizations, check admission eligibility, and apply for recruitments.
          </p>
        </div>

        {(isAdmin || isLeader) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Club
          </button>
        )}
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clubs by name, code, or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Cards Grid */}
      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => {
            const isRecruiting = club.status === 'RECRUITING';
            const memberCount = club.members?.length || 0;
            const isFull = memberCount >= club.maxMembers;

            return (
              <div
                key={club._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Card Banner Header */}
                <div className="relative h-32 bg-slate-800 overflow-hidden">
                  <img
                    src={club.banner || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <StatusBadge status={club.status} />
                  </div>
                </div>

                {/* Logo & Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-end justify-between -mt-11 mb-3">
                      <img
                        src={club.logo || 'https://via.placeholder.com/80'}
                        alt={club.name}
                        className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                      />
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {club.code}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{club.category}</p>

                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {club.description}
                    </p>

                    {/* Eligibility Snapshot */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Min CGPA:</span>
                        <strong className="text-slate-800">
                          {club.eligibilityRequirements?.minCgpa || 2.5}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Members:</span>
                        <strong className="text-slate-800">
                          {memberCount} / {club.maxMembers || 50}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      Lead: <strong>{club.lead?.name || 'Faculty'}</strong>
                    </div>

                    <Link
                      to={`/clubs/${club._id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      View & Apply <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          No clubs found matching your query.
        </div>
      )}

      {/* Create Club Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Register New University Club"
          subtitle="Define club category, executive limits, and recruitment eligibility thresholds"
        >
          <form onSubmit={handleCreateClub} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Club Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence Guild"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Club Code / Slug *</label>
                <input
                  type="text"
                  required
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AIG"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm uppercase font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-medium"
                >
                  {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Max Member Capacity</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={createForm.maxMembers}
                  onChange={(e) => setCreateForm({ ...createForm, maxMembers: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Club Description *</label>
              <textarea
                rows={3}
                required
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Mission statement and primary campus activities..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            {/* Eligibility Config */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="font-bold text-brand-600 uppercase text-[11px]">
                Recruitment Eligibility Config
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Min CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.minCgpa}
                    onChange={(e) => setCreateForm({ ...createForm, minCgpa: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Min Semester</label>
                  <input
                    type="number"
                    value={createForm.minSemester}
                    onChange={(e) => setCreateForm({ ...createForm, minSemester: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Min Credits</label>
                  <input
                    type="number"
                    value={createForm.minCredits}
                    onChange={(e) => setCreateForm({ ...createForm, minCredits: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-xs"
                  />
                </div>
              </div>
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
                disabled={creating}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Register Club'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ClubsList;

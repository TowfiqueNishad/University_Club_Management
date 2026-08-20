import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decision Modal state
  const [decisionModalApp, setDecisionModalApp] = useState(null);
  const [decision, setDecision] = useState('ACCEPTED');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    const fetchLeaderData = async () => {
      try {
        const clubsRes = await api.get('/clubs');
        if (clubsRes.data.success) {
          setClubs(clubsRes.data.data);
          // Pick club led by current user or first club
          const ledClub = clubsRes.data.data.find(
            (c) => c.lead?._id === user?._id || c.lead === user?._id
          ) || clubsRes.data.data[0];

          if (ledClub) {
            setSelectedClub(ledClub);
            loadClubDetails(ledClub._id);
          }
        }
      } catch (error) {
        console.error('Failed to load leader dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderData();
  }, [user]);

  const loadClubDetails = async (clubId) => {
    try {
      const [appsRes, eventsRes, budgetRes] = await Promise.all([
        api.get(`/recruitment/club/${clubId}/applications`),
        api.get(`/events?clubId=${clubId}`),
        api.get(`/finance/club/${clubId}/summary`),
      ]);

      if (appsRes.data.success) setApplications(appsRes.data.data);
      if (eventsRes.data.success) setEvents(eventsRes.data.data);
      if (budgetRes.data.success) setBudgetSummary(budgetRes.data.data);
    } catch (error) {
      console.error('Failed to fetch club metrics:', error);
    }
  };

  const handleClubChange = (clubId) => {
    const club = clubs.find((c) => c._id === clubId);
    if (club) {
      setSelectedClub(club);
      loadClubDetails(clubId);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionModalApp) return;

    setSubmittingDecision(true);
    try {
      const res = await api.put(`/recruitment/application/${decisionModalApp._id}/decision`, {
        decision,
        notes: decisionNotes,
      });

      if (res.data.success) {
        showToast(res.data.message || 'Application updated', 'success');
        setDecisionModalApp(null);
        setDecisionNotes('');
        if (selectedClub) loadClubDetails(selectedClub._id);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Decision failed', 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const pendingApps = applications.filter(
    (a) => a.status === 'PENDING' || a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEWED'
  );

  return (
    <div className="space-y-6">
      {/* Top Club Switcher & Action Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={selectedClub?.logo || 'https://via.placeholder.com/60'}
            alt=""
            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100"
          />
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Club Executive Station
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl font-extrabold text-slate-900">{selectedClub?.name || 'Club'}</h1>
              <span className="text-xs text-slate-400 font-mono">({selectedClub?.code})</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{selectedClub?.category} • Lead: {user?.name}</p>
          </div>
        </div>

        {/* Switch Club Select (if leader manages multiple or admin viewing) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {clubs.length > 1 && (
            <select
              value={selectedClub?._id || ''}
              onChange={(e) => handleClubChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
            >
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <Link
            to="/events/create"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <PlusCircle className="h-4 w-4" />
            New Event Proposal
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Members / Capacity"
          value={`${selectedClub?.members?.length || 0} / ${selectedClub?.maxMembers || 50}`}
          subtitle={`${Math.max(0, (selectedClub?.maxMembers || 50) - (selectedClub?.members?.length || 0))} open spots`}
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Pending Applications"
          value={pendingApps.length}
          subtitle="Applicants awaiting evaluation"
          icon={UserCheck}
          color={pendingApps.length > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Organized Events"
          value={events.length}
          subtitle={`${events.filter((e) => e.status === 'PUBLISHED').length} Published`}
          icon={Calendar}
          color="sky"
        />
        <MetricCard
          title="Budget Spent"
          value={`$${budgetSummary?.totalSpent || 0} / $${budgetSummary?.totalAllocated || 5000}`}
          subtitle={`${budgetSummary?.remaining || 0} USD remaining`}
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Main Grid: Pending Applications & Active Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applicant Evaluation Queue */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recruitment Review Queue</h3>
              <p className="text-xs text-slate-500">Review, score, and finalize candidate status</p>
            </div>
            <Link to="/recruitment/manage" className="text-xs font-bold text-brand-600 hover:text-brand-800">
              Recruitment Desk →
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Applicant</th>
                    <th className="py-2.5 px-3">CGPA / Dept</th>
                    <th className="py-2.5 px-3">Interview Score</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{app.applicant?.name}</div>
                        <div className="text-[10px] text-slate-400">{app.applicant?.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800">{app.applicant?.cgpa?.toFixed(2)}</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {app.applicant?.department}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {app.evaluationScore !== null && app.evaluationScore !== undefined ? (
                          <span className="font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                            {app.evaluationScore} / 100
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not scored</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setDecisionModalApp(app);
                            setDecision(app.status === 'ACCEPTED' ? 'ACCEPTED' : 'ACCEPTED');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-bold shadow-sm transition-all"
                        >
                          Decide
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No applications submitted yet for this recruitment cycle.
            </div>
          )}
        </div>

        {/* Right Column: Events & Milestones Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Active Club Events</h3>
              <Link to="/events" className="text-xs font-bold text-brand-600 hover:text-brand-800">
                All Events →
              </Link>
            </div>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 3).map((evt) => (
                  <div key={evt._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-900">{evt.title}</h5>
                        <p className="text-slate-500 mt-0.5">
                          {evt.date} • {evt.startTime} - {evt.endTime}
                        </p>
                      </div>
                      <StatusBadge status={evt.status} />
                    </div>

                    {/* Milestone bar */}
                    {evt.milestones && evt.milestones.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Milestones Progress</span>
                          <span>
                            {evt.milestones.filter((m) => m.status === 'COMPLETED').length} / {evt.milestones.length}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.round(
                                (evt.milestones.filter((m) => m.status === 'COMPLETED').length / evt.milestones.length) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No events currently scheduled.
              </div>
            )}
          </div>

          {/* Quick Recruitment Eligibility Criteria Preview */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl">
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-brand-300 mb-3">
              Recruitment Rules Engine
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span>Minimum CGPA Requirement:</span>
                <strong className="text-white">{selectedClub?.eligibilityRequirements?.minCgpa || 2.5}</strong>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span>Minimum Semester:</span>
                <strong className="text-white">Semester {selectedClub?.eligibilityRequirements?.minSemester || 1}</strong>
              </div>
              <div className="flex justify-between">
                <span>Department Filter:</span>
                <strong className="text-white truncate max-w-[150px]">
                  {selectedClub?.eligibilityRequirements?.allowedDepartments?.length > 0
                    ? selectedClub.eligibilityRequirements.allowedDepartments.join(', ')
                    : 'Open to All'}
                </strong>
              </div>
            </div>
            <Link
              to={`/clubs/${selectedClub?._id}`}
              className="mt-4 block text-center py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all"
            >
              Configure Club Rules
            </Link>
          </div>
        </div>
      </div>

      {/* Final Decision Modal */}
      {decisionModalApp && (
        <Modal
          isOpen={!!decisionModalApp}
          onClose={() => setDecisionModalApp(null)}
          title="Candidate Recruitment Decision"
          subtitle={`Applicant: ${decisionModalApp.applicant?.name} (${decisionModalApp.applicant?.studentId})`}
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">CGPA:</span>{' '}
                  <strong>{decisionModalApp.applicant?.cgpa?.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Department:</span>{' '}
                  <strong>{decisionModalApp.applicant?.department}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Interview Score:</span>{' '}
                  <strong>{decisionModalApp.evaluationScore || 'N/A'} / 100</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Applied Date:</span>{' '}
                  {new Date(decisionModalApp.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Decision Action</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACCEPTED">ACCEPT (Add to Club Members / Waitlist if full)</option>
                <option value="WAITLISTED">WAITLIST (Queue in priority waiting list)</option>
                <option value="REJECTED">REJECT</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Decision Notes & Feedback</label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Candidate demonstrated exceptional technical foundations..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModalApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDecision}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {submittingDecision ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LeaderDashboard;

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const ApplicationManagement = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [applications, setApplications] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications', 'rankings', 'waitlist'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [decisionApp, setDecisionApp] = useState(null);
  const [decision, setDecision] = useState('ACCEPTED');
  const [decisionNotes, setDecisionNotes] = useState('');

  // Rubric Score Modal
  const [scoringApp, setScoringApp] = useState(null);
  const [scores, setScores] = useState({
    communication: 18,
    technicalKnowledge: 18,
    leadership: 18,
    creativity: 18,
    problemSolving: 18,
  });
  const [recommendation, setRecommendation] = useState('ACCEPT');
  const [comments, setComments] = useState('');

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
        loadClubRecruitmentData(firstId);
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClubRecruitmentData = async (clubId) => {
    try {
      const [appsRes, waitlistRes, rankingsRes] = await Promise.all([
        api.get(`/recruitment/club/${clubId}/applications`),
        api.get(`/recruitment/club/${clubId}/waitlist`),
        api.get(`/recruitment/club/${clubId}/rankings`),
      ]);

      if (appsRes.data.success) setApplications(appsRes.data.data);
      if (waitlistRes.data.success) setWaitlist(waitlistRes.data.data);
      if (rankingsRes.data.success) setRankings(rankingsRes.data.data);
    } catch (error) {
      console.error('Failed to load recruitment data:', error);
    }
  };

  const handleClubChange = (clubId) => {
    setSelectedClubId(clubId);
    loadClubRecruitmentData(clubId);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionApp) return;

    try {
      const res = await api.put(`/recruitment/application/${decisionApp._id}/decision`, {
        decision,
        notes: decisionNotes,
      });

      if (res.data.success) {
        showToast(res.data.message || 'Decision saved', 'success');
        setDecisionApp(null);
        setDecisionNotes('');
        loadClubRecruitmentData(selectedClubId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit decision', 'error');
    }
  };

  const handleScoringSubmit = async (e) => {
    e.preventDefault();
    if (!scoringApp) return;

    try {
      const res = await api.post('/recruitment/evaluate', {
        applicationId: scoringApp._id,
        ...scores,
        recommendation,
        comments,
      });

      if (res.data.success) {
        showToast('Evaluation scores recorded!', 'success');
        setScoringApp(null);
        loadClubRecruitmentData(selectedClubId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to score candidate', 'error');
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && app.applicant?.department !== deptFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        app.applicant?.name?.toLowerCase().includes(s) ||
        app.applicant?.email?.toLowerCase().includes(s) ||
        app.applicant?.studentId?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Recruitment Command Desk
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Applicant Evaluation & Waitlist Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Review submitted applications, score candidates across 5 rubrics, and manage priority waiting lists.
          </p>
        </div>

        {/* Club Select */}
        {clubs.length > 0 && (
          <select
            value={selectedClubId}
            onChange={(e) => handleClubChange(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            {clubs.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'applications'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rankings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Candidate Rankings ({rankings.length})
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'waitlist'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Recruitment Waiting List ({waitlist.length})
        </button>
      </div>

      {/* Tab 1: All Applications */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="WAITLISTED">Waitlisted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Academic Specs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Rubric Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApps.length > 0 ? (
                  filteredApps.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.applicant?.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {app.applicant?.studentId} • {app.applicant?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">
                          CGPA {app.applicant?.cgpa?.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-slate-400">{app.applicant?.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-4">
                        {app.evaluationScore !== null && app.evaluationScore !== undefined ? (
                          <span className="font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                            {app.evaluationScore} / 100
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not scored</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setScoringApp(app);
                            setScores({
                              communication: 18,
                              technicalKnowledge: 18,
                              leadership: 18,
                              creativity: 18,
                              problemSolving: 18,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] border border-purple-200 transition-all"
                        >
                          Score
                        </button>
                        <button
                          onClick={() => {
                            setDecisionApp(app);
                            setDecision('ACCEPTED');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-[11px] shadow-sm transition-all"
                        >
                          Decide
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rankings */}
      {activeTab === 'rankings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Applicant Rankings Leaderboard</h3>
            <p className="text-xs text-slate-500">
              Sorted by total evaluation score across all 5 assessment rubrics.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Total Score</th>
                  <th className="py-3 px-4">Average</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4">Interviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rankings.map((r, idx) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : idx === 2 ? 'bg-amber-50 text-amber-900' : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.applicant?.name}</div>
                      <div className="text-[10px] text-slate-400">{r.applicant?.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                        {r.totalScore} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{r.averageScore} / 20</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {r.recommendation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.interviewer?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Recruitment Waiting List */}
      {activeTab === 'waitlist' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
            <h4 className="font-bold">Automated Priority Waiting List System</h4>
            <p className="mt-0.5">
              When a club reaches maximum capacity, successful candidates enter this prioritized queue. When an active member leaves, the #1 candidate is automatically promoted and notified.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Priority Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Evaluation Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Queued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {waitlist.length > 0 ? (
                  waitlist.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-black text-purple-700">
                        Priority #{w.priorityRank}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{w.applicant?.name}</div>
                        <div className="text-[10px] text-slate-400">{w.applicant?.department}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-600">
                        {w.evaluationScore} / 100
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No candidates currently on the recruitment waiting list.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionApp && (
        <Modal
          isOpen={!!decisionApp}
          onClose={() => setDecisionApp(null)}
          title="Recruitment Admission Decision"
          subtitle={`Candidate: ${decisionApp.applicant?.name} (${decisionApp.applicant?.studentId})`}
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Decision</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
              >
                <option value="ACCEPTED">ACCEPT (Add as Member / Auto-Waitlist if full)</option>
                <option value="WAITLISTED">WAITLIST (Queue in priority waiting list)</option>
                <option value="REJECTED">REJECT</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Decision Notes</label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Feedback on candidate..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Save Decision
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rubric Scoring Modal */}
      {scoringApp && (
        <Modal
          isOpen={!!scoringApp}
          onClose={() => setScoringApp(null)}
          title="Score Candidate on 5 Rubric Criteria"
          subtitle={`Applicant: ${scoringApp.applicant?.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleScoringSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>1. Communication</span>
                  <span className="text-purple-600">{scores.communication} / 20</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={scores.communication}
                  onChange={(e) => setScores({ ...scores, communication: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>2. Technical Knowledge</span>
                  <span className="text-purple-600">{scores.technicalKnowledge} / 20</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={scores.technicalKnowledge}
                  onChange={(e) => setScores({ ...scores, technicalKnowledge: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>3. Leadership</span>
                  <span className="text-purple-600">{scores.leadership} / 20</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={scores.leadership}
                  onChange={(e) => setScores({ ...scores, leadership: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>4. Creativity</span>
                  <span className="text-purple-600">{scores.creativity} / 20</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={scores.creativity}
                  onChange={(e) => setScores({ ...scores, creativity: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>5. Problem Solving</span>
                  <span className="text-purple-600">{scores.problemSolving} / 20</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={scores.problemSolving}
                  onChange={(e) => setScores({ ...scores, problemSolving: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 flex justify-between items-center">
              <span className="font-bold text-purple-900 uppercase">Calculated Total Score:</span>
              <strong className="text-xl font-black text-purple-950">
                {scores.communication + scores.technicalKnowledge + scores.leadership + scores.creativity + scores.problemSolving} / 100
              </strong>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScoringApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
              >
                Save Evaluation Score
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ApplicationManagement;

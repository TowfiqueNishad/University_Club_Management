import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const InterviewerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [applications, setApplications] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rubric Evaluation Modal state
  const [evalApp, setEvalApp] = useState(null);
  const [scores, setScores] = useState({
    communication: 18,
    technicalKnowledge: 18,
    leadership: 18,
    creativity: 18,
    problemSolving: 18,
  });
  const [recommendation, setRecommendation] = useState('STRONG_ACCEPT');
  const [comments, setComments] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubsRes = await api.get('/clubs');
        if (clubsRes.data.success && clubsRes.data.data.length > 0) {
          setClubs(clubsRes.data.data);
          const firstClubId = clubsRes.data.data[0]._id;
          setSelectedClubId(firstClubId);
          loadClubInterviews(firstClubId);
        }
      } catch (error) {
        console.error('Failed to load interviewer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const loadClubInterviews = async (clubId) => {
    try {
      const [appsRes, slotsRes] = await Promise.all([
        api.get(`/recruitment/club/${clubId}/applications`),
        api.get(`/recruitment/club/${clubId}/interview-slots`),
      ]);

      if (appsRes.data.success) setApplications(appsRes.data.data);
      if (slotsRes.data.success) setSlots(slotsRes.data.data);
    } catch (error) {
      console.error('Failed to load interview records:', error);
    }
  };

  const handleScoreChange = (criterion, val) => {
    const num = Math.min(20, Math.max(0, Number(val) || 0));
    setScores((prev) => ({ ...prev, [criterion]: num }));
  };

  const totalScore =
    scores.communication +
    scores.technicalKnowledge +
    scores.leadership +
    scores.creativity +
    scores.problemSolving;

  const averageScore = (totalScore / 5).toFixed(1);

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!evalApp) return;

    setSubmittingEval(true);
    try {
      const res = await api.post('/recruitment/evaluate', {
        applicationId: evalApp._id,
        ...scores,
        recommendation,
        comments,
      });

      if (res.data.success) {
        showToast('Evaluation submitted successfully!', 'success', 'Candidate Scored');
        setEvalApp(null);
        if (selectedClubId) loadClubInterviews(selectedClubId);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit evaluation', 'error');
    } finally {
      setSubmittingEval(false);
    }
  };

  const scheduledApps = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED');
  const completedEvals = applications.filter((a) => a.status === 'INTERVIEWED' || a.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700 border border-purple-200 shadow-sm">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Interviewer Console
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Recruitment Evaluation & Assessment Desk
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Examiner: {user?.name} ({user?.department})
            </p>
          </div>
        </div>

        {/* Club Filter */}
        {clubs.length > 0 && (
          <select
            value={selectedClubId}
            onChange={(e) => {
              setSelectedClubId(e.target.value);
              loadClubInterviews(e.target.value);
            }}
            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
          >
            {clubs.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Interview Slots"
          value={slots.length}
          subtitle={`${slots.filter((s) => s.status === 'AVAILABLE').length} Available`}
          icon={CalendarCheck}
          color="purple"
        />
        <MetricCard
          title="Scheduled Candidates"
          value={scheduledApps.length}
          subtitle="Ready for assessment"
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Evaluations Completed"
          value={completedEvals.length}
          subtitle="Rankings updated"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Average Candidate Score"
          value={
            completedEvals.length > 0
              ? (
                  completedEvals.reduce((sum, a) => sum + (a.evaluationScore || 0), 0) /
                  completedEvals.length
                ).toFixed(1)
              : 'N/A'
          }
          subtitle="Score range / 100"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Candidates Evaluation Queue Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Candidate Evaluation Roster</h3>
            <p className="text-xs text-slate-500">
              Grade applicants across the 5 structured criteria (Communication, Technical, Leadership, Creativity, Problem Solving)
            </p>
          </div>
        </div>

        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Academic Specs</th>
                  <th className="py-3 px-4">Slot Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Score</th>
                  <th className="py-3 px-4 text-right">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.applicant?.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {app.applicant?.studentId} • {app.applicant?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">
                        CGPA {app.applicant?.cgpa?.toFixed(2)}
                      </span>
                      <div className="text-[10px] text-slate-400">{app.applicant?.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.interviewSlot ? (
                        <div className="text-slate-700">
                          <p className="font-bold">{app.interviewSlot.date}</p>
                          <p className="text-[10px] text-slate-500">
                            {app.interviewSlot.startTime} - {app.interviewSlot.endTime}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unscheduled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {app.evaluationScore !== null && app.evaluationScore !== undefined ? (
                        <span className="font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                          {app.evaluationScore} / 100
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending evaluation</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEvalApp(app);
                          setScores({
                            communication: 18,
                            technicalKnowledge: 18,
                            leadership: 18,
                            creativity: 18,
                            problemSolving: 18,
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all"
                      >
                        {app.evaluationScore ? 'Re-Score' : 'Score Applicant'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No applicants found for this club recruitment.
          </div>
        )}
      </div>

      {/* 5-Criteria Rubric Scoring Modal */}
      {evalApp && (
        <Modal
          isOpen={!!evalApp}
          onClose={() => setEvalApp(null)}
          title="Candidate Interview Evaluation Sheet"
          subtitle={`Applicant: ${evalApp.applicant?.name} (${evalApp.applicant?.studentId} - ${evalApp.applicant?.department})`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleEvaluationSubmit} className="space-y-4 text-xs">
            {/* Applicant statement preview */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <p className="font-bold text-slate-900 mb-1">Statement of Purpose:</p>
              <p className="italic text-slate-600">"{evalApp.statement}"</p>
              {evalApp.experience && (
                <p className="mt-2 text-slate-600">
                  <strong className="text-slate-800">Experience:</strong> {evalApp.experience}
                </p>
              )}
            </div>

            {/* 5 Criteria Sliders / Inputs */}
            <div className="space-y-3 pt-2">
              <p className="font-bold text-purple-700 uppercase tracking-wider text-[11px]">
                Evaluation Rubrics (0 - 20 Points Each)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>1. Communication & Clarity</span>
                    <span className="text-purple-600">{scores.communication} / 20</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={scores.communication}
                    onChange={(e) => handleScoreChange('communication', e.target.value)}
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
                    onChange={(e) => handleScoreChange('technicalKnowledge', e.target.value)}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>3. Leadership & Initiative</span>
                    <span className="text-purple-600">{scores.leadership} / 20</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={scores.leadership}
                    onChange={(e) => handleScoreChange('leadership', e.target.value)}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>4. Creativity & Vision</span>
                    <span className="text-purple-600">{scores.creativity} / 20</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={scores.creativity}
                    onChange={(e) => handleScoreChange('creativity', e.target.value)}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>5. Problem Solving & Teamwork</span>
                    <span className="text-purple-600">{scores.problemSolving} / 20</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={scores.problemSolving}
                    onChange={(e) => handleScoreChange('problemSolving', e.target.value)}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Aggregate Score Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-brand-50 border border-purple-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-purple-700">Calculated Final Score</p>
                <p className="text-2xl font-black text-purple-950">{totalScore} <span className="text-sm font-semibold text-purple-700">/ 100</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase text-purple-700">Average Rubric</p>
                <p className="text-lg font-extrabold text-purple-950">{averageScore} / 20</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold outline-none"
                >
                  <option value="STRONG_ACCEPT">Strong Accept (Top Priority)</option>
                  <option value="ACCEPT">Accept</option>
                  <option value="WAITLIST">Waitlist</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Interviewer Feedback</label>
                <input
                  type="text"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Strong communication, confident leadership responses..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEvalApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEval}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                {submittingEval ? 'Saving...' : 'Submit Evaluation Score'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InterviewerDashboard;

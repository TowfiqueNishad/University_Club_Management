import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Settings,
  UserMinus,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const ClubDetails = () => {
  const { id } = useParams();
  const { user, isLeader, isAdmin, isStudent } = useAuth();
  const { showToast } = useNotification();
  const [club, setClub] = useState(null);
  const [interviewSlots, setInterviewSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'recruitment', 'members', 'events'

  // Eligibility Checker state
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [statement, setStatement] = useState('');
  const [experience, setExperience] = useState('');
  const [applying, setApplying] = useState(false);

  // Configure Eligibility Modal state (for Leader)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    minCgpa: 2.5,
    minSemester: 1,
    minCredits: 0,
    allowedDepartments: '',
    customQuestion: '',
  });

  useEffect(() => {
    fetchClubDetails();
    fetchInterviewSlots();
  }, [id]);

  const fetchClubDetails = async () => {
    try {
      const res = await api.get(`/clubs/${id}`);
      if (res.data.success) {
        setClub(res.data.data);
        setConfigForm({
          minCgpa: res.data.data.eligibilityRequirements?.minCgpa || 2.5,
          minSemester: res.data.data.eligibilityRequirements?.minSemester || 1,
          minCredits: res.data.data.eligibilityRequirements?.minCredits || 0,
          allowedDepartments: res.data.data.eligibilityRequirements?.allowedDepartments?.join(', ') || '',
          customQuestion: res.data.data.eligibilityRequirements?.customQuestion || '',
        });
      }
    } catch (error) {
      console.error('Failed to load club:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewSlots = async () => {
    try {
      const res = await api.get(`/recruitment/club/${id}/interview-slots`);
      if (res.data.success) {
        setInterviewSlots(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load interview slots:', error);
    }
  };

  const handleRunEligibilityCheck = async () => {
    setCheckingEligibility(true);
    setShowEligibilityModal(true);
    try {
      const res = await api.post('/recruitment/check-eligibility', { clubId: id });
      if (res.data.success) {
        setEligibilityResult(res.data.data);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Eligibility check failed', 'error');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const res = await api.post('/recruitment/apply', {
        clubId: id,
        statement,
        experience,
      });

      if (res.data.success) {
        showToast('Application submitted successfully!', 'success', 'Application Received');
        setShowApplyModal(false);
        setStatement('');
        setExperience('');
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to submit application. Ensure you satisfy eligibility rules.',
        'error'
      );
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateEligibilityConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/clubs/${id}/eligibility`, {
        minCgpa: Number(configForm.minCgpa),
        minSemester: Number(configForm.minSemester),
        minCredits: Number(configForm.minCredits),
        allowedDepartments: configForm.allowedDepartments ? configForm.allowedDepartments.split(',').map((d) => d.trim()) : [],
        customQuestion: configForm.customQuestion,
      });

      if (res.data.success) {
        showToast('Eligibility requirements updated', 'success');
        setShowConfigModal(false);
        fetchClubDetails();
      }
    } catch (error) {
      showToast('Failed to update config', 'error');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this club? Any waitlisted student will be auto-promoted.`)) return;

    try {
      const res = await api.delete(`/clubs/${id}/members/${memberId}`);
      if (res.data.success) {
        showToast(
          res.data.promotedCandidate
            ? `Member removed. Candidate (${res.data.promotedCandidate.name}) was automatically promoted from the waitlist!`
            : 'Member removed from club.',
          'success'
        );
        fetchClubDetails();
      }
    } catch (error) {
      showToast('Failed to remove member', 'error');
    }
  };

  if (loading || !club) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading club profile...</div>;
  }

  const isUserLead = club.lead?._id === user?._id || isAdmin;
  const isMember = club.members?.some((m) => (m._id || m) === user?._id);

  return (
    <div className="space-y-6">
      {/* Club Banner & Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-slate-900 overflow-hidden">
          <img
            src={club.banner || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'}
            alt=""
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <StatusBadge status={club.status} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
            <div className="flex items-end gap-4">
              <img
                src={club.logo || 'https://via.placeholder.com/100'}
                alt={club.name}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white"
              />
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono">
                  {club.code}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{club.name}</h1>
                <p className="text-xs text-slate-500 font-semibold">{club.category} Society</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              {isUserLead && (
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Settings className="h-4 w-4" />
                  Eligibility Rules
                </button>
              )}

              {/* Instant Eligibility Checker & Apply buttons */}
              {!isMember && (
                <>
                  <button
                    onClick={handleRunEligibilityCheck}
                    className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    Check My Eligibility
                  </button>

                  <button
                    onClick={() => {
                      handleRunEligibilityCheck();
                      setShowApplyModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/30 flex items-center gap-2 transition-all"
                  >
                    Apply for Recruitment <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-500">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'about' ? 'bg-brand-50 text-brand-700' : 'hover:text-slate-800'
              }`}
            >
              Overview & Leadership
            </button>
            <button
              onClick={() => setActiveTab('recruitment')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'recruitment' ? 'bg-brand-50 text-brand-700' : 'hover:text-slate-800'
              }`}
            >
              Recruitment & Slots ({interviewSlots.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'members' ? 'bg-brand-50 text-brand-700' : 'hover:text-slate-800'
              }`}
            >
              Members Roster ({club.members?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Overview & Leadership */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">About the Society</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{club.description}</p>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Current Eligibility Thresholds
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Min CGPA</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {club.eligibilityRequirements?.minCgpa || 2.5}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Min Semester</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    Sem {club.eligibilityRequirements?.minSemester || 1}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Credits Req</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {club.eligibilityRequirements?.minCredits || 0} Credits
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Capacity</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {club.members?.length || 0} / {club.maxMembers || 50}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Lead Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Club President / Lead
              </h4>
              {club.lead ? (
                <div className="flex items-center gap-3">
                  <img
                    src={club.lead.avatar || 'https://via.placeholder.com/50'}
                    alt=""
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{club.lead.name}</h5>
                    <p className="text-xs text-slate-500">{club.lead.department}</p>
                    <p className="text-[11px] text-slate-400">{club.lead.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No designated lead</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recruitment & Interview Slots */}
      {activeTab === 'recruitment' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scheduled Interview Slots</h3>
              <p className="text-xs text-slate-500">
                Book a face-to-face or virtual slot with the recruitment assessment committee.
              </p>
            </div>
            {isUserLead && (
              <Link
                to="/recruitment/manage"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
              >
                Create Slots in Desk
              </Link>
            )}
          </div>

          {interviewSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviewSlots.map((slot) => {
                const isFull = slot.status === 'FULL' || slot.bookedApplicants?.length >= slot.maxApplicants;
                return (
                  <div
                    key={slot._id}
                    className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                      isFull ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-brand-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-900 text-sm">{slot.date}</span>
                        <StatusBadge status={slot.status} />
                      </div>
                      <p className="font-semibold text-brand-600">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-slate-500 mt-1 truncate">Location: {slot.location}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Interviewer: {slot.interviewer?.name || 'Faculty Member'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Capacity: {slot.bookedApplicants?.length || 0} / {slot.maxApplicants}
                      </span>
                      {isStudent && !isFull && (
                        <Link
                          to="/applications"
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] shadow-sm"
                        >
                          Book via Applications
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No interview slots currently open for booking.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Members Roster */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enrolled Club Members</h3>
              <p className="text-xs text-slate-500">
                Active students registered in this society. Removing a member promotes the highest-ranked waitlisted applicant automatically.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Semester</th>
                  {isUserLead && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {club.members?.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <img
                        src={member.avatar || 'https://via.placeholder.com/35'}
                        alt=""
                        className="h-8 w-8 rounded-xl object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-[10px] text-slate-400">{member.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {member.studentId || 'STU-N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{member.department}</td>
                    <td className="py-3 px-4 text-slate-600">Semester {member.semester}</td>
                    {isUserLead && (
                      <td className="py-3 px-4 text-right">
                        {member._id !== club.lead?._id && (
                          <button
                            onClick={() => handleRemoveMember(member._id, member.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 font-bold text-xs"
                            title="Remove member (triggers auto-promotion from waitlist)"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instant Eligibility Checker Modal */}
      {showEligibilityModal && (
        <Modal
          isOpen={showEligibilityModal}
          onClose={() => setShowEligibilityModal(false)}
          title="Application Eligibility Check"
          subtitle={`Evaluating against requirements for ${club.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 py-2 text-xs">
            {checkingEligibility ? (
              <div className="p-8 text-center text-slate-400">Verifying academic metrics...</div>
            ) : eligibilityResult ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    eligibilityResult.isEligible
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {eligibilityResult.isEligible ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm">
                      {eligibilityResult.isEligible ? 'You are Eligible to Apply!' : 'Eligibility Requirements Not Met'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {eligibilityResult.isEligible
                        ? 'Your academic credentials meet all configured criteria for this club.'
                        : 'You cannot submit an application because mandatory requirements are not satisfied.'}
                    </p>
                  </div>
                </div>

                {/* Explicit rejection reasons if failing */}
                {!eligibilityResult.isEligible && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Reason(s) for Ineligibility:
                    </p>
                    <ul className="space-y-1 text-rose-700">
                      {eligibilityResult.rejectionReasons?.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400">Your CGPA:</span>{' '}
                    <strong>{eligibilityResult.metrics?.cgpa?.toFixed(2)}</strong> (Min: {eligibilityResult.metrics?.minCgpa})
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400">Your Semester:</span>{' '}
                    <strong>Sem {eligibilityResult.metrics?.semester}</strong> (Min: {eligibilityResult.metrics?.minSemester})
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowEligibilityModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                  >
                    Close
                  </button>
                  {eligibilityResult.isEligible && (
                    <button
                      onClick={() => {
                        setShowEligibilityModal(false);
                        setShowApplyModal(true);
                      }}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
                    >
                      Proceed to Apply
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      )}

      {/* Apply to Club Modal */}
      {showApplyModal && (
        <Modal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          title={`Apply for Recruitment: ${club.name}`}
          subtitle="Submit your statement of purpose and relevant experience for interviewer review"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleApply} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Statement of Purpose / Why do you want to join? *
              </label>
              <textarea
                rows={4}
                required
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="I am deeply passionate about web development, AI, and want to help organize hackathons..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Relevant Experience / Projects / Portfolio Links
              </label>
              <textarea
                rows={2}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Built multiple React web applications, experience with graphic design..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applying}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Configure Eligibility Rules Modal (Leader only) */}
      {showConfigModal && (
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title="Configure Recruitment Eligibility Requirements"
          subtitle="Set mandatory criteria that applicants must satisfy before applying"
        >
          <form onSubmit={handleUpdateEligibilityConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Min CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.minCgpa}
                  onChange={(e) => setConfigForm({ ...configForm, minCgpa: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Min Semester</label>
                <input
                  type="number"
                  value={configForm.minSemester}
                  onChange={(e) => setConfigForm({ ...configForm, minSemester: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Min Credits</label>
                <input
                  type="number"
                  value={configForm.minCredits}
                  onChange={(e) => setConfigForm({ ...configForm, minCredits: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Allowed Departments (comma separated, leave empty for all)
              </label>
              <input
                type="text"
                value={configForm.allowedDepartments}
                onChange={(e) => setConfigForm({ ...configForm, allowedDepartments: e.target.value })}
                placeholder="Computer Science & Engineering, Electrical & Electronic Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Custom Screening Question</label>
              <input
                type="text"
                value={configForm.customQuestion}
                onChange={(e) => setConfigForm({ ...configForm, customQuestion: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Save Requirements
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ClubDetails;

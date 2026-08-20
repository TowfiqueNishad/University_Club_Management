import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Award,
  Users,
  Search,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const VolunteerHub = () => {
  const { user, isLeader, isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [duties, setDuties] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [activeTab, setActiveTab] = useState('duties'); // 'duties', 'matcher', 'swaps'
  const [loading, setLoading] = useState(true);

  // Skill Matcher State
  const [selectedSkills, setSelectedSkills] = useState(['Photography', 'Video Editing']);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Request Swap Modal State
  const [swapDuty, setSwapDuty] = useState(null);
  const [swapTargetUserId, setSwapTargetUserId] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [eligiblePeers, setEligiblePeers] = useState([]);

  // Create Duty Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [dutyForm, setDutyForm] = useState({
    event: '',
    title: '',
    description: '',
    requiredSkills: 'Event Management, Photography',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    pointsReward: 75,
  });

  useEffect(() => {
    fetchDuties();
    fetchSwaps();
    fetchEvents();
    fetchPeers();
  }, [user]);

  const fetchDuties = async () => {
    try {
      const res = await api.get('/volunteers/duties');
      if (res.data.success) setDuties(res.data.data);
    } catch (error) {
      console.error('Failed to load duties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSwaps = async () => {
    try {
      const res = await api.get('/volunteers/swaps');
      if (res.data.success) setSwaps(res.data.data);
    } catch (error) {
      console.error('Failed to load swaps:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.data);
        if (res.data.data.length > 0) {
          setDutyForm((prev) => ({ ...prev, event: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPeers = async () => {
    try {
      const res = await api.get('/auth/demo-accounts');
      if (res.data.success) {
        setEligiblePeers(res.data.data.filter((u) => u._id !== user?._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runSkillMatcher = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await api.post('/volunteers/recommendations', {
        requiredSkills: selectedSkills,
      });
      if (res.data.success) {
        setRecommendations(res.data.data);
      }
    } catch (error) {
      showToast('Failed to run volunteer matcher', 'error');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleUpdateStatus = async (dutyId, status) => {
    try {
      const res = await api.put(`/volunteers/duties/${dutyId}/status`, { status });
      if (res.data.success) {
        showToast(`Duty updated to ${status}`, 'success');
        fetchDuties();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleVerifyDuty = async (dutyId) => {
    try {
      const res = await api.put(`/volunteers/duties/${dutyId}/verify`);
      if (res.data.success) {
        showToast('Volunteer duty verified and points awarded!', 'success', 'Duty Verified');
        fetchDuties();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed', 'error');
    }
  };

  const handleRequestSwapSubmit = async (e) => {
    e.preventDefault();
    if (!swapDuty || !swapTargetUserId) return;

    try {
      const res = await api.post(`/volunteers/duties/${swapDuty._id}/swap-request`, {
        targetVolunteerId: swapTargetUserId,
        reason: swapReason,
      });

      if (res.data.success) {
        showToast('Swap request sent to peer volunteer for acceptance!', 'success', 'Swap Requested');
        setSwapDuty(null);
        setSwapReason('');
        fetchSwaps();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Swap request failed', 'error');
    }
  };

  const handleTargetSwapResponse = async (swapId, accept) => {
    try {
      const res = await api.put(`/volunteers/swaps/${swapId}/target-response`, { accept });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        fetchSwaps();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleLeaderSwapDecision = async (swapId, approve) => {
    try {
      const res = await api.put(`/volunteers/swaps/${swapId}/leader-decision`, {
        approve,
        reviewNotes: approve ? 'Approved by leader' : 'Declined by leader',
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        fetchSwaps();
        fetchDuties();
      }
    } catch (err) {
      showToast('Leader decision failed', 'error');
    }
  };

  const handleCreateDutySubmit = async (e) => {
    e.preventDefault();
    const evt = events.find((ev) => ev._id === dutyForm.event);
    if (!evt) return;

    try {
      const res = await api.post('/volunteers/duties', {
        ...dutyForm,
        club: evt.club?._id || evt.club,
        requiredSkills: dutyForm.requiredSkills.split(',').map((s) => s.trim()),
      });

      if (res.data.success) {
        showToast('Volunteer duty created!', 'success');
        setShowCreateModal(false);
        fetchDuties();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create duty', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Operations & Task Force
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Volunteer & Duty Management</h1>
          <p className="text-xs text-slate-500 font-medium">
            Skill-based volunteer matching, task lifecycle tracking, and 3-tier duty swap workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(isLeader || isAdmin) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              Create Volunteer Duty
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('duties')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'duties'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Duties & Progress ({duties.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('matcher');
            if (recommendations.length === 0) runSkillMatcher();
          }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'matcher'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Skill Matcher AI ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'swaps'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Duty Swap Requests ({swaps.length})
        </button>
      </div>

      {/* Tab 1: Duties Progress Tracking */}
      {activeTab === 'duties' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Duty & Event</th>
                  <th className="py-3 px-4">Assigned Volunteer</th>
                  <th className="py-3 px-4">Required Skills</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {duties.map((duty) => {
                  const isAssignedToMe = duty.assignedTo?._id === user?._id;
                  return (
                    <tr key={duty._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{duty.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {duty.event?.title} • {duty.club?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {duty.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={duty.assignedTo.avatar || 'https://via.placeholder.com/30'}
                              alt=""
                              className="h-6 w-6 rounded-md object-cover"
                            />
                            <div>
                              <span className="font-bold text-slate-800">{duty.assignedTo.name}</span>
                              {isAssignedToMe && (
                                <span className="ml-1 text-[10px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {duty.requiredSkills?.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(duty.deadline).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={duty.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {/* Volunteer updates their own progress */}
                        {isAssignedToMe && duty.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleUpdateStatus(duty._id, 'ACCEPTED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                        )}

                        {isAssignedToMe && duty.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateStatus(duty._id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] hover:bg-sky-700"
                          >
                            Start Work
                          </button>
                        )}

                        {isAssignedToMe && duty.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(duty._id, 'COMPLETED')}
                            className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-700"
                          >
                            Mark Done
                          </button>
                        )}

                        {/* Request Swap Button */}
                        {isAssignedToMe && duty.status !== 'VERIFIED' && (
                          <button
                            onClick={() => setSwapDuty(duty)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] hover:bg-amber-100"
                          >
                            Swap
                          </button>
                        )}

                        {/* Leader Verification Action */}
                        {(isLeader || isAdmin) && duty.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleVerifyDuty(duty._id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 shadow-sm"
                          >
                            Verify & Award Pts
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Skill Matcher AI Recommendations */}
      {activeTab === 'matcher' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-600" />
                Intelligent Skill-Based Volunteer Matcher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranks student candidates based on registered skill overlap, active workload balance, and past duty experience.
              </p>
            </div>

            <button
              onClick={runSkillMatcher}
              disabled={loadingRecommendations}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loadingRecommendations ? 'animate-spin' : ''}`} />
              Run Matcher
            </button>
          </div>

          {/* Skill Selector */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Filter by Task Skills:
            </span>
            <div className="flex flex-wrap gap-2">
              {['Photography', 'Video Editing', 'Event Management', 'Public Speaking', 'Graphic Design', 'Technical Support', 'Social Media'].map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                      } else {
                        setSelectedSkills([...selectedSkills, skill]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Volunteer Candidate</th>
                  <th className="py-3 px-4">Skill Match %</th>
                  <th className="py-3 px-4">Matching Registered Skills</th>
                  <th className="py-3 px-4">Current Workload</th>
                  <th className="py-3 px-4">Past Completed Duties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recommendations.map((rec, i) => (
                  <tr key={rec.user?._id || i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rec.user?.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {rec.user?.studentId} • {rec.user?.department}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-brand-600 text-sm">
                          {rec.matchPercentage}%
                        </span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full"
                            style={{ width: `${rec.matchPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {rec.matchingSkills?.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          rec.workloadScore === 'Available'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.workloadScore === 'Moderate'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {rec.workloadScore} ({rec.activeDutiesCount} active)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {rec.completedDutiesCount} duties verified
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Duty Swap Requests */}
      {activeTab === 'swaps' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Duty Swap Workflow Roster</h3>
            <p className="text-xs text-slate-500">
              3-Step Swap: Volunteer A requests → Peer Volunteer B accepts → Club Leader authorizes → Task ownership transfers automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Duty</th>
                  <th className="py-3 px-4">Requester (A)</th>
                  <th className="py-3 px-4">Target Peer (B)</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {swaps.length > 0 ? (
                  swaps.map((swap) => {
                    const isTargetMe = swap.targetVolunteer?._id === user?._id;
                    const canLeaderApprove = (isLeader || isAdmin) && swap.status === 'PENDING_LEADER_APPROVAL';

                    return (
                      <tr key={swap._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{swap.duty?.title}</td>
                        <td className="py-3.5 px-4 text-slate-700">{swap.requestedBy?.name}</td>
                        <td className="py-3.5 px-4 text-slate-700">{swap.targetVolunteer?.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                          "{swap.reason}"
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={swap.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {/* Peer accept/reject */}
                          {isTargetMe && swap.status === 'PENDING_TARGET_ACCEPT' && (
                            <>
                              <button
                                onClick={() => handleTargetSwapResponse(swap._id, true)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                              >
                                Accept Swap
                              </button>
                              <button
                                onClick={() => handleTargetSwapResponse(swap._id, false)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px]"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {/* Leader final authorization */}
                          {canLeaderApprove && (
                            <>
                              <button
                                onClick={() => handleLeaderSwapDecision(swap._id, true)}
                                className="px-3 py-1 rounded-lg bg-brand-600 text-white font-bold text-[11px] shadow-sm"
                              >
                                Approve Transfer
                              </button>
                              <button
                                onClick={() => handleLeaderSwapDecision(swap._id, false)}
                                className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px]"
                              >
                                Deny
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No duty swap requests logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Duty Swap Modal */}
      {swapDuty && (
        <Modal
          isOpen={!!swapDuty}
          onClose={() => setSwapDuty(null)}
          title="Request Volunteer Duty Swap"
          subtitle={`Task: ${swapDuty.title}`}
        >
          <form onSubmit={handleRequestSwapSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Select Peer Volunteer to Swap With *
              </label>
              <select
                required
                value={swapTargetUserId}
                onChange={(e) => setSwapTargetUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              >
                <option value="">-- Choose Volunteer --</option>
                {eligiblePeers.map((peer) => (
                  <option key={peer._id} value={peer._id}>
                    {peer.name} ({peer.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Reason for Swap Request *
              </label>
              <textarea
                rows={3}
                required
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                placeholder="Academic exam clash, transportation conflict..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSwapDuty(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Dispatch Swap Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Duty Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Volunteer Task"
          subtitle="Assign requirements, points incentives, and deadlines"
        >
          <form onSubmit={handleCreateDutySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Select Event *</label>
              <select
                required
                value={dutyForm.event}
                onChange={(e) => setDutyForm({ ...dutyForm, event: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Duty Title *</label>
              <input
                type="text"
                required
                value={dutyForm.title}
                onChange={(e) => setDutyForm({ ...dutyForm, title: e.target.value })}
                placeholder="e.g. Stage AV Setup & Mic Coordination"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Description *</label>
              <textarea
                rows={3}
                required
                value={dutyForm.description}
                onChange={(e) => setDutyForm({ ...dutyForm, description: e.target.value })}
                placeholder="Task responsibilities and timing details..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Deadline *</label>
                <input
                  type="date"
                  required
                  value={dutyForm.deadline}
                  onChange={(e) => setDutyForm({ ...dutyForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Points Reward *</label>
                <input
                  type="number"
                  min={10}
                  value={dutyForm.pointsReward}
                  onChange={(e) => setDutyForm({ ...dutyForm, pointsReward: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Required Skills (comma separated)
              </label>
              <input
                type="text"
                value={dutyForm.requiredSkills}
                onChange={(e) => setDutyForm({ ...dutyForm, requiredSkills: e.target.value })}
                placeholder="e.g. Photography, Graphic Design"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
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
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
              >
                Create Duty
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VolunteerHub;

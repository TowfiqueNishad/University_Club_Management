import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { QRCodeSVG } from 'qrcode.react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/attendance/student-history');
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load student history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const consistency = history?.consistencyMetrics || {
    totalRegistrations: 0,
    attendedCount: 0,
    attendancePercentage: 100,
    status: 'Excellent',
  };

  const applications = history?.applications || [];
  const registrations = history?.registrations || [];
  const duties = history?.duties || [];
  const certificates = history?.certificates || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-indigo-950 to-brand-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-200 backdrop-blur-md mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Student Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {user?.department} • Semester {user?.semester} • CGPA {Number(user?.cgpa || 0).toFixed(2)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/clubs"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all"
            >
              Browse Clubs & Apply <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/events"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Attendance Health"
          value={`${consistency.attendancePercentage}%`}
          subtitle={`${consistency.attendedCount} attended of ${consistency.totalRegistrations} registered`}
          icon={CheckCircle2}
          color={consistency.attendancePercentage >= 75 ? 'emerald' : 'amber'}
          trend={consistency.status}
        />
        <MetricCard
          title="Gamification Points"
          value={user?.points || 0}
          subtitle="Earn points by attending & volunteering"
          icon={Award}
          color="indigo"
        />
        <MetricCard
          title="Club Applications"
          value={applications.length}
          subtitle={`${applications.filter((a) => a.status === 'ACCEPTED').length} Accepted`}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Earned Certificates"
          value={certificates.length}
          subtitle="Verifiable digital badges"
          icon={Award}
          color="sky"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Events & QR Passes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Registered Events</h3>
                <p className="text-xs text-slate-500">Upcoming campus sessions and entry tickets</p>
              </div>
              <Link to="/events" className="text-xs font-bold text-brand-600 hover:text-brand-800">
                View All Events →
              </Link>
            </div>

            {registrations.length > 0 ? (
              <div className="space-y-3">
                {registrations.slice(0, 4).map((reg) => (
                  <div
                    key={reg._id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-4 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-brand-50 rounded-xl text-brand-600 border border-brand-100 mt-0.5">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{reg.event?.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {reg.event?.date} • {reg.event?.customLocation || 'Campus Venue'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <StatusBadge status={reg.status} />
                          {reg.waitlistPosition && (
                            <span className="text-xs font-semibold text-purple-700">
                              Waitlist Position #{reg.waitlistPosition}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {reg.status === 'REGISTERED' && (
                      <button
                        onClick={() => setSelectedTicket(reg)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <QrCode className="h-4 w-4 text-brand-600" />
                        Pass
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                You haven't registered for any events yet.{' '}
                <Link to="/events" className="text-brand-600 font-bold hover:underline">
                  Browse Events
                </Link>
              </div>
            )}
          </div>

          {/* Volunteer Duties Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Volunteer Duties</h3>
                <p className="text-xs text-slate-500">Tasks assigned for campus events</p>
              </div>
              <Link to="/volunteers" className="text-xs font-bold text-brand-600 hover:text-brand-800">
                Volunteer Center →
              </Link>
            </div>

            {duties.length > 0 ? (
              <div className="space-y-2.5">
                {duties.slice(0, 3).map((d) => (
                  <div
                    key={d._id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-slate-800">{d.title}</h5>
                      <p className="text-slate-500 mt-0.5">Event: {d.event?.title || 'Campus Activity'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600">+{d.pointsReward || 50} pts</span>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No active volunteer duties assigned.{' '}
                <Link to="/volunteers" className="text-brand-600 font-bold hover:underline">
                  Volunteer for tasks
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Applications & Activity Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Applications Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recruitment Applications</h3>
              <Link to="/applications" className="text-xs font-bold text-brand-600 hover:text-brand-800">
                Manage →
              </Link>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={app.club?.logo || 'https://via.placeholder.com/40'}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                        <div>
                          <h5 className="font-bold text-slate-900">{app.club?.name}</h5>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {app.club?.category}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    {app.status === 'INTERVIEW_SCHEDULED' && app.interviewSlot && (
                      <div className="mt-2.5 p-2 bg-sky-50 rounded-xl border border-sky-100 text-sky-800 font-medium">
                        Interview: {app.interviewSlot.date} at {app.interviewSlot.startTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                You haven't applied to any clubs yet.{' '}
                <Link to="/clubs" className="text-brand-600 font-bold hover:underline">
                  Find Clubs
                </Link>
              </div>
            )}
          </div>

          {/* Attendance Consistency Summary Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-brand-50/50 rounded-3xl p-6 border border-brand-100 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Attendance Health</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Maintain above 75% attendance to unlock exclusive badges and priority event access.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Reliability Score</span>
                <span className="text-brand-700">{consistency.attendancePercentage}% ({consistency.status})</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    consistency.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${consistency.attendancePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Total Registrations: {consistency.totalRegistrations}</span>
                <span>No-shows: {consistency.noShowCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title="Digital Event Ticket & QR Pass"
          subtitle={selectedTicket.event?.title}
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={JSON.stringify({
                  ticketCode: selectedTicket.ticketCode,
                  eventId: selectedTicket.event?._id,
                  user: user?.name,
                  studentId: user?.studentId,
                })}
                size={180}
              />
            </div>

            <div className="text-xs space-y-1">
              <p className="font-extrabold text-sm text-slate-900">{user?.name}</p>
              <p className="text-slate-500">Student ID: {user?.studentId}</p>
              <p className="text-slate-500">
                Ticket Code: <strong className="text-brand-600 font-mono">{selectedTicket.ticketCode}</strong>
              </p>
            </div>

            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-brand-900 text-xs font-medium">
              Present this QR code at the entrance scanner to record your attendance.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentDashboard;

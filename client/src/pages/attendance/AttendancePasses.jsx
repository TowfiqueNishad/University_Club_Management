import React, { useEffect, useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Users,
  Camera,
  Award,
  Sparkles,
  TrendingUp,
  Shield,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { QRCodeSVG } from 'qrcode.react';

const AttendancePasses = () => {
  const { user, isLeader, isAdmin, isStudent } = useAuth();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('passes'); // 'passes', 'scanner', 'report'
  const [history, setHistory] = useState(null);
  const [consistencyReport, setConsistencyReport] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scanner State
  const [qrInput, setQrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetchHistory();
    if (isLeader || isAdmin) {
      fetchConsistencyReport();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attendance/student-history');
      if (res.data.success) setHistory(res.data.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsistencyReport = async () => {
    try {
      const res = await api.get('/attendance/consistency-report');
      if (res.data.success) setConsistencyReport(res.data.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  const handleVerifyQR = async (e) => {
    e.preventDefault();
    if (!qrInput) return;

    setVerifying(true);
    setScanResult(null);
    try {
      const res = await api.post('/attendance/verify-qr', { qrData: qrInput });
      if (res.data.success) {
        setScanResult({
          success: true,
          message: res.data.message,
          pointsEarned: res.data.pointsEarned,
        });
        showToast(res.data.message, 'success', 'Attendance Confirmed');
        setQrInput('');
        fetchHistory();
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.message || 'Invalid or duplicate QR Code scan.',
      });
      showToast(err.response?.data?.message || 'Verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const registrations = history?.registrations || [];
  const consistency = history?.consistencyMetrics || {
    totalRegistrations: 0,
    attendedCount: 0,
    attendancePercentage: 100,
    status: 'Excellent',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Attendance & Passes
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">QR Passes & Attendance Verification</h1>
          <p className="text-xs text-slate-500 font-medium">
            Scan event QR codes to verify participation, prevent duplicate check-ins, and track reliability metrics.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('passes')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'passes' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            My Event Passes ({registrations.filter((r) => r.status === 'REGISTERED').length})
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'scanner' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Scan & Verify
          </button>
          {(isLeader || isAdmin) && (
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'report' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Reliability Report ({consistencyReport.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: My Passes */}
      {activeTab === 'passes' && (
        <div className="space-y-6">
          {/* Consistency Health Bar */}
          <div className="bg-gradient-to-r from-navy-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-white/10 text-brand-300 backdrop-blur-md">
                Reliability Metrics
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Attendance Rate: {consistency.attendancePercentage}% ({consistency.status})
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                {consistency.attendedCount} confirmed event attendances out of {consistency.totalRegistrations} total registrations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">No-Shows</span>
                <p className="text-xl font-extrabold text-amber-400">{consistency.noShowCount}</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Points</span>
                <p className="text-xl font-extrabold text-brand-300">{user?.points || 0}</p>
              </div>
            </div>
          </div>

          {/* Registered Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map((reg) => (
              <div
                key={reg._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-base text-slate-900">{reg.event?.title}</h3>
                    <StatusBadge status={reg.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {reg.event?.date} • {reg.event?.customLocation || 'Campus Venue'}
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <p className="text-slate-500">
                      Ticket Code:{' '}
                      <strong className="font-mono text-brand-600">{reg.ticketCode}</strong>
                    </p>
                    <p className="text-slate-500">
                      Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/events/${reg.event?._id}`}
                    className="text-xs font-bold text-slate-600 hover:text-brand-600"
                  >
                    Event Details →
                  </Link>

                  {reg.status === 'REGISTERED' && (
                    <button
                      onClick={() => setSelectedPass(reg)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5"
                    >
                      <QrCode className="h-4 w-4" />
                      View Pass
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Scan & Verify Attendance */}
      {activeTab === 'scanner' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-card space-y-6">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
              <Camera className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">QR Attendance Scanner</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Scan the projected event QR code on screen, or paste the secret QR token to record your attendance.
            </p>
          </div>

          {/* Result Alert */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-fade-in ${
                scanResult.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-bold">{scanResult.message}</p>
                {scanResult.pointsEarned && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    +{scanResult.pointsEarned} Gamification Points added to your profile!
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyQR} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Event QR Token / Scanned Payload
              </label>
              <textarea
                rows={3}
                required
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder='e.g. EVT-HACKSPRINT-2026 or {"type":"CAMPUSHUB_EVENT_ATTENDANCE","secret":"..."}'
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Demo Tokens (1-Click Test Verification):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setQrInput('EVT-HACKSPRINT-2026')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold text-[11px] hover:bg-slate-100 shadow-sm"
                >
                  EVT-HACKSPRINT-2026
                </button>
                <button
                  type="button"
                  onClick={() => setQrInput('EVT-ROBOTICS-EXPO-2026')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold text-[11px] hover:bg-slate-100 shadow-sm"
                >
                  EVT-ROBOTICS-EXPO-2026
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || !qrInput}
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {verifying ? 'Verifying Token...' : 'Verify Attendance & Claim Points (+20 pts)'}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Reliability Report for Leaders / Admins */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Reliability & No-Show Report</h3>
            <p className="text-xs text-slate-500">
              Identify students who register repeatedly without attending to optimize seat allocation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4">Attended</th>
                  <th className="py-3 px-4">No-Shows</th>
                  <th className="py-3 px-4">Reliability %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {consistencyReport.map((st) => {
                  const rate = st.attendanceStats?.attendanceRate || 100;
                  return (
                    <tr key={st._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[10px] text-slate-400">{st.studentId} • {st.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{st.department}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {st.attendanceStats?.totalRegistrations || 0}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {st.attendanceStats?.attendedCount || 0}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-700">
                        {st.attendanceStats?.noShowCount || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rate >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : rate >= 75
                              ? 'bg-sky-100 text-sky-800'
                              : rate >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Pass Modal */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          title="Digital Ticket Pass"
          subtitle={selectedPass.event?.title}
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={JSON.stringify({
                  ticketCode: selectedPass.ticketCode,
                  eventId: selectedPass.event?._id,
                  user: user?.name,
                  studentId: user?.studentId,
                })}
                size={200}
              />
            </div>

            <div className="text-xs space-y-1">
              <p className="font-extrabold text-sm text-slate-900">{user?.name}</p>
              <p className="text-slate-500">Student ID: {user?.studentId}</p>
              <p className="text-slate-500">
                Ticket Code: <strong className="font-mono text-brand-600">{selectedPass.ticketCode}</strong>
              </p>
            </div>

            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-brand-900 text-xs font-medium">
              Scan this code at the registration desk for instant verified admission.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AttendancePasses;

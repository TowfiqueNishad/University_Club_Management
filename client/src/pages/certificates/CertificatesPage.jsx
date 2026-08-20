import React, { useEffect, useState, useRef } from 'react';
import {
  Award,
  Download,
  Share2,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Shield,
  Sparkles,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';

const CertificatesPage = () => {
  const { user, isLeader, isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [certificates, setCertificates] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Issue Certificate Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    userId: '',
    clubId: '',
    eventId: '',
    title: 'Certificate of Outstanding Participation',
    achievement: 'Successfully organized and participated in the annual campus initiative.',
    issuerName: 'Office of Student Affairs & Club Governance Board',
  });
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    fetchCertificates();
    if (isLeader || isAdmin) {
      fetchIssueDependencies();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/certificates/my-certificates');
      if (res.data.success) {
        setCertificates(res.data.data);
        if (res.data.data.length > 0) setSelectedCert(res.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueDependencies = async () => {
    try {
      const [cRes, eRes, uRes] = await Promise.all([
        api.get('/clubs'),
        api.get('/events'),
        api.get('/auth/demo-accounts'),
      ]);

      if (cRes.data.success) {
        setClubs(cRes.data.data);
        if (cRes.data.data.length > 0) setIssueForm((prev) => ({ ...prev, clubId: cRes.data.data[0]._id }));
      }
      if (eRes.data.success) setEvents(eRes.data.data);
      if (uRes.data.success) {
        setStudents(uRes.data.data);
        if (uRes.data.data.length > 0) setIssueForm((prev) => ({ ...prev, userId: uRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const res = await api.post('/certificates/issue', issueForm);
      if (res.data.success) {
        showToast('Digital certificate issued successfully!', 'success', 'Certificate Created');
        setShowIssueModal(false);
        fetchCertificates();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to issue certificate', 'error');
    } finally {
      setIssuing(false);
    }
  };

  const handleDownloadPDF = (cert) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    // Certificate background styling
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 842, 595, 'F');

    // Outer border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(4);
    doc.rect(30, 30, 782, 535);

    // Inner gold border
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.5);
    doc.rect(40, 40, 762, 515);

    // Header
    doc.setTextColor(30, 27, 75);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('UNIVERSITY CLUB GOVERNANCE BOARD', 421, 100, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241);
    doc.text('OFFICIAL DIGITAL CREDENTIAL OF MERIT', 421, 130, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('This is proudly presented to', 421, 180, { align: 'center' });

    // Recipient Name
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(user?.name || 'Emma Watson', 421, 230, { align: 'center' });

    // Body achievement text
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(cert.achievement || cert.title, 600);
    doc.text(splitText, 421, 280, { align: 'center' });

    // Event & Club
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Issued by: ${cert.club?.name || 'Campus Society'}`, 421, 350, { align: 'center' });

    // Verification ID & Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Certificate ID: ${cert.certificateId}`, 100, 480);
    doc.text(`Date of Issue: ${new Date(cert.issueDate).toLocaleDateString()}`, 100, 500);

    // Issuer Sign
    doc.text(`Authorized by: ${cert.issuerName || 'Dean of Student Affairs'}`, 550, 480);
    doc.text(`Status: VALID & VERIFIED`, 550, 500);

    doc.save(`${cert.certificateId}_Certificate.pdf`);
    showToast('Certificate PDF downloaded!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Verifiable Credentials
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Digital Certificate Wallet</h1>
          <p className="text-xs text-slate-500 font-medium">
            View earned merit certificates, download official printable PDFs, and share instant verification QR links.
          </p>
        </div>

        {(isLeader || isAdmin) && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Issue Digital Certificate
          </button>
        )}
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Certificate Selector List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Certificates ({certificates.length})
            </h3>
            {certificates.map((cert) => (
              <div
                key={cert._id}
                onClick={() => setSelectedCert(cert)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedCert?._id === cert._id
                    ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
                    : 'bg-white/80 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{cert.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{cert.club?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">{cert.certificateId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Certificate Canvas / Live Preview */}
          {selectedCert && (
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedCert)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Download className="h-4 w-4" /> Download PDF Certificate
                </button>
                <Link
                  to={`/verify-certificate/${selectedCert.certificateId}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" /> Public Verification Page
                </Link>
              </div>

              {/* Rendered Certificate Card Frame */}
              <div className="relative bg-gradient-to-b from-amber-50/40 via-white to-indigo-50/30 rounded-3xl p-8 sm:p-12 border-4 border-indigo-900/80 shadow-2xl text-center space-y-6">
                {/* Decorative borders */}
                <div className="absolute inset-3 border-2 border-amber-400/80 rounded-2xl pointer-events-none" />

                <div className="space-y-1">
                  <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-md">
                    C
                  </div>
                  <p className="text-[10px] font-extrabold text-brand-700 uppercase tracking-widest">
                    Office of Student Affairs & Club Governance
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    CERTIFICATE OF MERIT & DISTINCTION
                  </h2>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500 italic">This is proudly awarded to</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-8">
                    {user?.name}
                  </h3>
                  <p className="text-xs text-slate-500 pt-2 font-medium">Student ID: {user?.studentId}</p>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
                  {selectedCert.achievement}
                </p>

                <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-left">
                  <div>
                    <p className="text-slate-400">Issuing Authority:</p>
                    <p className="font-bold text-slate-900">{selectedCert.issuerName}</p>
                    <p className="text-[11px] text-slate-500">{selectedCert.club?.name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <QRCodeSVG
                        value={`http://localhost:5173/verify-certificate/${selectedCert.certificateId}`}
                        size={64}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">Verification ID</p>
                      <p className="font-bold font-mono text-slate-900 text-xs">{selectedCert.certificateId}</p>
                      <span className="inline-flex items-center text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> VALID
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-3">
          <Award className="h-10 w-10 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No certificates earned yet.</p>
          <p className="text-slate-400 max-w-md mx-auto">
            Participate in campus events, lead workshops, and volunteer to receive verifiable digital awards.
          </p>
        </div>
      )}

      {/* Issue Certificate Modal (Leader / Admin) */}
      {showIssueModal && (
        <Modal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title="Issue Digital Student Certificate"
          subtitle="Generate verifiable cryptographic credential with QR validation code"
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Recipient Student *</label>
                <select
                  required
                  value={issueForm.userId}
                  onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-medium"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Issuing Club *</label>
                <select
                  required
                  value={issueForm.clubId}
                  onChange={(e) => setIssueForm({ ...issueForm, clubId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-medium"
                >
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Certificate Title *</label>
              <input
                type="text"
                required
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Achievement Description *</label>
              <textarea
                rows={3}
                required
                value={issueForm.achievement}
                onChange={(e) => setIssueForm({ ...issueForm, achievement: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Issuer Authority Name *</label>
              <input
                type="text"
                required
                value={issueForm.issuerName}
                onChange={(e) => setIssueForm({ ...issueForm, issuerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={issuing}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {issuing ? 'Generating...' : 'Issue Verifiable Certificate'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CertificatesPage;

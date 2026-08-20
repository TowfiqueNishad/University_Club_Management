import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Shield,
  Award,
  Search,
  ArrowRight,
  ExternalLink,
  Calendar,
  Building2,
} from 'lucide-react';
import api from '../../services/api';

const VerifyCertificatePublic = () => {
  const { certificateId } = useParams();
  const [searchId, setSearchId] = useState(certificateId || '');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (certificateId) {
      verifyId(certificateId);
    } else {
      setLoading(false);
    }
  }, [certificateId]);

  const verifyId = async (idToVerify) => {
    setLoading(true);
    setNotFound(false);
    setCertData(null);
    try {
      const res = await api.get(`/certificates/verify/${idToVerify.trim().toUpperCase()}`);
      if (res.data.success) {
        setCertData(res.data.data);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId) verifyId(searchId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Navbar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <Link to="/login" className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/30">
            C
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              CampusHub
            </span>
            <p className="text-[10px] text-slate-400 font-medium">Public Credential Verification Portal</p>
          </div>
        </Link>

        <Link
          to="/login"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 shadow-sm transition-all"
        >
          Sign In to Portal →
        </Link>
      </div>

      {/* Main Verification Body */}
      <div className="max-w-3xl w-full mx-auto my-8 space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" /> University Digital Trust Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Certificate Verification</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Validate the authenticity of university merit awards, hackathon credentials, and leadership badges issued by CampusHub.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. CERT-HACK-2026-01)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all shrink-0"
            >
              Verify ID
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Verifying credential signature...</div>
        ) : certData ? (
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6">
            {/* Status Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-950">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-base">Verified Official Credential</h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  This certificate was legitimately issued and recorded in the University Club Registry.
                </p>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="space-y-4 pt-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Certificate Title
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{certData.title}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Awarded To</span>
                  <p className="font-extrabold text-slate-900 text-sm">{certData.user?.name}</p>
                  <p className="text-slate-500">Student ID: {certData.user?.studentId}</p>
                  <p className="text-slate-400">{certData.user?.department}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Issuing Society</span>
                  <p className="font-extrabold text-slate-900 text-sm">{certData.club?.name}</p>
                  <p className="text-slate-500">Category: {certData.club?.category}</p>
                  <p className="text-slate-400">Date: {new Date(certData.issueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-1">
                <span className="text-indigo-800 font-bold uppercase text-[10px]">Achievement Scope:</span>
                <p className="text-slate-700 italic leading-relaxed">"{certData.achievement}"</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-400 border-t border-slate-100">
                <p className="font-mono">ID: <strong className="text-slate-800">{certData.certificateId}</strong></p>
                <p>Authorized: <strong className="text-slate-800">{certData.issuerName}</strong></p>
              </div>
            </div>
          </div>
        ) : notFound ? (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-3xl p-8 text-center space-y-3">
            <XCircle className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Certificate Not Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No verified record exists with ID "{searchId}". Please check the spelling or scan the original QR code.
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-600 max-w-4xl mx-auto pt-6 border-t border-slate-800">
        CampusHub Credential Verification Engine • University Club Governance System
      </div>
    </div>
  );
};

export default VerifyCertificatePublic;

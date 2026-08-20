import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles, AlertCircle, Shield, Award, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, switchDemoRole } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully', 'success', 'Welcome Back');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoEmail, demoPass = 'Admin@123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    try {
      await switchDemoRole(demoEmail, demoPass);
      showToast('Switched to demo account', 'success', 'Demo Access');
      navigate('/dashboard');
    } catch (err) {
      setError('Demo login failed. Make sure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-900 to-indigo-950 flex items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand Showcase */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/40">
              C
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                CampusHub <span className="text-xs bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full font-bold uppercase">SaaS</span>
              </h1>
              <p className="text-sm text-slate-400">Enterprise University Club & Activity Management</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              One centralized portal for recruitment, events & campus engagement.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Designed for modern university clubs, leaders, faculty interviewers, student volunteers, and university administrators.
            </p>
          </div>

          {/* Quick Demo Accounts Box */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300 uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              1-Click Demo Logins for Project Evaluation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleDemoClick('admin@campus.edu', 'Admin@123')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">University Admin</p>
                  <p className="text-[10px] text-slate-400">Dr. Sarah Jenkins</p>
                </div>
                <Shield className="h-4 w-4 text-rose-400" />
              </button>

              <button
                onClick={() => handleDemoClick('leader.tech@campus.edu', 'Leader@123')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">Club Leader</p>
                  <p className="text-[10px] text-slate-400">Alex (Tech Club)</p>
                </div>
                <Users className="h-4 w-4 text-amber-400" />
              </button>

              <button
                onClick={() => handleDemoClick('interviewer@campus.edu', 'Interviewer@123')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">Interviewer</p>
                  <p className="text-[10px] text-slate-400">Prof. David Zhao</p>
                </div>
                <BookOpen className="h-4 w-4 text-purple-400" />
              </button>

              <button
                onClick={() => handleDemoClick('student1@campus.edu', 'Student@123')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">Student (Eligible)</p>
                  <p className="text-[10px] text-slate-400">Emma (3.78 GPA)</p>
                </div>
                <Award className="h-4 w-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">Sign In to CampusHub</h3>
            <p className="text-xs text-slate-500 mt-1">Enter your university credentials to continue</p>
          </div>

          {error && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                University Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <LogIn className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Create student account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

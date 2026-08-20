import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  Menu,
  Shield,
  Layers,
  Award,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from './StatusBadge';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDemoSwitch = async (email) => {
    setShowRoleSwitcher(false);
    await switchDemoRole(email);
    navigate('/dashboard');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-black text-lg">
            C
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              CampusHub
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                SaaS
              </span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">University Club Management</p>
          </div>
        </Link>
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Role Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 hover:from-brand-100 hover:to-indigo-100 border border-brand-200/80 text-brand-800 text-xs font-semibold shadow-sm transition-all"
            title="Switch Demo Roles for Evaluation"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span className="hidden md:inline">Role Switcher:</span>
            <span className="font-bold">{user?.role}</span>
            <ChevronDown className="h-3 w-3 text-brand-500" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200/80 p-2 z-50 animate-fade-in text-xs">
              <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Role Switcher
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => handleDemoSwitch('admin@campus.edu')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                >
                  <span>University Admin</span>
                  <StatusBadge status="ADMIN" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('leader.tech@campus.edu')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                >
                  <span>Club Leader (Tech)</span>
                  <StatusBadge status="CLUB_LEADER" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('interviewer@campus.edu')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                >
                  <span>Faculty Interviewer</span>
                  <StatusBadge status="INTERVIEWER" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('student1@campus.edu')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                >
                  <span>Student (Eligible CS)</span>
                  <StatusBadge status="STUDENT" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('student2@campus.edu')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                >
                  <span>Student (Low CGPA)</span>
                  <StatusBadge status="STUDENT" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('volunteer@campus.edu')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                >
                  <span>Volunteer Star</span>
                  <StatusBadge status="STUDENT" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Points Badge (For Students) */}
        {user?.points !== undefined && (
          <Link
            to="/leaderboard"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm hover:bg-amber-100 transition-colors"
          >
            <Award className="h-3.5 w-3.5 text-amber-600" />
            <span>{user.points} pts</span>
          </Link>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        markAsRead(n._id);
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs ${
                        !n.isRead ? 'bg-indigo-50/40 font-medium' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="font-semibold text-slate-900">{n.title}</h5>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No notifications right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Popover */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff`}
              alt="Avatar"
              className="h-8 w-8 rounded-xl object-cover ring-2 ring-slate-200"
            />
            <div className="text-left hidden xl:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{user?.role}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden xl:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200/80 p-2 z-50 animate-fade-in text-xs">
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <StatusBadge status={user?.role} />
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile & Academic Info
              </Link>

              <Link
                to="/applications"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Layers className="h-4 w-4 text-slate-400" />
                My Applications
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-medium transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  PlusCircle,
  QrCode,
  HeartHandshake,
  Box,
  DollarSign,
  Trophy,
  Award,
  CalendarCheck,
  ShieldAlert,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isStudent, isLeader, isInterviewer, isAdmin } = useAuth();

  const navItems = [
    {
      section: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      section: 'CLUBS & RECRUITMENT',
      items: [
        { label: 'Explore Clubs', path: '/clubs', icon: Users },
        { label: 'My Applications', path: '/applications', icon: ClipboardList },
        ...(isLeader || isInterviewer
          ? [
              { label: 'Recruitment Desk', path: '/recruitment/manage', icon: UserCheck },
              { label: 'Interview Center', path: '/interviews', icon: CalendarCheck },
            ]
          : []),
      ],
    },
    {
      section: 'EVENTS & ATTENDANCE',
      items: [
        { label: 'Campus Events', path: '/events', icon: Calendar },
        ...(isLeader || isAdmin || user?.role === 'CLUB_MEMBER'
          ? [{ label: 'Create Proposal', path: '/events/create', icon: PlusCircle }]
          : []),
        { label: 'Attendance & Passes', path: '/attendance', icon: QrCode },
      ],
    },
    {
      section: 'OPERATIONS & DUTIES',
      items: [
        { label: 'Volunteer Hub', path: '/volunteers', icon: HeartHandshake },
        { label: 'Venues & Equipment', path: '/resources', icon: Box },
        ...(isLeader || isAdmin
          ? [{ label: 'Club Finance', path: '/finance', icon: DollarSign }]
          : []),
      ],
    },
    {
      section: 'RECOGNITION & REWARDS',
      items: [
        { label: 'Leaderboard & Badges', path: '/leaderboard', icon: Trophy },
        { label: 'Certificate Wallet', path: '/certificates', icon: Award },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-200 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/30">
            C
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              CampusHub
            </span>
            <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase">
              Club Management
            </span>
          </div>
        </div>

        {/* User Card Pill */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
            alt={user?.name}
            className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-600"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-brand-300 font-semibold uppercase tracking-wider">{user?.role}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.department}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-2 text-xs">
          {navItems.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {section.section}
              </p>
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    end={item.exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 bg-slate-950/40 text-center font-medium">
          CampusHub MERN Stack v1.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

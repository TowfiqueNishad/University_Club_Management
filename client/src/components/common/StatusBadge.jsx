import React from 'react';

const STATUS_STYLES = {
  // Recruitment & Applications
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ELIGIBLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INELIGIBLE: 'bg-rose-50 text-rose-700 border-rose-200',
  INTERVIEW_SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
  INTERVIEWED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
  WAITLISTED: 'bg-purple-50 text-purple-700 border-purple-200',
  WAITING: 'bg-purple-50 text-purple-700 border-purple-200',
  PROMOTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',

  // Events & Proposals
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUBLISHED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-slate-100 text-slate-800 border-slate-300',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Attendance
  REGISTERED: 'bg-sky-50 text-sky-700 border-sky-200',
  ATTENDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',

  // Volunteer & Duty
  ASSIGNED: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
  VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  PENDING_TARGET_ACCEPT: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING_LEADER_APPROVAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',

  // Roles
  STUDENT: 'bg-slate-100 text-slate-700 border-slate-300',
  CLUB_MEMBER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CLUB_LEADER: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
  INTERVIEWER: 'bg-purple-50 text-purple-700 border-purple-200',
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
};

const StatusBadge = ({ status, label, className = '' }) => {
  const normalized = (status || '').toUpperCase();
  const style = STATUS_STYLES[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const displayLabel = label || (status ? status.replace(/_/g, ' ') : 'N/A');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;

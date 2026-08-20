import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const MilestoneTracker = ({ milestones = [], onUpdateStatus, canEdit = false }) => {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No preparation milestones configured for this event yet.
      </div>
    );
  }

  // Calculate overall progress percentage
  const completedCount = milestones.filter((m) => m.status === 'COMPLETED').length;
  const overallProgress = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progress Bar Header */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
          <span>Overall Event Readiness</span>
          <span className="text-brand-600 font-bold">{overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-2.5">
        {milestones.map((m, idx) => (
          <div
            key={m._id || idx}
            className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {m.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : m.status === 'IN_PROGRESS' ? (
                  <Clock className="h-5 w-5 text-brand-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <h5 className="text-sm font-semibold text-slate-800">{m.title}</h5>
                {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span>Deadline: {new Date(m.deadline).toLocaleDateString()}</span>
                  {m.responsibleUser && (
                    <span>Owner: {m.responsibleUser.name || 'Assigned Member'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={m.status} />
              {canEdit && onUpdateStatus && (
                <select
                  value={m.status}
                  onChange={(e) => onUpdateStatus(m._id, e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELAYED">Delayed</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilestoneTracker;

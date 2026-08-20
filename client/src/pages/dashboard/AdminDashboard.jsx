import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  Award,
  DollarSign,
  Shield,
  Box,
  MapPin,
  CheckCircle2,
  PieChart as PieIcon,
} from 'lucide-react';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/system-overview');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load admin analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-700 border border-rose-200 shadow-sm">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Office of Student Affairs & Governance
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              University Admin Command Center
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              System-wide metrics, governance, resource controls, and campus event oversight.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/resources"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <MapPin className="h-4 w-4" />
            Manage Venues & Gear
          </Link>
          <Link
            to="/clubs"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all"
          >
            <Building2 className="h-4 w-4" />
            Clubs Directory
          </Link>
        </div>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Active Students"
          value={stats?.totalStudents || 0}
          subtitle="Enrolled club participants"
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Registered Clubs"
          value={stats?.totalClubs || 0}
          subtitle="Student societies & guilds"
          icon={Building2}
          color="emerald"
        />
        <MetricCard
          title="Campus Events"
          value={stats?.activeEvents || 0}
          subtitle="Scheduled & published"
          icon={Calendar}
          color="sky"
        />
        <MetricCard
          title="Total Campus Expenses"
          value={`$${stats?.totalExpenses || 0}`}
          subtitle="Approved club budgets"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Club Categories Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
          <h3 className="text-base font-bold text-slate-900 mb-1">Clubs by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution of student societies across domains</p>

          {stats?.categoryDistribution && stats.categoryDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs pt-2">
                {stats.categoryDistribution.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No category data available
            </div>
          )}
        </div>

        {/* Events by Type */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
          <h3 className="text-base font-bold text-slate-900 mb-1">Events by Format</h3>
          <p className="text-xs text-slate-500 mb-4">Volume of hackathons, workshops, and seminars</p>

          {stats?.eventTypeDistribution && stats.eventTypeDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventTypeDistribution}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No event type data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

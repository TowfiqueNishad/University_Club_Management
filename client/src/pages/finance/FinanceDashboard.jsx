import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  TrendingUp,
  PieChart as PieIcon,
  Receipt,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#94a3b8'];

const FinanceDashboard = () => {
  const { user, isLeader, isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Expense Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Food & Catering',
    amount: 150,
    date: new Date().toISOString().split('T')[0],
    event: '',
    notes: '',
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      if (res.data.success && res.data.data.length > 0) {
        setClubs(res.data.data);
        const firstId = res.data.data[0]._id;
        setSelectedClubId(firstId);
        loadFinanceData(firstId);
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceData = async (clubId) => {
    try {
      const [sumRes, expRes, evRes] = await Promise.all([
        api.get(`/finance/club/${clubId}/summary`),
        api.get(`/finance/club/${clubId}/expenses`),
        api.get(`/events?clubId=${clubId}`),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (expRes.data.success) setExpenses(expRes.data.data);
      if (evRes.data.success) setEvents(evRes.data.data);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    }
  };

  const handleClubChange = (clubId) => {
    setSelectedClubId(clubId);
    loadFinanceData(clubId);
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/finance/expenses', {
        ...expenseForm,
        club: selectedClubId,
        amount: Number(expenseForm.amount),
        event: expenseForm.event || null,
      });

      if (res.data.success) {
        showToast('Expense recorded successfully!', 'success');
        setShowAddModal(false);
        setExpenseForm({
          title: '',
          category: 'Food & Catering',
          amount: 150,
          date: new Date().toISOString().split('T')[0],
          event: '',
          notes: '',
        });
        loadFinanceData(selectedClubId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record expense', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Financial Health & Budgets
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Event Budget & Expense Monitoring</h1>
          <p className="text-xs text-slate-500 font-medium">
            Track planned allocations, recorded receipts, category breakdowns, and real-time burn rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {clubs.length > 0 && (
            <select
              value={selectedClubId}
              onChange={(e) => handleClubChange(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
            >
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}

          {(isLeader || isAdmin) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              Record Expense
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Allocated Budget"
          value={`$${summary?.totalAllocated || 5000}`}
          subtitle="University club allocation"
          icon={DollarSign}
          color="indigo"
        />
        <MetricCard
          title="Total Actual Spent"
          value={`$${summary?.totalSpent || 0}`}
          subtitle={`${summary?.burnRatePercentage || 0}% budget consumed`}
          icon={Receipt}
          color="amber"
        />
        <MetricCard
          title="Remaining Balance"
          value={`$${summary?.remaining || 0}`}
          subtitle={summary?.isOverBudget ? 'OVER BUDGET' : 'Under budget budget healthy'}
          icon={TrendingUp}
          color={summary?.isOverBudget ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Expenses Count"
          value={expenses.length}
          subtitle="Logged & approved invoices"
          icon={Receipt}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
          <h3 className="text-base font-bold text-slate-900 mb-1">Expenses by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown of catering, AV, venue & marketing</p>

          {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {summary.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs pt-2">
                {summary.categoryBreakdown.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span>{entry.category}: ${entry.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No expenses recorded yet.
            </div>
          )}
        </div>

        {/* Burn Rate Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-1">Budget Burn Rate & Health</h3>
          <p className="text-xs text-slate-500">Real-time expenditure tracking vs financial limit</p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span>Allocated vs Consumed</span>
              <span className="text-brand-600">{summary?.burnRatePercentage || 0}% Spent</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full ${
                  (summary?.burnRatePercentage || 0) > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, summary?.burnRatePercentage || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Total Spent: ${summary?.totalSpent || 0}</span>
              <span>Available: ${summary?.remaining || 0}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <h4 className="font-bold">Financial Policy & Governance:</h4>
            <p className="text-[11px] text-indigo-800">
              All expenses above $50 require verified digital receipts. Invoices are reviewed by the University Student Council during the semester audit.
            </p>
          </div>
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900">Recorded Expenses Log</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.length > 0 ? (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{exp.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.event?.title || 'General Club Operations'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{exp.date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.recordedBy?.name || 'Executive'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record Club Expense"
          subtitle="Log invoice details against allocated budget"
        >
          <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Expense Title *</label>
              <input
                type="text"
                required
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                placeholder="e.g. Lunch boxes for Hackathon mentors"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none font-medium"
                >
                  <option value="Food & Catering">Food & Catering</option>
                  <option value="Venue">Venue</option>
                  <option value="Marketing & Promo">Marketing & Promo</option>
                  <option value="Equipment & AV">Equipment & AV</option>
                  <option value="Prizes & Swag">Prizes & Swag</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Amount (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={1}
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Associated Event</label>
                <select
                  value={expenseForm.event}
                  onChange={(e) => setExpenseForm({ ...expenseForm, event: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                >
                  <option value="">-- None / Club Operations --</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Notes / Invoice Ref</label>
              <textarea
                rows={2}
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Invoice #INV-2026-99..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20"
              >
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FinanceDashboard;

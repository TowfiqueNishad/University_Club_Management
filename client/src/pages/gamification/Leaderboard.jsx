import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  Flame,
  Crown,
  Sparkles,
  Footprints,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'badges'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      const [leadRes, badgeRes] = await Promise.all([
        api.get('/gamification/leaderboard'),
        api.get('/gamification/badges'),
      ]);

      if (leadRes.data.success) setLeaderboard(leadRes.data.data);
      if (badgeRes.data.success) setBadges(badgeRes.data.data);
    } catch (error) {
      console.error('Failed to load gamification metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-brand-600 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
            Student Recognition & Gamification
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Campus Leaderboard & Badges</h1>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Earn points by attending workshops, leading projects, and volunteering for campus events.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-200">Your Current Points</span>
          <p className="text-2xl font-black">{user?.points || 0} pts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Campus Rankings ({leaderboard.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'badges'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Achievement Badges ({badges.length})
        </button>
      </div>

      {/* Tab 1: Leaderboard Podium + Table */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Rank 2 - Silver */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col items-center text-center order-2 md:order-1 relative">
                <div className="absolute -top-3 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-black">
                  #2 SILVER
                </div>
                <img
                  src={topThree[1].user?.avatar || 'https://via.placeholder.com/80'}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-200 mt-2"
                />
                <h3 className="font-extrabold text-base text-slate-900 mt-3">{topThree[1].user?.name}</h3>
                <p className="text-xs text-slate-500">{topThree[1].user?.department}</p>
                <p className="text-xl font-black text-brand-600 mt-2">{topThree[1].points} pts</p>
              </div>

              {/* Rank 1 - Gold (Elevated) */}
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-300 shadow-xl flex flex-col items-center text-center order-1 md:order-2 md:-mt-4 relative">
                <Crown className="h-8 w-8 text-amber-500 absolute -top-5" />
                <div className="absolute -top-3 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-md">
                  #1 CHAMPION
                </div>
                <img
                  src={topThree[0].user?.avatar || 'https://via.placeholder.com/90'}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-amber-400 shadow-md mt-3"
                />
                <h3 className="font-extrabold text-lg text-slate-900 mt-3">{topThree[0].user?.name}</h3>
                <p className="text-xs text-slate-500">{topThree[0].user?.department}</p>
                <p className="text-2xl font-black text-amber-600 mt-2">{topThree[0].points} pts</p>
                <span className="mt-2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
                  {topThree[0].eventsAttended} Events • {topThree[0].dutiesCompleted} Duties
                </span>
              </div>

              {/* Rank 3 - Bronze */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col items-center text-center order-3 md:order-3 relative">
                <div className="absolute -top-3 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                  #3 BRONZE
                </div>
                <img
                  src={topThree[2].user?.avatar || 'https://via.placeholder.com/80'}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-amber-200 mt-2"
                />
                <h3 className="font-extrabold text-base text-slate-900 mt-3">{topThree[2].user?.name}</h3>
                <p className="text-xs text-slate-500">{topThree[2].user?.department}</p>
                <p className="text-xl font-black text-brand-600 mt-2">{topThree[2].points} pts</p>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">All Student Rankings</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Events Attended</th>
                    <th className="py-3 px-4">Duties Completed</th>
                    <th className="py-3 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leaderboard.map((row) => (
                    <tr
                      key={row.user?._id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        row.user?._id === user?._id ? 'bg-indigo-50/40 font-bold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        #{row.rank}
                      </td>
                      <td className="py-3.5 px-4 flex items-center gap-2.5">
                        <img
                          src={row.user?.avatar || 'https://via.placeholder.com/35'}
                          alt=""
                          className="h-8 w-8 rounded-xl object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{row.user?.name}</span>
                          {row.user?._id === user?._id && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 text-[10px] font-bold">
                              You
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400">{row.user?.studentId}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{row.user?.department}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{row.eventsAttended}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{row.dutiesCompleted}</td>
                      <td className="py-3.5 px-4 text-right font-black text-brand-600 text-sm">
                        {row.points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Badges Catalog */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge._id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
                badge.isUnlocked
                  ? 'bg-white border-brand-200 shadow-card'
                  : 'bg-slate-50/80 border-slate-200/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                      badge.isUnlocked
                        ? 'bg-amber-50 text-amber-600 shadow-sm ring-2 ring-amber-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Award className="h-6 w-6" />
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      badge.isUnlocked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {badge.isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-extrabold text-base text-slate-900">{badge.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{badge.description}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">Required Points</span>
                  <span className="text-slate-900">{badge.pointsRequirement} pts</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

type Period = 'all' | '90' | '60' | '30' | '7';
type Character = 'all' | 'mila' | 'elena';

interface DailyData {
  date: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  posts: number;
}

interface TopPost {
  id: string;
  date: string;
  impressions: number;
  likes: number;
  caption: string;
  character: string;
}

interface AnalyticsData {
  daily: DailyData[];
  totals: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    posts: number;
  };
  changes: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    posts: number;
  };
  engagementRate: number;
  engagementChange: number;
  topPosts: TopPost[];
  bestLocation: { name: string; avgImpressions: number } | null;
  bestHour: { hour: number; avgImpressions: number } | null;
  followersGrowth: number | null;
  followersTimeline: { date: string; followers: number; character: string }[];
  currentFollowers: number | null;
}

interface SyncResult {
  character: string;
  success: boolean;
  message: string;
  updated?: number;
  inserted?: number;
  followers?: number;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7');
  const [character, setCharacter] = useState<Character>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = period === 'all' ? 365 : parseInt(period);
      const res = await fetch(`/api/analytics?days=${days}&character=${character}`);
      const json = await res.json();
      
      // Check if response is an error
      if (json.error || !json.totals) {
        console.error('Analytics API error:', json.error || 'Invalid response');
        setData(null);
      } else {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setData(null);
    }
    setLoading(false);
  }, [period, character]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check last sync on mount
  useEffect(() => {
    fetch('/api/sync-analytics')
      .then(r => r.json())
      .then(d => setLastSync(d.lastSync))
      .catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults(null);
    
    try {
      const res = await fetch(`/api/sync-analytics?character=${character}`, { method: 'POST' });
      const json = await res.json();
      setSyncResults(json.results);
      setLastSync(json.syncedAt);
      
      // Refresh data after sync
      await fetchData();
    } catch (error) {
      setSyncResults([{ character: 'error', success: false, message: 'Sync failed' }]);
    }
    
    setSyncing(false);
  };

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-slate-400 hover:text-white text-sm mb-2 inline-block transition-colors">
              ← Retour
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight">📊 Analytics</h1>
            <p className="text-slate-400 mt-1">Performance des comptes Instagram</p>
          </div>
          
          {/* Sync Button */}
          <div className="text-right">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`px-5 py-2.5 rounded-xl font-medium text-white transition-all ${
                syncing
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600 shadow-lg shadow-violet-500/25'
              }`}
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Sync en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  🔄 Sync Instagram
                </span>
              )}
            </button>
            {lastSync && (
              <p className="text-slate-500 text-xs mt-2">
                Dernière sync : {new Date(lastSync).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        {/* Sync Results */}
        {syncResults && (
          <div className="mb-6 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Résultats de la synchronisation</h3>
            <div className="flex flex-wrap gap-4">
              {syncResults.map((result, i) => (
                <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${
                  result.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  <span className="font-medium">{result.character}</span>: {result.message}
                  {result.followers && <span className="ml-2">👥 {result.followers.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Period Selector */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            {(['all', '90', '60', '30', '7'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'Tout' : `${p}j`}
              </button>
            ))}
          </div>

          {/* Character Selector */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            {(['all', 'mila', 'elena'] as Character[]).map((c) => (
              <button
                key={c}
                onClick={() => setCharacter(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  character === c
                    ? c === 'mila' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : c === 'elena' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c === 'all' ? 'Tous' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <KPICard label="Impressions" value={formatNumber(data.totals.impressions)} icon="👁️" color="violet" change={data.changes.impressions} />
              <KPICard label="Reach" value={formatNumber(data.totals.reach)} icon="📡" color="blue" change={data.changes.reach} />
              <KPICard label="Likes" value={formatNumber(data.totals.likes)} icon="❤️" color="rose" change={data.changes.likes} />
              <KPICard label="Engagement Rate" value={`${data.engagementRate}%`} icon="📊" color="emerald" change={data.engagementChange} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPICard label="Comments" value={formatNumber(data.totals.comments)} icon="💬" color="amber" change={data.changes.comments} />
              <KPICard label="Saves" value={formatNumber(data.totals.saves)} icon="🔖" color="teal" change={data.changes.saves} />
              <KPICard label="Posts" value={data.totals.posts.toString()} icon="📸" color="slate" change={data.changes.posts} />
              {data.bestHour && (
                <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 rounded-xl p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⏰</span>
                    <span className="text-slate-400 text-sm">Meilleure heure</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{data.bestHour.hour}h</p>
                  <p className="text-xs text-slate-500">{formatNumber(data.bestHour.avgImpressions)} views/post</p>
                </div>
              )}
            </div>

            {/* Followers Card */}
            {data.currentFollowers && (
              <div className="bg-gradient-to-r from-violet-500/10 to-rose-500/10 rounded-2xl p-6 border border-violet-500/20 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Followers actuels</p>
                    <p className="text-4xl font-bold text-white">{formatNumber(data.currentFollowers)}</p>
                  </div>
                  {data.followersGrowth !== null && (
                    <div className={`text-right ${data.followersGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <p className="text-sm">Période sélectionnée</p>
                      <p className="text-2xl font-bold">
                        {data.followersGrowth >= 0 ? '+' : ''}{formatNumber(data.followersGrowth)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Chart - Impressions over time */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">📈 Évolution des impressions</h2>
              {data.daily.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.daily}>
                      <defs>
                        <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatNumber} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px' }}
                        labelStyle={{ color: '#f8fafc' }}
                        formatter={(value: number | undefined) => [formatNumber(value ?? 0), 'Impressions']}
                        labelFormatter={formatDate}
                      />
                      <Area type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} fill="url(#impressionsGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  Aucune donnée pour cette période
                </div>
              )}
            </div>

            {/* Secondary Chart - Engagement metrics */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">💖 Engagement par jour</h2>
              {data.daily.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatNumber} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px' }}
                        labelStyle={{ color: '#f8fafc' }}
                        labelFormatter={formatDate}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="likes" name="Likes" stroke="#f43f5e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="comments" name="Comments" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="saves" name="Saves" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  Aucune donnée pour cette période
                </div>
              )}
            </div>

            {/* Followers Growth Chart */}
            {data.followersTimeline.length > 0 && (
              <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">👥 Évolution Followers</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.followersTimeline}>
                      <defs>
                        <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px' }}
                        labelStyle={{ color: '#f8fafc' }}
                        formatter={(value: number | undefined) => [value ?? 0, 'Followers']}
                        labelFormatter={formatDate}
                      />
                      <Area type="monotone" dataKey="followers" stroke="#10b981" strokeWidth={2} fill="url(#followersGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Performing Posts */}
            {data.topPosts.length > 0 && (
              <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">🏆 Top Posts</h2>
                <div className="space-y-3">
                  {data.topPosts.map((post, i) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-amber-500 text-black' : 
                        i === 1 ? 'bg-slate-300 text-black' : 
                        i === 2 ? 'bg-amber-700 text-white' : 
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{post.caption || 'Sans caption'}</p>
                        <p className="text-slate-500 text-xs">
                          {new Date(post.date).toLocaleDateString('fr-FR')} • 
                          <span className={post.character === 'mila' ? 'text-rose-400' : 'text-amber-400'}> {post.character}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatNumber(post.impressions)}</p>
                        <p className="text-slate-500 text-xs">views</p>
                      </div>
                      <div className="text-right">
                        <p className="text-rose-400 font-medium">{post.likes}</p>
                        <p className="text-slate-500 text-xs">likes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Location Card */}
            {data.bestLocation && data.bestLocation.name !== 'Unknown' && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📍</span>
                  <div>
                    <p className="text-slate-400 text-sm">Meilleur lieu</p>
                    <p className="text-2xl font-bold text-white">{data.bestLocation.name}</p>
                    <p className="text-cyan-400 text-sm">{formatNumber(data.bestLocation.avgImpressions)} views/post en moyenne</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-slate-400 text-center py-16">
            <p className="text-6xl mb-4">📭</p>
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </main>
  );
}

function KPICard({ label, value, icon, color, change }: { label: string; value: string; icon: string; color: string; change?: number }) {
  const colorClasses: Record<string, string> = {
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    slate: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-slate-400 text-sm">{label}</span>
        </div>
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            change > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}


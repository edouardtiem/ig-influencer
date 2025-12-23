'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Character = 'all' | 'mila' | 'elena';
type Status = 'scheduled' | 'generating' | 'images_ready' | 'posting' | 'posted' | 'failed';

interface ScheduledPost {
  id: string;
  character: string;
  scheduled_date: string;
  scheduled_time: string;
  status: Status;
  post_type: string;
  reel_type: string | null;
  location_name: string | null;
  caption: string | null;
  image_urls: string[] | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
}

interface DayPosts {
  date: string;
  dayName: string;
  isToday: boolean;
  posts: ScheduledPost[];
  stats: {
    total: number;
    posted: number;
    pending: number;
    failed: number;
  };
}

interface CalendarData {
  startDate: string;
  endDate: string;
  today: string;
  character: string;
  days: DayPosts[];
  totals: {
    total: number;
    posted: number;
    scheduled: number;
    generating: number;
    images_ready: number;
    posting: number;
    failed: number;
  };
}

const STATUS_CONFIG: Record<Status, { icon: string; color: string; bg: string; pulse?: boolean }> = {
  scheduled: { icon: '⏳', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  generating: { icon: '🎨', color: 'text-amber-400', bg: 'bg-amber-500/20', pulse: true },
  images_ready: { icon: '📦', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  posting: { icon: '📤', color: 'text-violet-400', bg: 'bg-violet-500/20', pulse: true },
  posted: { icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { icon: '❌', color: 'text-rose-400', bg: 'bg-rose-500/20' },
};

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}>
      {config.icon}
    </span>
  );
}

function PostCard({ post, expanded, onToggle }: { post: ScheduledPost; expanded: boolean; onToggle: () => void }) {
  const config = STATUS_CONFIG[post.status];
  const time = post.scheduled_time.substring(0, 5);
  const typeLabel = post.post_type === 'reel' ? `reel ${post.reel_type || ''}` : 'carousel';
  
  return (
    <div 
      className={`rounded-lg border transition-all cursor-pointer ${
        post.character === 'mila' 
          ? 'border-rose-500/30 hover:border-rose-500/50' 
          : 'border-amber-500/30 hover:border-amber-500/50'
      } ${config.bg}`}
      onClick={onToggle}
    >
      <div className="p-2 flex items-center gap-2">
        <StatusBadge status={post.status} />
        <span className="text-white font-mono text-sm">{time}</span>
        <span className={`text-xs ${post.character === 'mila' ? 'text-rose-400' : 'text-amber-400'}`}>
          {post.character.charAt(0).toUpperCase()}
        </span>
      </div>
      
      {expanded && (
        <div className="px-2 pb-2 space-y-1 border-t border-slate-700/50 pt-2 mt-1">
          <div className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">{typeLabel}</span>
          </div>
          {post.location_name && (
            <div className="text-xs text-slate-400 truncate">
              📍 {post.location_name}
            </div>
          )}
          {post.caption && (
            <div className="text-xs text-slate-500 truncate">
              💬 {post.caption.substring(0, 50)}...
            </div>
          )}
          {post.status === 'failed' && post.error_message && (
            <div className="text-xs text-rose-400 truncate">
              ⚠️ {post.error_message.substring(0, 40)}...
              <span className="text-slate-500"> (retry {post.retry_count}/{post.max_retries})</span>
            </div>
          )}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="flex gap-1 mt-1">
              {post.image_urls.slice(0, 3).map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt="" 
                  className="w-10 h-10 rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayColumn({ day, expandedPost, onTogglePost }: { 
  day: DayPosts; 
  expandedPost: string | null;
  onTogglePost: (id: string) => void;
}) {
  const dateNum = new Date(day.date + 'T12:00:00').getDate();
  
  return (
    <div className={`flex-1 min-w-[120px] ${day.isToday ? 'ring-2 ring-violet-500 rounded-xl' : ''}`}>
      {/* Day Header */}
      <div className={`text-center py-2 rounded-t-xl ${day.isToday ? 'bg-violet-500/20' : 'bg-slate-800/50'}`}>
        <div className={`text-xs font-medium ${day.isToday ? 'text-violet-400' : 'text-slate-400'}`}>
          {day.dayName}
        </div>
        <div className={`text-lg font-bold ${day.isToday ? 'text-white' : 'text-slate-300'}`}>
          {dateNum}
        </div>
      </div>
      
      {/* Posts */}
      <div className={`p-2 space-y-2 min-h-[200px] rounded-b-xl ${day.isToday ? 'bg-slate-800/30' : 'bg-slate-900/30'}`}>
        {day.posts.length === 0 ? (
          <div className="text-center text-slate-600 text-xs py-4">
            Aucun post
          </div>
        ) : (
          day.posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              expanded={expandedPost === post.id}
              onToggle={() => onTogglePost(post.id)}
            />
          ))
        )}
      </div>
      
      {/* Stats Footer */}
      {day.stats.total > 0 && (
        <div className="text-center py-1 text-xs text-slate-500">
          {day.stats.posted}/{day.stats.total}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [character, setCharacter] = useState<Character>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    // Calculate week dates based on offset
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset + (weekOffset * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

    try {
      const res = await fetch(`/api/calendar-posts?start=${startDate}&end=${endDate}&character=${character}`);
      const json = await res.json();
      
      if (json.error) {
        console.error('Calendar API error:', json.error);
        setData(null);
      } else {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      setData(null);
    }
    
    setLoading(false);
    setLastUpdate(new Date());
  }, [character, weekOffset]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTogglePost = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const formatWeekRange = () => {
    if (!data) return '';
    const start = new Date(data.startDate + 'T12:00:00');
    const end = new Date(data.endDate + 'T12:00:00');
    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  };

  // Get today's posts for detail panel
  const todayData = data?.days.find(d => d.isToday);
  const todayMila = todayData?.posts.filter(p => p.character === 'mila') || [];
  const todayElena = todayData?.posts.filter(p => p.character === 'elena') || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-slate-400 hover:text-white text-sm mb-2 inline-block transition-colors">
              ← Retour
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">📅 Calendar</h1>
            <p className="text-slate-400 text-sm mt-1">Suivi des posts programmés</p>
          </div>
          
          {/* Last update indicator */}
          <div className="text-right">
            <div className="text-xs text-slate-500">
              Mise à jour: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => fetchData()}
              className="mt-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Filters & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Character Filter */}
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

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              ←
            </button>
            <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white text-sm font-medium min-w-[160px] text-center">
              {formatWeekRange()}
            </div>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              →
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-2 rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 hover:bg-violet-500/30 text-sm transition-all"
              >
                Aujourd&apos;hui
              </button>
            )}
          </div>
        </div>

        {/* Status Summary */}
        {data && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
              ✅ {data.totals.posted} posted
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-400 text-sm">
              ⏳ {data.totals.scheduled} scheduled
            </div>
            {data.totals.generating > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm animate-pulse">
                🎨 {data.totals.generating} generating
              </div>
            )}
            {data.totals.images_ready > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm">
                📦 {data.totals.images_ready} ready
              </div>
            )}
            {data.totals.failed > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm">
                ❌ {data.totals.failed} failed
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          </div>
        ) : data ? (
          <>
            {/* Week Grid */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {data.days.map(day => (
                <DayColumn 
                  key={day.date} 
                  day={day} 
                  expandedPost={expandedPost}
                  onTogglePost={handleTogglePost}
                />
              ))}
            </div>

            {/* Today's Detail Panel */}
            {todayData && todayData.posts.length > 0 && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  📊 Aujourd&apos;hui
                  <span className="text-sm font-normal text-slate-400">
                    {todayData.stats.posted}/{todayData.stats.total} posted
                  </span>
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Mila */}
                  {(character === 'all' || character === 'mila') && todayMila.length > 0 && (
                    <div>
                      <h3 className="text-rose-400 font-medium mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        MILA
                      </h3>
                      <div className="space-y-2">
                        {todayMila.map(post => (
                          <div 
                            key={post.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-rose-500/20"
                          >
                            <StatusBadge status={post.status} />
                            <span className="text-white font-mono text-sm">
                              {post.scheduled_time.substring(0, 5)}
                            </span>
                            <span className="text-slate-400 text-sm">
                              {post.post_type}
                            </span>
                            <span className="text-slate-500 text-xs truncate flex-1">
                              {post.location_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Elena */}
                  {(character === 'all' || character === 'elena') && todayElena.length > 0 && (
                    <div>
                      <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        ELENA
                      </h3>
                      <div className="space-y-2">
                        {todayElena.map(post => (
                          <div 
                            key={post.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-amber-500/20"
                          >
                            <StatusBadge status={post.status} />
                            <span className="text-white font-mono text-sm">
                              {post.scheduled_time.substring(0, 5)}
                            </span>
                            <span className="text-slate-400 text-sm">
                              {post.post_type}
                            </span>
                            <span className="text-slate-500 text-xs truncate flex-1">
                              {post.location_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-500 text-lg mb-2">Aucune donnée disponible</div>
            <p className="text-slate-600 text-sm">
              Les posts apparaîtront ici une fois programmés par le scheduler.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}


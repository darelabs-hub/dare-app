import React, { useState, useMemo } from 'react';
import { DareItem, UserProfile } from '../types';
import { Calendar, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface DareActivityHeatmapProps {
  user: UserProfile;
  dares: DareItem[];
}

interface HeatmapDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  count: number;
  weekday: number;
  dayOfMonth: number;
  monthLabel: string;
}

export const DareActivityHeatmap: React.FC<DareActivityHeatmapProps> = ({ user, dares }) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // Generate the last 30 days ending today (dynamic or stable 2026-09-21)
  const heatmapData = useMemo(() => {
    // We use the current system date or default to 2026-09-21
    const baseDate = new Date();
    // Validate if baseDate is sensible, otherwise default
    const today = baseDate.getFullYear() >= 2026 ? baseDate : new Date('2026-09-21T12:00:00');
    
    const days: HeatmapDay[] = [];
    
    // Generate exactly 30 days in reverse, then reverse to chronological order
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const weekday = d.getDay();
      const dayOfMonth = d.getDate();
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      
      // Determine count of completed dares on this day:
      // Check real dares completed by this user
      const count = dares.filter(dare => {
        if (dare.status !== 'verified') return false;
        // Verify submitter matches user handle or ID
        const submitterMatches = 
          (dare.proof?.submittedByHandle && dare.proof.submittedByHandle.toLowerCase() === user.handle.toLowerCase()) ||
          (dare.acceptedBy && dare.acceptedBy.id === user.id);
        if (!submitterMatches) return false;
        
        // Match dateStr
        const submittedDateStr = dare.proof?.submittedAt ? dare.proof.submittedAt.split('T')[0] : '';
        return submittedDateStr === dateStr;
      }).length;
      
      days.push({
        date: d,
        dateStr,
        count,
        weekday,
        dayOfMonth,
        monthLabel,
      });
    }
    
    return days;
  }, [user.id, user.handle, user.completedDaresCount, dares]);

  // Total active days and maximum in a single day
  const stats = useMemo(() => {
    const totalCompletions = heatmapData.reduce((acc, curr) => acc + curr.count, 0);
    const activeDays = heatmapData.filter(d => d.count > 0).length;
    const maxInDay = Math.max(...heatmapData.map(d => d.count), 0);
    
    // Calculate streak
    let currentStreak = user.streak || 0;
    
    return {
      totalCompletions,
      activeDays,
      maxInDay,
      currentStreak
    };
  }, [heatmapData, user.streak]);

  // Get color scale for a given count
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-[#1e293b]/30 border-slate-800 hover:border-slate-700';
    if (count === 1) return 'bg-indigo-950/80 text-indigo-400 border-indigo-900/40 hover:bg-indigo-900/50 hover:border-indigo-500/40';
    if (count === 2) return 'bg-indigo-800/80 text-indigo-200 border-indigo-700/50 hover:bg-indigo-700/90 hover:border-indigo-400/50';
    return 'bg-indigo-600 text-white border-indigo-500/60 hover:bg-indigo-500 hover:border-indigo-300';
  };

  // Group by week for layout or render a continuous flexible grid
  // A clean grid layout with 30 items
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Dare Activity Heatmap (Last 30 Days)
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Syncing Live Grid Telemetry</span>
        </div>
      </div>

      {/* Grid container */}
      <div className="relative">
        
        {/* Heatmap Grid */}
        <div className="flex flex-col space-y-2">
          {/* Calendar boxes */}
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2 justify-items-center">
            {heatmapData.map((day, idx) => {
              const colorClass = getCellColor(day.count);
              const isHovered = hoveredDay?.dateStr === day.dateStr;
              
              return (
                <div
                  key={day.dateStr}
                  className="relative group shrink-0"
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex flex-col items-center justify-center border text-[10px] font-mono font-medium transition-all cursor-help ${colorClass} ${
                      isHovered ? 'ring-2 ring-indigo-400/50 scale-105 shadow-md shadow-indigo-500/10' : ''
                    }`}
                  >
                    <span>{day.dayOfMonth}</span>
                    {day.count > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 h-1 w-1 rounded-full bg-indigo-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month markers at the bottom */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1.5 px-1 select-none border-t border-slate-800/30">
            <span>{heatmapData[0]?.monthLabel} {heatmapData[0]?.dayOfMonth}</span>
            <span>Middle Sector</span>
            <span>Today ({heatmapData[29]?.monthLabel} {heatmapData[29]?.dayOfMonth})</span>
          </div>
        </div>

        {/* Dynamic Tooltip Block (Integrated, high contrast, non-floating to avoid clipping bugs) */}
        <div className="mt-4 min-h-[44px] rounded-lg border border-slate-800/80 bg-slate-950/60 p-2 px-3 text-xs flex items-center justify-between transition-all">
          {hoveredDay ? (
            <div className="flex items-center justify-between w-full">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-200">
                  {hoveredDay.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  TARGET TIMEFRAME • TELEMETRY ACTIVE
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${
                  hoveredDay.count > 0 ? 'bg-indigo-500/10 text-indigo-300' : 'bg-slate-800/40 text-slate-400'
                }`}>
                  {hoveredDay.count === 0 ? 'No completed dares' : `${hoveredDay.count} dare${hoveredDay.count > 1 ? 's' : ''} completed`}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-slate-400">
              <span className="text-[11px] flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                <span>Hover over individual daily nodes to view completion telemetry</span>
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span>Less</span>
                <span className="h-2.5 w-2.5 rounded-sm bg-[#1e293b]/30 border border-slate-800" />
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-950 border border-indigo-900/40" />
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-800 border border-indigo-700/50" />
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 border border-indigo-500/60" />
                <span>More</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Quick Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/50">
        <div className="text-center p-2 rounded-lg bg-[#0d111c]/40 border border-slate-800/40">
          <p className="text-[10px] text-slate-400 font-mono uppercase">Completed Count</p>
          <p className="text-base font-mono font-bold text-indigo-400 mt-0.5">
            {stats.totalCompletions} <span className="text-[10px] text-slate-500 font-normal">DARES</span>
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[#0d111c]/40 border border-slate-800/40">
          <p className="text-[10px] text-slate-400 font-mono uppercase">Active Ratio</p>
          <p className="text-base font-mono font-bold text-slate-300 mt-0.5">
            {Math.round((stats.activeDays / 30) * 100)}% <span className="text-[10px] text-slate-500 font-normal">DAYS</span>
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[#0d111c]/40 border border-slate-800/40">
          <p className="text-[10px] text-slate-400 font-mono uppercase">Current Streak</p>
          <p className="text-base font-mono font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
            <span>{stats.currentStreak}</span>
            <span className="text-[10px] text-slate-500 font-normal">DAYS</span>
          </p>
        </div>
      </div>
    </div>
  );
};

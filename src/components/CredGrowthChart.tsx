import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Sparkles, Zap, Award } from 'lucide-react';
import { UserProfile, DareItem } from '../types';

export interface CredGrowthChartProps {
  user: UserProfile;
  dares?: DareItem[];
  className?: string;
}

export interface CredHistoryDay {
  dayIndex: number;
  date: string;
  fullDate: string;
  cred: number;
  change: number;
  milestone?: string;
}

/**
 * Generates an authentic 30-day cumulative Cred growth history curve
 * matching the user's current Cred balance and completed challenges.
 */
export const generate30DayCredHistory = (
  user: UserProfile, 
  dares?: DareItem[]
): CredHistoryDay[] => {
  const totalCred = Math.max(0, user.cred || 0);
  const today = new Date();

  // Generate 30 daily delta allocations
  const deltas: number[] = new Array(30).fill(0);
  const milestones: (string | undefined)[] = new Array(30).fill(undefined);

  // Check user completed dares within the last 30 days
  const userHandleLower = (user.handle || '').toLowerCase();
  const userCompleted = (dares || []).filter(
    d =>
      d.status === 'verified' &&
      (d.acceptedBy?.id === user.id ||
        (d.proof?.submittedByHandle && d.proof.submittedByHandle.toLowerCase() === userHandleLower))
  );

  let allocatedFromCompleted = 0;
  userCompleted.forEach((dare) => {
    if (dare.proof?.submittedAt) {
      const submitDate = new Date(dare.proof.submittedAt);
      const diffDays = Math.floor((today.getTime() - submitDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        const slot = 29 - diffDays;
        const reward = dare.rewardCred || 25;
        deltas[slot] += reward;
        milestones[slot] = dare.title;
        allocatedFromCompleted += reward;
      }
    }
  });

  const startingBaseline = Math.max(0, totalCred - allocatedFromCompleted);

  // Build cumulative 30-day points
  let currentCumulative = startingBaseline;
  const history: CredHistoryDay[] = [];

  for (let i = 29; i >= 0; i--) {
    const dayIndex = 29 - i;
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    currentCumulative += deltas[dayIndex];
    if (i === 0) {
      currentCumulative = totalCred;
    }

    history.push({
      dayIndex,
      date: dateLabel,
      fullDate: fullDateLabel,
      cred: currentCumulative,
      change: deltas[dayIndex],
      milestone: milestones[dayIndex],
    });
  }

  return history;
};

const CustomCredTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: CredHistoryDay = payload[0].payload;
    return (
      <div className="rounded-xl border border-indigo-500/40 bg-slate-950/95 p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-md min-w-[150px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            {data.date}
          </span>
          {data.change > 0 && (
            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 rounded">
              +{data.change} CRED
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-400">Total Balance:</span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {data.cred} Cred
          </span>
        </div>

        {data.milestone && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center gap-1 text-[9px] font-mono text-amber-300 truncate max-w-[160px]">
            <Award className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="truncate">{data.milestone}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const CredGrowthChart: React.FC<CredGrowthChartProps> = ({
  user,
  dares,
  className = '',
}) => {
  const historyData = useMemo(() => {
    return generate30DayCredHistory(user, dares);
  }, [user, dares]);

  // Compute 30-day stats
  const startCred = historyData[0]?.cred || 0;
  const currentCred = historyData[historyData.length - 1]?.cred || user.cred || 0;
  const net30DayGain = Math.max(0, currentCred - startCred);
  const percentageGrowth = startCred > 0 
    ? Math.round((net30DayGain / startCred) * 100) 
    : net30DayGain > 0 ? 100 : 0;

  const peakSingleDay = useMemo(() => {
    return Math.max(0, ...historyData.map(d => d.change));
  }, [historyData]);

  const activeDaysCount = useMemo(() => {
    return historyData.filter(d => d.change > 0).length;
  }, [historyData]);

  return (
    <div 
      id="cred-growth-visualization"
      className={`rounded-2xl border border-slate-800/80 bg-[#0c1224]/80 p-4 relative overflow-hidden backdrop-blur-sm ${className}`}
    >
      {/* Background Cyber Ambient Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Header with Title and 30-Day Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>Cred Growth</span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                30-Day Telemetry
              </span>
            </h4>
          </div>
        </div>

        {/* 30-Day Velocity Pill */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
            <Sparkles className="h-2.5 w-2.5" />
            +{net30DayGain} Cred ({percentageGrowth >= 0 ? `+${percentageGrowth}%` : `${percentageGrowth}%`})
          </span>
        </div>
      </div>

      {/* Mini Stats Sub-Bar */}
      <div className="grid grid-cols-3 gap-2 mb-3 pt-2 border-t border-slate-800/60 text-center">
        <div className="bg-slate-900/40 rounded-lg p-1.5 border border-slate-800/50">
          <p className="text-[9px] font-mono text-slate-500 uppercase">30D Gain</p>
          <p className="text-xs font-mono font-bold text-emerald-400">+{net30DayGain}</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-1.5 border border-slate-800/50">
          <p className="text-[9px] font-mono text-slate-500 uppercase">Peak Day</p>
          <p className="text-xs font-mono font-bold text-cyan-400">+{peakSingleDay}</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-1.5 border border-slate-800/50">
          <p className="text-[9px] font-mono text-slate-500 uppercase">Active Days</p>
          <p className="text-xs font-mono font-bold text-indigo-300">{activeDaysCount} / 30</p>
        </div>
      </div>

      {/* Mini-Line Chart Canvas */}
      <div className="h-36 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={historyData}
            margin={{ top: 8, right: 10, left: -22, bottom: 0 }}
          >
            <defs>
              <linearGradient id="credGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#1e293b" 
              opacity={0.35} 
            />

            <XAxis
              dataKey="date"
              stroke="#475569"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              dy={5}
              interval={5} // Shows ~6 evenly spaced dates across the 30 days
            />

            <YAxis
              stroke="#475569"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={['dataMin - 15', 'dataMax + 15']}
            />

            <Tooltip 
              content={<CustomCredTooltip />} 
              cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '2 2' }} 
            />

            {/* Glowing Area Fill under Mini Line */}
            <Area
              type="monotone"
              dataKey="cred"
              stroke="transparent"
              fill="url(#credGradient)"
            />

            {/* Vibrant Neon Mini-Line */}
            <Line
              type="monotone"
              dataKey="cred"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4.5,
                stroke: '#06b6d4',
                strokeWidth: 2,
                fill: '#0a0f1d',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline Footer Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2 px-1">
        <span>30 Days Ago ({historyData[0]?.date})</span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span>Real-time Cred Timeline</span>
        </span>
        <span>Today ({historyData[historyData.length - 1]?.date})</span>
      </div>
    </div>
  );
};

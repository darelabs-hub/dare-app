import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  HelpCircle, 
  Award, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  SlidersHorizontal,
  History,
  Info
} from 'lucide-react';
import { CredTransaction, UserProfile } from '../types';

interface CredLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const CredLogModal: React.FC<CredLogModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [transactions, setTransactions] = useState<CredTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'gains' | 'losses' | 'dare_completed' | 'challenge_created' | 'stipend_claimed' | 'ai_bonus' | 'pro_upgrade'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    if (!currentUser.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  // Filter and Search logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.dareTitle && tx.dareTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'gains') return tx.amount > 0;
    if (filterType === 'losses') return tx.amount < 0;
    return tx.type === filterType;
  });

  // Calculate stats
  const totalGained = transactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'dare_completed':
        return {
          label: 'Dare Completion',
          className: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20',
          icon: <ShieldCheck className="h-3 w-3 text-emerald-400" />
        };
      case 'challenge_created':
        return {
          label: 'Challenge Created',
          className: 'bg-blue-950/40 text-blue-300 border-blue-500/20',
          icon: <PlusCircle className="h-3 w-3 text-blue-400" />
        };
      case 'vote_received':
        return {
          label: 'Vote Received',
          className: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/20',
          icon: <Award className="h-3 w-3 text-cyan-400" />
        };
      case 'stipend_claimed':
        return {
          label: 'Stipend Claimed',
          className: 'bg-purple-950/40 text-purple-300 border-purple-500/20',
          icon: <Coins className="h-3 w-3 text-purple-400" />
        };
      case 'ai_bonus':
        return {
          label: 'Neural Bonus',
          className: 'bg-amber-950/40 text-amber-300 border-amber-500/20',
          icon: <Sparkles className="h-3 w-3 text-amber-400" />
        };
      case 'pro_upgrade':
        return {
          label: 'PRO Upgrade',
          className: 'bg-rose-950/40 text-rose-300 border-rose-500/20',
          icon: <ArrowDownLeft className="h-3 w-3 text-rose-400" />
        };
      default:
        return {
          label: 'Bonus Claimed',
          className: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Info className="h-3 w-3 text-slate-400" />
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="cred-log-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#0d111a] p-4 sm:p-6 shadow-2xl glow-cyan my-auto max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header with high-contrast, always-visible mobile close button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400 bg-cyan-950/40 glow-cyan">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide truncate">
                CRED TELEMETRY <span className="text-cyan-400">LOG</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate sm:whitespace-normal">
                Audit trail of cred gains, losses & transactions
              </p>
            </div>
          </div>

          {/* Close button with prominent touch target and high visibility on mobile */}
          <button
            id="close-cred-log-btn"
            type="button"
            onClick={onClose}
            aria-label="Close transaction log"
            className="shrink-0 flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 -mr-1 mt-3 space-y-4">
          {/* Dashboard/Stats Panel */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1">
                <Coins className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Net Balance</span>
              </div>
              <div className="font-mono text-sm sm:text-lg font-bold text-cyan-300">
                {currentUser.cred} <span className="text-[10px] sm:text-xs text-cyan-500 font-mono">CR</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Total Gains</span>
              </div>
              <div className="font-mono text-sm sm:text-lg font-bold text-emerald-400">
                +{totalGained} <span className="text-[10px] sm:text-xs text-emerald-500 font-mono">CR</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1">
                <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Upgrades</span>
              </div>
              <div className="font-mono text-sm sm:text-lg font-bold text-rose-400">
                -{totalSpent} <span className="text-[10px] sm:text-xs text-rose-500 font-mono">CR</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col gap-2.5 pb-2 border-b border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by description or challenge title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500 text-[10px] uppercase tracking-wider mr-1 select-none font-bold shrink-0">Filter:</span>
              {[
                { type: 'all', label: 'All Operations' },
                { type: 'gains', label: 'Gains' },
                { type: 'losses', label: 'Losses' },
                { type: 'dare_completed', label: 'Dares' },
                { type: 'challenge_created', label: 'Created' },
                { type: 'stipend_claimed', label: 'Stipends' },
                { type: 'ai_bonus', label: 'AI Arbiter' },
                { type: 'pro_upgrade', label: 'PRO Upgrade' }
              ].map(f => (
                <button
                  key={f.type}
                  type="button"
                  onClick={() => setFilterType(f.type as any)}
                  className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-medium border transition-all shrink-0 cursor-pointer ${
                    filterType === f.type
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions list */}
          <div className="space-y-2 max-h-[36vh] sm:max-h-[42vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-2" />
                <p className="text-xs font-mono">Syncing cred telemetry logs...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/20 px-3">
                <Coins className="h-7 w-7 text-slate-600 mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-slate-400">No transaction records found</p>
                <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try relaxing your filter parameters or search term.' 
                    : 'Start participating in challenge contracts or claiming daily missions to see telemetry logs here.'}
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isGain = tx.amount > 0;
                const badgeInfo = getEventBadge(tx.type);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/30 p-3 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg border ${
                        isGain 
                          ? 'border-emerald-500/20 bg-emerald-950/30 text-emerald-400' 
                          : 'border-rose-500/20 bg-rose-950/30 text-rose-400'
                      }`}>
                        {isGain ? <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {tx.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <div className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.2 text-[9px] font-medium ${badgeInfo.className}`}>
                            {badgeInfo.icon}
                            <span>{badgeInfo.label}</span>
                          </div>
                          <span className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                            <Calendar className="h-2.5 w-2.5 text-slate-600" />
                            {formatDate(tx.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold text-xs sm:text-sm ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}{tx.amount}
                      </span>
                      <span className="text-[9px] text-slate-500 ml-1 font-mono">CR</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer info banner */}
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/10 bg-cyan-950/10 p-2.5 sm:p-3 text-[11px] sm:text-xs text-slate-400">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <p>
              Complete dares, earn community votes, and achieve streak milestones to raise your Cred rating and unlock cyber rank badges.
            </p>
          </div>
        </div>

        {/* Dedicated mobile bottom close action */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex sm:hidden justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all shadow-md active:scale-98"
          >
            Close Telemetry Log
          </button>
        </div>
      </div>
    </div>
  );
};

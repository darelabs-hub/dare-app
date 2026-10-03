import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  History,
  Info
} from 'lucide-react';
import { CredTransaction, UserProfile } from '../types';
import { fetchWithRetry } from '../utils/api';

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
      const res = await fetchWithRetry(`/api/users/${currentUser.id}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (_e) {
      console.warn('Notice: transactions momentarily unavailable');
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
          label: 'Completed',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <ShieldCheck className="h-3 w-3 text-emerald-400" />
        };
      case 'challenge_created':
        return {
          label: 'Created',
          className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          icon: <PlusCircle className="h-3 w-3 text-sky-400" />
        };
      case 'vote_received':
        return {
          label: 'Upvoted',
          className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          icon: <Award className="h-3 w-3 text-violet-400" />
        };
      case 'stipend_claimed':
        return {
          label: 'Daily Bonus',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Coins className="h-3 w-3 text-amber-400" />
        };
      case 'ai_bonus':
        return {
          label: 'AI Verified',
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: <Sparkles className="h-3 w-3 text-indigo-400" />
        };
      case 'pro_upgrade':
        return {
          label: 'Upgrade',
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <ArrowDownLeft className="h-3 w-3 text-rose-400" />
        };
      default:
        return {
          label: 'Activity',
          className: 'bg-white/5 text-slate-300 border-white/10',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="cred-log-modal-container"
        className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] p-4 sm:p-6 shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <History className="h-4.5 w-4.5 text-slate-200" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                Cred Activity History
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Track earned and spent Cred balance
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            id="close-cred-log-btn"
            type="button"
            onClick={onClose}
            aria-label="Close transaction log"
            className="shrink-0 p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer active:scale-95"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 mt-4 space-y-4 pr-1">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Balance</span>
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-white">
                {currentUser.cred.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Cred</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Total Earned</span>
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-emerald-400">
                +{totalGained.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Cred</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Total Spent</span>
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-rose-400">
                -{totalSpent.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Cred</span>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2.5 pb-2 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search descriptions or challenge titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none transition-colors"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { type: 'all', label: 'All' },
                { type: 'gains', label: 'Earned' },
                { type: 'losses', label: 'Spent' },
                { type: 'dare_completed', label: 'Completed' },
                { type: 'challenge_created', label: 'Created' },
                { type: 'stipend_claimed', label: 'Daily Bonus' },
                { type: 'ai_bonus', label: 'AI Bonus' },
                { type: 'pro_upgrade', label: 'Upgrades' }
              ].map(f => (
                <button
                  key={f.type}
                  type="button"
                  onClick={() => setFilterType(f.type as any)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    filterType === f.type
                      ? 'bg-white text-slate-950 border-white font-semibold shadow-sm'
                      : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions list */}
          <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white mb-2" />
                <p className="text-xs">Loading activity records...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4">
                <Coins className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-300">No activity records found</p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'Complete challenges or claim daily bonuses to build your history.'}
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isGain = tx.amount > 0;
                const badgeInfo = getEventBadge(tx.type);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                        isGain 
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                          : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                      }`}>
                        {isGain ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {tx.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${badgeInfo.className}`}>
                            {badgeInfo.icon}
                            <span>{badgeInfo.label}</span>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Calendar className="h-2.5 w-2.5 text-slate-500" />
                            {formatDate(tx.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold text-xs sm:text-sm ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}{tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1 font-mono">Cred</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer info tip */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400">
            <Info className="h-4 w-4 text-slate-400 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Complete challenges, receive community verification votes, and maintain your streak to earn Cred.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Activity, Flame, Coins, Zap, CheckCircle2 } from 'lucide-react';
import { CredTransaction } from '../types';

interface SocialActivityFeedProps {
  transactions: CredTransaction[];
}

export const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({ transactions }) => {
  const recentActivities = transactions.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 mb-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          <Activity className="h-5 w-5 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Live Activity Stream</h2>
      </div>
      
      {recentActivities.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-400">
            No live activity yet. Accept challenges, submit proof, or stake Cred to initiate the neural activity stream.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentActivities.map((tx) => (
            <div key={tx.id} className="flex gap-3 text-xs">
              <div className={`shrink-0 p-1.5 rounded-lg ${tx.amount >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {tx.type === 'dare_completed' ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-300 break-words">
                  <span className="font-semibold text-white">{tx.description}</span>
                </p>
                <p className="text-slate-500 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


import React from 'react';
import { 
  Flame,
  Target,
  Trophy,
  User,
  Crown
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreate,
  onOpenLeaderboard,
  onOpenProfile,
}) => {
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0B10]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(0,0,0,0.9)]"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        
        {/* 1. Feed */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onSelectTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'feed'
              ? 'text-pink-400 font-bold'
              : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <Flame className={`h-5 w-5 ${activeTab === 'feed' ? 'text-pink-400' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${activeTab === 'feed' ? 'text-pink-400 font-bold' : 'text-slate-400'}`}>
            Feed
          </span>
        </button>

        {/* 2. Challenges */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onSelectTab('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab !== 'feed'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <Target className={`h-5 w-5 ${activeTab !== 'feed' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${activeTab !== 'feed' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
            Dares
          </span>
        </button>

        {/* 3. Center Action: Neon Pink Crown Button (Create New Dare) */}
        <button
          type="button"
          onClick={() => {
            playSound('pop');
            onOpenCreate();
          }}
          title="Create New Dare"
          className="flex flex-col items-center justify-center h-full py-1 transition-all cursor-pointer active:scale-95 group"
        >
          <div className="relative -mt-3.5 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF007F] via-pink-500 to-[#FF69B4] p-0.5 shadow-[0_0_22px_rgba(255,0,127,0.55)] group-hover:scale-110 transition-transform">
            <div className="w-full h-full rounded-full bg-[#0A0B10] flex items-center justify-center">
              <Crown className="w-6 h-6 text-[#FF007F] fill-[#FF007F]/20 drop-shadow-[0_0_8px_rgba(255,0,127,0.85)] transition-transform group-hover:scale-110" />
            </div>
          </div>
        </button>

        {/* 4. Ranks / Leaderboard */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center justify-center min-h-[46px] py-1 text-slate-400 hover:text-amber-300 transition-all cursor-pointer active:scale-95 font-medium"
        >
          <Trophy className="h-5 w-5 text-slate-400 hover:text-amber-300" />
          <span className="text-[10px] tracking-tight mt-0.5 text-slate-400">
            Ranks
          </span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onOpenProfile?.();
          }}
          className="flex flex-col items-center justify-center min-h-[46px] py-1 text-slate-400 hover:text-pink-300 transition-all cursor-pointer active:scale-95 font-medium"
        >
          <User className="h-5 w-5 text-slate-400 hover:text-pink-300" />
          <span className="text-[10px] tracking-tight mt-0.5 text-slate-400">
            Profile
          </span>
        </button>

      </div>
    </nav>
  );
};

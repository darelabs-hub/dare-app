import React, { useState, useRef, useEffect } from 'react';
import { 
  Flame, 
  ShoppingBag, 
  Award, 
  PlusCircle, 
  User, 
  ShieldAlert,
  Trophy,
  Swords,
  Coins,
  Crown,
  Users,
  ChevronUp,
  X,
  Zap,
  Target,
  Compass
} from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenArmory: () => void;
  onOpenSeasonPass: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenTournaments?: () => void;
  onOpenLiveDuels?: () => void;
  onOpenDropZones?: () => void;
  onOpenCredLog?: () => void;
  onOpenProUpgrade?: () => void;
  onOpenEventsMerch?: () => void;
  currentUser: UserProfile;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreate,
  onOpenArmory,
  onOpenSeasonPass,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenTournaments,
  onOpenLiveDuels,
  onOpenDropZones,
  onOpenCredLog,
  onOpenProUpgrade,
  onOpenEventsMerch,
  currentUser,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  return (
    <>
      {/* Mobile Profile & Armory Quick Dropdown Popover */}
      {isProfileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            onClick={() => setIsProfileMenuOpen(false)}
          />

          {/* Quick Dropdown Sheet */}
          <div 
            ref={menuRef}
            id="mobile-profile-dropdown-sheet"
            className="fixed bottom-[64px] left-3 right-3 z-50 md:hidden max-w-sm mx-auto rounded-3xl border border-indigo-500/40 bg-[#0a0f1d]/98 p-4 shadow-[0_-15px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(99,102,241,0.25)] backdrop-blur-2xl animate-in slide-in-from-bottom-4 duration-200"
          >
            {/* Header / Current User Summary */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-400"
                  />
                  {currentUser.isPro && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-slate-950 ring-1 ring-slate-900">
                      <Crown className="h-2 w-2" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white truncate">{currentUser.name}</span>
                    {currentUser.isPro && (
                      <span className="text-[8px] font-mono font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="text-indigo-300">{currentUser.handle}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">{currentUser.cred} CR</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsProfileMenuOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Action Shortcuts Grid */}
            <div className="space-y-1.5">
              {/* Daily Missions */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  playSound('pop');
                  const el = document.getElementById('daily-mission-widget');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('ring-2', 'ring-cyan-400');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2000);
                  }
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 p-2.5 text-left text-xs font-bold text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Target className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-cyan-200">Daily Missions & Ops</div>
                    <div className="text-[10px] text-cyan-400/80 font-normal">3 Contracts • Daily Trifecta Safe</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Open →</span>
              </button>

              {/* 1. Cyber Armory (Moved to Dropdown with High Prominence) */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  playSound('purchase');
                  onOpenArmory();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 p-2.5 text-left text-xs font-bold text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-cyan-200">Armory & Shop</div>
                    <div className="text-[10px] text-cyan-400/80 font-normal">Chips, Frames & Tactical Items</div>
                  </div>
                </div>
                {currentUser.inventory && currentUser.inventory.length > 0 && (
                  <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-950">
                    {currentUser.inventory.length}
                  </span>
                )}
              </button>

              {/* 2. Full Dossier / Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  playSound('click');
                  onOpenProfile();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-indigo-400" />
                  <span>Agent Dossier & Activity Heatmap</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400">View →</span>
              </button>

              {/* Geofenced Drop Zones & AR Beacons */}
              {onOpenDropZones && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    playSound('laser');
                    onOpenDropZones();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-950/40 hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="h-4 w-4 text-emerald-400" />
                    <span>Drop Zones & AR Beacons</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">GPS Radar →</span>
                </button>
              )}

              {/* 3. Squad Wars & Tournaments */}
              {onOpenTournaments && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    playSound('laser');
                    onOpenTournaments();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-950/40 hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Swords className="h-4 w-4 text-pink-400" />
                    <span>Squad Wars Tournament Arena</span>
                  </div>
                  <span className="text-[10px] font-mono text-pink-400">Live →</span>
                </button>
              )}

              {/* 4. Cred Ledger & Audit */}
              {onOpenCredLog && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    playSound('click');
                    onOpenCredLog();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span>Cred Ledger & Audit Trail</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{currentUser.cred} CR</span>
                </button>
              )}

              {/* 5. Cyber PRO Upgrade */}
              {onOpenProUpgrade && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    playSound('oracle');
                    onOpenProUpgrade();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span>{currentUser.isPro ? 'Manage PRO Membership' : 'Upgrade to PRO'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">⚡ 2x Cred</span>
                </button>
              )}

              {/* 6. Physical Swag & Community Events */}
              {onOpenEventsMerch && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    playSound('click');
                    onOpenEventsMerch();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-950/40 hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="h-4 w-4 text-purple-400" />
                    <span>Physical Swag & Sprints</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400">RSVP →</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Bottom Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          
          {/* 1. Feed / Dares */}
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(false);
              playSound('click');
              onSelectTab('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all cursor-pointer active:scale-90 ${
              activeTab === 'all' || activeTab === 'feed'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Flame className="h-5 w-5" />
              {(activeTab === 'all' || activeTab === 'feed') && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 glow-cyan" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">Dares</span>
          </button>

          {/* 2. Hall of Fame / Leaderboard */}
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(false);
              playSound('click');
              onOpenLeaderboard();
            }}
            className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-400 hover:text-amber-300 transition-all cursor-pointer active:scale-90"
          >
            <div className="relative">
              <Trophy className="h-5 w-5 text-amber-400/90" />
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1 text-slate-300">Apex</span>
          </button>

          {/* 3. Center CTA: Deploy Dare */}
          <div className="flex justify-center -mt-4">
            <button
              type="button"
              aria-label="Deploy New Dare"
              onClick={() => {
                setIsProfileMenuOpen(false);
                playSound('laser');
                onOpenCreate();
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] border-2 border-[#070b14] active:scale-90 transition-transform cursor-pointer"
            >
              <PlusCircle className="h-6 w-6" />
            </button>
          </div>

          {/* 4. Season Pass */}
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(false);
              playSound('levelUp');
              onOpenSeasonPass();
            }}
            className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-400 hover:text-amber-400 transition-all cursor-pointer active:scale-90"
          >
            <div className="relative">
              <Award className="h-5 w-5 text-amber-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[7px] font-black text-slate-950 font-mono">
                ★
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1 text-amber-300">Pass</span>
          </button>

          {/* 5. Spacious Profile Dropdown Trigger */}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setIsProfileMenuOpen(prev => !prev);
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all cursor-pointer active:scale-90 ${
              isProfileMenuOpen 
                ? 'text-indigo-300 scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle Profile Menu"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className={`h-6 w-6 rounded-full object-cover transition-all ${
                  isProfileMenuOpen 
                    ? 'ring-2 ring-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]' 
                    : currentUser.equippedFrame === 'frame_neon_cyan' ? 'ring-1.5 ring-cyan-400' :
                      currentUser.equippedFrame === 'frame_matrix_glitch' ? 'ring-1.5 ring-emerald-400' :
                      currentUser.equippedFrame === 'frame_syndicate_gold' ? 'ring-1.5 ring-amber-400' :
                      currentUser.equippedFrame === 'frame_quantum_void' ? 'ring-1.5 ring-fuchsia-500' :
                      'ring-1.5 ring-slate-600'
                }`}
              />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-600 text-[8px] text-white">
                <ChevronUp className={`h-2.5 w-2.5 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1 truncate max-w-[54px]">
              Profile
            </span>
          </button>

        </div>
      </div>
    </>
  );
};

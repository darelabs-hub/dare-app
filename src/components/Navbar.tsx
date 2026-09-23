import React from 'react';
import { 
  Zap, 
  Volume2, 
  VolumeX, 
  Trophy, 
  PlusCircle, 
  Flame, 
  Coins, 
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Crown,
  Search,
  Clock,
  X,
  ShoppingBag,
  User,
  Users,
  Map,
  Swords,
  Target,
  Compass
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
import { playSound } from '../utils/soundEffects';
import { StreakIndicator } from './StreakIndicator';
import { LegalTab } from './LegalAndFaqModal';
import { NotificationsMenu } from './NotificationsMenu';
import { DareDayLogo } from './DareDayLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentUser?: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenCreateModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenTournaments?: () => void;
  onOpenLiveDuels?: () => void;
  onOpenDropZones?: () => void;
  onOpenLegalModal?: (tab?: LegalTab) => void;
  onOpenCredLog?: () => void;
  onOpenProUpgrade?: () => void;
  onOpenEventsMerch?: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onOpenArmory?: () => void;
  onOpenSeasonPass?: () => void;
  onOpenProfile?: (user: UserProfile, tab?: 'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry') => void;
  soundActive: boolean;
  onToggleSound: () => void;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onNavigateToDare: (dareId: string) => void;
  onSimulateNotification?: () => void;
  onSimulateExpiryNotification?: () => void;
  stats?: {
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onOpenCreateModal,
  onOpenLeaderboard,
  onOpenTournaments,
  onOpenLiveDuels,
  onOpenDropZones,
  onOpenLegalModal,
  onOpenCredLog,
  onOpenProUpgrade,
  onOpenEventsMerch,
  onOpenArmory,
  onOpenSeasonPass,
  onOpenProfile,
  onSignIn,
  onSignOut,
  soundActive,
  onToggleSound,
  notifications,
  unreadNotificationsCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onNavigateToDare,
  onSimulateNotification,
  onSimulateExpiryNotification,
  stats,
  searchQuery,
  setSearchQuery,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [recentSearchesOpen, setRecentSearchesOpen] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const userDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
    setRecentSearchesOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setRecentSearchesOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        
        {/* Logo & Brand */}
        <div 
          className="flex items-center cursor-pointer select-none shrink-0" 
          onClick={() => window.location.reload()}
          title="DARE - Home"
        >
          <DareDayLogo size={42} showText={true} />
        </div>

        {/* Global Live Ticker (Desktop only, 2xl) */}
        {stats && (
          <div className="hidden 2xl:flex items-center gap-4 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Pool:</span>
              <span className="font-mono font-bold text-amber-300">{stats.totalCredPool} Cred</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <Coins className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-400">Active:</span>
              <span className="font-mono font-bold text-indigo-300">{stats.totalDares}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Verified:</span>
              <span className="font-mono font-bold text-emerald-300">{stats.verifiedDares}</span>
            </div>
          </div>
        )}

        {/* Actions Cluster (Compact & Responsive) */}
        <div className="flex items-center shrink-0 gap-1 sm:gap-2">

          {/* Cyber Armory & Rewards Shop Button (Desktop/Tablet) */}
          {onOpenArmory && (
            <button
              id="cyber-armory-btn"
              onClick={() => {
                playSound('purchase');
                onOpenArmory();
              }}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all shrink-0 cursor-pointer"
              title="Cyber Armory & Boosters Store"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-cyan-400" />
              <span>Armory</span>
            </button>
          )}

          {/* Season 1 Battle Pass Button (Desktop/Tablet) */}
          {onOpenSeasonPass && (
            <button
              id="season-pass-btn"
              onClick={() => {
                playSound('levelUp');
                onOpenSeasonPass();
              }}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-2.5 py-1.5 text-xs font-bold text-purple-200 hover:border-purple-400 hover:bg-purple-500/20 transition-all shrink-0 cursor-pointer"
              title="Season 1 Battle Pass"
            >
              <Zap className="h-3.5 w-3.5 text-purple-400" />
              <span>Pass</span>
              <span className="rounded bg-purple-500/30 px-1 py-0.2 text-[9px] font-mono text-purple-300">
                LVL {currentUser?.seasonPassLevel || 1}
              </span>
            </button>
          )}

          {/* Geofenced Drop Zones & AR Beacons Button (Desktop/Tablet) */}
          {onOpenDropZones && (
            <button
              id="navbar-drop-zones-btn"
              onClick={() => {
                playSound('laser');
                onOpenDropZones();
              }}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0 cursor-pointer"
              title="Geofenced Drop Zones & AR Beacons"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-400 animate-spin-slow" />
              <span>Drop Zones</span>
              <span className="rounded bg-emerald-500/30 px-1 py-0.2 text-[9px] font-mono text-emerald-300">
                AR
              </span>
            </button>
          )}

          {/* Squad Wars / Tournaments Arena Button (Desktop/Tablet) */}
          {onOpenTournaments && (
            <button
              id="tournaments-arena-btn"
              onClick={() => {
                playSound('laser');
                onOpenTournaments();
              }}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 px-2.5 py-1.5 text-xs font-semibold text-pink-200 hover:border-pink-400/60 hover:bg-pink-500/20 transition-all shrink-0 cursor-pointer"
              title="Squad vs. Squad Tournaments Arena"
            >
              <Swords className="h-3.5 w-3.5 text-pink-400" />
              <span>Squad Wars</span>
            </button>
          )}

          {/* PRO Premium Badge / Button (Desktop) */}
          {onOpenProUpgrade && (
            <button
              id="navbar-pro-tier-btn"
              onClick={() => {
                playSound('oracle');
                onOpenProUpgrade();
              }}
              className={`hidden xl:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                currentUser?.isPro
                  ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300 hover:border-indigo-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20'
              }`}
              title={currentUser?.isPro ? 'PRO Active Subscription' : 'Upgrade to PRO'}
            >
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>{currentUser?.isPro ? 'PRO Active' : 'Upgrade to PRO'}</span>
            </button>
          )}

          {/* Grid Telemetry Notifications Bell */}
          <div className="shrink-0">
            <NotificationsMenu
              currentUser={currentUser!}
              notifications={notifications}
              unreadCount={unreadNotificationsCount}
              onMarkRead={onMarkNotificationRead}
              onMarkAllRead={onMarkAllNotificationsRead}
              onDeleteNotification={onDeleteNotification}
              onClearAll={onClearAllNotifications}
              onNavigateToDare={onNavigateToDare}
              onSimulateNotification={onSimulateNotification}
              onSimulateExpiryNotification={onSimulateExpiryNotification}
            />
          </div>

          {/* Prominent User Profile & Account Dropdown Trigger */}
          <div className="relative shrink-0" ref={userDropdownRef}>
            {currentUser ? (
              <button
                id="user-profile-menu-btn"
                type="button"
                onClick={() => {
                  playSound('click');
                  setUserDropdownOpen(prev => !prev);
                }}
                className={`flex items-center gap-1 sm:gap-2 rounded-xl border p-1 sm:px-2.5 sm:py-1.5 text-left transition-all cursor-pointer ${
                  userDropdownOpen
                    ? 'border-indigo-400 bg-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.4)] ring-2 ring-indigo-500'
                    : 'border-slate-700 bg-slate-900/95 hover:border-indigo-500 hover:bg-slate-800'
                }`}
                aria-expanded={userDropdownOpen}
                aria-label="User Profile and Account Menu"
              >
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover transition-all ${
                      currentUser.equippedFrame === 'frame_neon_cyan' ? 'ring-2 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.7)] animate-pulse' :
                      currentUser.equippedFrame === 'frame_matrix_glitch' ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]' :
                      currentUser.equippedFrame === 'frame_syndicate_gold' ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.9)]' :
                      currentUser.equippedFrame === 'frame_quantum_void' ? 'ring-2 ring-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.9)] animate-pulse' :
                      'ring-1.5 ring-indigo-500/60 shadow-sm'
                    }`}
                  />
                  {currentUser.isPro && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-sm ring-1 ring-slate-900">
                      <Crown className="h-1.5 w-1.5" />
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0 pr-0.5">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <span className="font-bold text-xs text-white truncate max-w-[55px] xs:max-w-[75px] sm:max-w-[95px]">{currentUser.handle}</span>
                    <ChevronDown className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <span className="text-amber-400 font-bold">{currentUser.cred} CR</span>
                    <span className="hidden sm:inline text-slate-500">• {currentUser.equippedTitle || currentUser.rank}</span>
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => onSignIn && onSignIn()}
                className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:border-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Persona Switcher & Account Menu Dropdown */}
            {userDropdownOpen && currentUser && (
              <>
                {/* Mobile backdrop */}
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] sm:hidden"
                  onClick={() => setUserDropdownOpen(false)}
                />

                <div 
                  id="profile-dropdown-menu"
                  className="fixed left-1/2 -translate-x-1/2 top-18 sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:absolute mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm sm:max-w-none rounded-2xl border border-slate-700 bg-[#0c1222] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-150"
                >
                {/* User Header Summary Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 mb-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-400/80 shrink-0 shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{currentUser?.name}</span>
                      {currentUser?.isPro && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 border border-amber-500/40 bg-amber-500/20 text-[9px] font-bold font-mono tracking-wider text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)] shrink-0">
                          <Crown className="h-2.5 w-2.5 text-amber-400" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-300 font-mono truncate">{currentUser?.handle}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300 font-mono">
                      <span className="text-amber-400 font-bold">{currentUser?.cred} Cred</span>
                      <span>•</span>
                      <span className="text-slate-400 truncate">{currentUser?.rank}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Navigation Actions */}
                <div className="space-y-1">
                  {onOpenProfile && (
                    <button
                      id="menu-my-profile-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile(currentUser);
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-white" />
                        <span>View My Profile & Stats</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">Open →</span>
                    </button>
                  )}

                  <button
                    id="menu-sign-out-btn"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSignOut) onSignOut();
                      playSound('click');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-white transition-colors text-left cursor-pointer mt-2 border border-rose-500/30"
                  >
                    <X className="h-4 w-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                  {/* ... other actions ... */}
                </div>
              </div>
            </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

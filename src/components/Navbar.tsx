import React from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRight,
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
  Compass,
  Edit3,
  MessageSquare,
  Radio
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
import { playSound } from '../utils/soundEffects';
import { StreakIndicator } from './StreakIndicator';
import { LegalTab } from './LegalAndFaqModal';
import { NotificationsMenu } from './NotificationsMenu';
import { DareDayLogo } from './DareDayLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentUser?: UserProfile;
  isAuthenticated?: boolean;
  allUsers: UserProfile[];
  isMarketingMode?: boolean;
  onSelectUser: (user: UserProfile) => void;
  onOpenCreateModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenTournaments?: () => void;
  onOpenLiveDuels?: () => void;
  onOpenLegalModal?: (tab?: LegalTab) => void;
  onOpenCredLog?: () => void;
  onOpenProUpgrade?: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onOpenArmory?: () => void;
  onOpenFeed?: () => void;
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
  stats?: {
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateToPath?: (path: string) => void;
  onOpenDareChat?: () => void;
  onNavigateToMyDares?: () => void;
  onNavigateToDailyMissions?: () => void;
  onNavigateToChallenges?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isAuthenticated = false,
  allUsers,
  isMarketingMode = false,
  onSelectUser,
  onOpenCreateModal,
  onOpenLeaderboard,
  onOpenTournaments,
  onOpenLiveDuels,
  onOpenLegalModal,
  onOpenCredLog,
  onOpenProUpgrade,
  onOpenArmory,
  onOpenFeed,
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
  stats,
  searchQuery,
  setSearchQuery,
  onNavigateToPath,
  onOpenDareChat,
  onNavigateToMyDares,
  onNavigateToDailyMissions,
  onNavigateToChallenges,
}) => {
  const { t } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [hubMenuOpen, setHubMenuOpen] = React.useState(false);
  const [recentSearchesOpen, setRecentSearchesOpen] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const userDropdownRef = React.useRef<HTMLDivElement>(null);
  const mobileDrawerRef = React.useRef<HTMLDivElement>(null);
  const hubMenuRef = React.useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!target) return;

      if (searchRef.current && !searchRef.current.contains(target)) {
        setRecentSearchesOpen(false);
      }
      const isTargetInUserDropdown = userDropdownRef.current && userDropdownRef.current.contains(target);
      const isTargetInMobileDrawer = mobileDrawerRef.current && mobileDrawerRef.current.contains(target);
      if (!isTargetInUserDropdown && !isTargetInMobileDrawer) {
        setUserDropdownOpen(false);
      }
      if (hubMenuRef.current && !hubMenuRef.current.contains(target)) {
        setHubMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0B10]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-8 gap-3">
        
        {/* Logo & Brand Zone */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0 min-w-0">
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0 group" 
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigateToChallenges) {
                onNavigateToChallenges();
              } else if (onNavigateToPath) {
                onNavigateToPath('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.location.reload();
              }
            }}
            title="DARE - Live Arena"
          >
            <DareDayLogo size={48} variant="emblem" />
          </div>

          {/* Minimal Clean Navigation Links (Never wrapping or colliding) */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-slate-300 shrink-0">
            {isMarketingMode ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('click');
                    if (onNavigateToChallenges) {
                      onNavigateToChallenges();
                    } else if (onNavigateToPath) {
                      onNavigateToPath('/');
                    } else {
                      const el = document.getElementById('dare-feed-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Challenges
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('click');
                    if (window.location.pathname !== '/' && onNavigateToPath) {
                      onNavigateToPath('/');
                      setTimeout(() => {
                        const el = document.getElementById('how-it-works-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    } else {
                      const el = document.getElementById('how-it-works-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-purple-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  How It Works
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('click');
                    if (window.location.pathname !== '/' && onNavigateToPath) {
                      onNavigateToPath('/');
                      setTimeout(() => {
                        const el = document.getElementById('community-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    } else {
                      const el = document.getElementById('community-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Community
                </button>
              </>
            ) : (
              <>
                {onOpenFeed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('click');
                      onOpenFeed();
                    }}
                    className="hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                  >
                    <span>Feed</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('click');
                    if (onNavigateToChallenges) {
                      onNavigateToChallenges();
                    } else {
                      const el = document.getElementById('dares-feed-container');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Challenges
                </button>
                {onOpenTournaments && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('click');
                      onOpenTournaments();
                    }}
                    className="hover:text-purple-400 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                  >
                    <span>Tournaments</span>
                  </button>
                )}
                {onOpenLiveDuels && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('pop');
                      onOpenLiveDuels();
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>Live Arena</span>
                  </button>
                )}
                {onOpenArmory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('purchase');
                      onOpenArmory();
                    }}
                    className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Store
                  </button>
                )}
                {onOpenLeaderboard && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('click');
                      onOpenLeaderboard();
                    }}
                    className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Leaderboard
                  </button>
                )}
                {onNavigateToMyDares && isAuthenticated && (
                  <button
                    id="nav-my-dares-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('click');
                      onNavigateToMyDares();
                    }}
                    className="hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 text-pink-300 font-semibold"
                  >
                    <Target className="h-3.5 w-3.5 text-pink-400" />
                    <span>My Challenges</span>
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Clean Center Spacer (Preserves breathing room, completely prevents overlapping) */}
        <div className="flex-1 min-w-0" />

        {/* Actions Cluster (Carefully partitioned for mobile & desktop) */}
        <div className="flex items-center shrink-0 gap-1.5 sm:gap-2">

          {/* Primary CTA: START A DARE (Desktop / tablet) */}
          <button
            id="navbar-create-dare-cta"
            type="button"
            onClick={() => {
              playSound('pop');
              if (isMarketingMode && onSignIn) {
                onSignIn();
              } else {
                onOpenCreateModal();
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#FF5533] px-3 sm:px-3.5 py-1.5 text-xs font-black text-white uppercase tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(255,0,127,0.3)] transition-all cursor-pointer shrink-0 active:scale-95"
            title="Create and Deploy a DARE"
          >
            <Flame className="h-3.5 w-3.5 text-amber-200" />
            <span className="hidden md:inline">START A DARE</span>
            <span className="md:hidden">DARE</span>
          </button>

          {/* Arena & Features Hub Dropdown (Consolidates secondary tools to prevent navbar overrun) */}
          {!isMarketingMode && (
            <div className="relative shrink-0 hidden md:block" ref={hubMenuRef}>
              <button
                id="navbar-hub-menu-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playSound('click');
                  setHubMenuOpen(prev => !prev);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hubMenuOpen
                    ? 'border-cyan-400 bg-cyan-950/80 text-white ring-1 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'border-slate-700/80 bg-slate-900/90 text-slate-200 hover:border-cyan-400 hover:bg-slate-800'
                }`}
                title="Explore DARE"
              >
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                <span>Explore</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${hubMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {/* Hub Dropdown Popover */}
              {hubMenuOpen && (
                <div 
                  id="navbar-hub-dropdown-menu"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-700 bg-[#0c1222]/98 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-1.5 mb-1 flex items-center justify-between">
                    <span>Explore DARE</span>
                    <span className="text-cyan-400">Community</span>
                  </div>

                  {onOpenLiveDuels && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHubMenuOpen(false);
                        playSound('laser');
                        onOpenLiveDuels();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
                        <span>Live Video Arena</span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-bold">Watch →</span>
                    </button>
                  )}

                  {onOpenArmory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHubMenuOpen(false);
                        playSound('purchase');
                        onOpenArmory();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-cyan-400" />
                        <span>{t('armory')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">Shop →</span>
                    </button>
                  )}

                  {onOpenTournaments && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHubMenuOpen(false);
                        playSound('laser');
                        onOpenTournaments();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 text-pink-400" />
                        <span>{t('squadWars')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-pink-400">Battle →</span>
                    </button>
                  )}

                  {onOpenLeaderboard && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHubMenuOpen(false);
                        playSound('click');
                        onOpenLeaderboard();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span>Leaderboard</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">Ranks →</span>
                    </button>
                  )}

                  {onOpenProUpgrade && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHubMenuOpen(false);
                        playSound('click');
                        onOpenProUpgrade();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span>Get Cred Packs</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">Top Up →</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EU Language Selector - Only visible in header on the landing page */}
          {isMarketingMode && (
            <LanguageSelector />
          )}

          {/* Grid Notifications Bell */}
          {(!isMarketingMode || unreadNotificationsCount > 0) && (
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
              />
            </div>
          )}

          {/* User Profile & Account Dropdown Trigger & Sign In Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isAuthenticated && !isMarketingMode && (
              <button
                id="navbar-signin-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playSound('click');
                  if (onSignIn) onSignIn();
                }}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-indigo-500/50 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white hover:from-indigo-500 hover:to-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer shrink-0 active:scale-95"
                title="Sign In with Google"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden xs:inline">{t('signIn')}</span>
                <span className="xs:hidden">{t('login')}</span>
              </button>
            )}

            {currentUser && (
              <div className="relative shrink-0" ref={userDropdownRef}>
                <button
                  id="user-profile-menu-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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

            {/* Persona Switcher & Account Menu Dropdown */}
            {userDropdownOpen && currentUser && (
              <>
                {/* Desktop Dropdown Menu (Anchored beneath Profile Button) */}
                <div 
                  id="profile-dropdown-menu"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="hidden sm:block absolute top-full right-0 mt-2 w-80 max-w-sm rounded-2xl border border-white/[0.12] bg-[#0c101d] p-3 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.95)] z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[86vh] overflow-y-auto overscroll-contain"
                >
                  <div className="space-y-2 pr-0.5">
                  {/* User Profile Card Header */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile(currentUser);
                      playSound('click');
                    }}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] transition-all cursor-pointer group flex items-center gap-3 mb-2"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-white/20 group-hover:ring-cyan-400/60 transition-all shadow-sm"
                      />
                      {currentUser?.isPro && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-md">
                          <Crown className="h-2.5 w-2.5 text-slate-950 font-bold" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                          {currentUser?.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.handle}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-semibold">
                          <Coins className="h-2.5 w-2.5 text-amber-400" />
                          {currentUser?.cred} CR
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">• {currentUser?.equippedTitle || currentUser?.rank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sign In CTA for Guest Users inside Dropdown */}
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                        if (onSignIn) onSignIn();
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md hover:brightness-110 transition-all cursor-pointer mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Sign In / Connect Google</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">Sync</span>
                    </button>
                  )}

                  {/* Primary Action Buttons */}
                  <div className="space-y-1 pb-2 border-b border-white/[0.06]">
                    {onOpenProUpgrade && (
                      <button
                        id="menu-pro-upgrade-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenProUpgrade();
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent hover:from-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Coins className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">Get Cred Coins</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          + TOP UP
                        </span>
                      </button>
                    )}

                    <button
                      id="menu-create-dare-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                        onOpenCreateModal();
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlusCircle className="h-4 w-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
                        <span>Create Custom Dare</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">New</span>
                    </button>
                  </div>

                  {/* Challenges & Activity Section */}
                  <div className="py-2 border-b border-white/[0.06] space-y-0.5">
                    <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Activity & Dares</p>

                    {onOpenProfile && (
                      <button
                        id="menu-my-profile-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenProfile(currentUser);
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                          <span>View Profile & Stats</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {onNavigateToMyDares && (
                      <button
                        id="menu-my-dares-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onNavigateToMyDares();
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Target className="h-3.5 w-3.5 text-slate-400 group-hover:text-pink-300 transition-colors" />
                          <span>My Published Dares</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {/* Daily Missions Shortcut */}
                    <button
                      id="menu-daily-missions-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                        playSound('pop');
                        if (onNavigateToDailyMissions) {
                          onNavigateToDailyMissions();
                        } else {
                          if (onNavigateToPath) onNavigateToPath('/');
                          const el = document.getElementById('daily-mission-widget');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('ring-2', 'ring-cyan-400');
                            setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2500);
                          }
                        }
                      }}
                      className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Flame className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                        <span>Daily Dares & Challenges</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Daily</span>
                    </button>

                    {onOpenCredLog && (
                      <button
                        id="menu-cred-log-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenCredLog();
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Coins className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                          <span>Cred History & Activity</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}
                  </div>

                  {/* Arena & Community Section */}
                  <div className="py-2 border-b border-white/[0.06] space-y-0.5">
                    <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Arena & Community</p>

                    {onOpenLiveDuels && (
                      <button
                        id="menu-live-duels-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenLiveDuels();
                          playSound('laser');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Radio className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                          <div className="flex items-center gap-1.5">
                            <span>Live Video Arena</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">Live</span>
                      </button>
                    )}

                    {onOpenTournaments && (
                      <button
                        id="menu-tournaments-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenTournaments();
                          playSound('laser');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Trophy className="h-3.5 w-3.5 text-slate-400 group-hover:text-pink-400 transition-colors" />
                          <span>Squad Tournaments</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {onOpenLeaderboard && (
                      <button
                        id="menu-leaderboard-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenLeaderboard();
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Crown className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                          <span>Community Leaderboard</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {onOpenProfile && (
                      <button
                        id="menu-squad-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenProfile(currentUser, 'squad');
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          <span>My Squad & Teammates</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {onOpenProfile && (
                      <button
                        id="menu-rivalry-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenProfile(currentUser, 'rivalry');
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Swords className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                          <span>Head-to-Head Rivalry</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {onOpenProfile && (
                      <button
                        id="menu-heatmap-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenProfile(currentUser, 'location-map');
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Map className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                          <span>Challenge Map</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}
                  </div>

                  {/* Store & Settings Section */}
                  <div className="py-2 border-b border-white/[0.06] space-y-0.5">
                    <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Store & Settings</p>

                    {onOpenArmory && (
                      <button
                        id="menu-armory-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenArmory();
                          playSound('purchase');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                          <span>Rewards & Armory Store</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}

                    {onOpenProfile && (
                      <button
                        id="menu-edit-profile-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          onOpenProfile(currentUser, 'settings');
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Edit3 className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                          <span>Edit Username & Avatar</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}
                  </div>

                  {/* Footer Quick Controls & Sign Out */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <button
                        id="menu-faq-rules-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          if (onOpenLegalModal) onOpenLegalModal('faq');
                          playSound('click');
                        }}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                        <span>FAQ & Rules</span>
                      </button>

                      <button
                        id="menu-toggle-audio-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSound();
                        }}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                        title={soundActive ? 'Mute Audio' : 'Enable Audio'}
                      >
                        {soundActive ? (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Audio On</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                            <span>Muted</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isAuthenticated ? (
                      <button
                        id="menu-sign-out-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          if (onSignOut) onSignOut();
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer mt-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserDropdownOpen(false);
                          if (onSignIn) onSignIn();
                          playSound('click');
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-cyan-300 hover:text-white hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer mt-1"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Sign In</span>
                      </button>
                    )}
                  </div>
                  </div>
                </div>

                {/* Mobile Bottom Sheet Drawer Rendered via React Portal */}
                {typeof document !== 'undefined' && createPortal(
                  <div className="fixed inset-0 z-[99999] sm:hidden flex flex-col justify-end animate-in fade-in duration-200">
                    {/* Dark High-Contrast Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                      }}
                    />

                    {/* Sliding Bottom Sheet */}
                    <div 
                      ref={mobileDrawerRef}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="relative z-[100000] w-full max-h-[85vh] rounded-t-3xl border-t border-white/20 bg-[#090c15] p-4 shadow-[0_-25px_60px_rgba(0,0,0,0.95)] flex flex-col animate-in slide-in-from-bottom duration-200 overflow-hidden"
                    >
                      {/* Pull Bar & Close Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] shrink-0">
                        <div className="w-12 h-1 rounded-full bg-white/25 mx-auto" />
                        <button
                          type="button"
                          onClick={() => setUserDropdownOpen(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          title="Close menu"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto overscroll-contain space-y-2 pr-0.5 pb-8">
                        {/* User Profile Card Header */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserDropdownOpen(false);
                            if (onOpenProfile) onOpenProfile(currentUser);
                            playSound('click');
                          }}
                          className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer group flex items-center gap-3 mb-2"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="h-10 w-10 rounded-full object-cover ring-1 ring-white/20 shadow-sm"
                            />
                            {currentUser?.isPro && (
                              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-md">
                                <Crown className="h-2.5 w-2.5 text-slate-950 font-bold" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-sm text-white truncate">
                                {currentUser?.name}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.handle}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-semibold">
                                <Coins className="h-2.5 w-2.5 text-amber-400" />
                                {currentUser?.cred} CR
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono truncate">• {currentUser?.equippedTitle || currentUser?.rank}</span>
                            </div>
                          </div>
                        </div>

                        {/* Sign In CTA for Guest Users in Mobile Drawer */}
                        {!isAuthenticated && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserDropdownOpen(false);
                              if (onSignIn) onSignIn();
                              playSound('click');
                            }}
                            className="flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md hover:brightness-110 transition-all cursor-pointer mb-2"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span>Sign In / Connect Google</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20">Sync</span>
                          </button>
                        )}

                        {/* Primary Action Buttons */}
                        <div className="space-y-1 pb-2 border-b border-white/[0.06]">
                          {onOpenProUpgrade && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenProUpgrade();
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/30 text-amber-200 transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Coins className="h-4 w-4 text-amber-400" />
                                <span className="font-semibold">Get Cred Coins</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                + TOP UP
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserDropdownOpen(false);
                              onOpenCreateModal();
                              playSound('click');
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-white/[0.03] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <PlusCircle className="h-4 w-4 text-emerald-400" />
                              <span>Create Custom Dare</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">New</span>
                          </button>
                        </div>

                        {/* Challenges & Activity Section */}
                        <div className="py-2 border-b border-white/[0.06] space-y-0.5">
                          <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Activity & Dares</p>

                          {onOpenProfile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenProfile(currentUser);
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <User className="h-4 w-4 text-cyan-400" />
                                <span>View Profile & Stats</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          {onNavigateToMyDares && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onNavigateToMyDares();
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Target className="h-4 w-4 text-pink-400" />
                                <span>My Published Dares</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserDropdownOpen(false);
                              playSound('pop');
                              if (onNavigateToDailyMissions) {
                                onNavigateToDailyMissions();
                              } else {
                                if (onNavigateToPath) onNavigateToPath('/');
                                const el = document.getElementById('daily-mission-widget');
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  el.classList.add('ring-2', 'ring-cyan-400');
                                  setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2500);
                                }
                              }
                            }}
                            className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Flame className="h-4 w-4 text-amber-400" />
                              <span>Daily Dares & Challenges</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Daily</span>
                          </button>

                          {onOpenCredLog && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenCredLog();
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Coins className="h-4 w-4 text-amber-400" />
                                <span>Cred History & Activity</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}
                        </div>

                        {/* Arena & Community Section */}
                        <div className="py-2 border-b border-white/[0.06] space-y-0.5">
                          <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Arena & Community</p>

                          {onOpenLiveDuels && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenLiveDuels();
                                playSound('laser');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Radio className="h-4 w-4 text-rose-400" />
                                <div className="flex items-center gap-1.5">
                                  <span>Live Video Arena</span>
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                </div>
                              </div>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">Live</span>
                            </button>
                          )}

                          {onOpenTournaments && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenTournaments();
                                playSound('laser');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Trophy className="h-4 w-4 text-pink-400" />
                                <span>Squad Tournaments</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          {onOpenLeaderboard && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenLeaderboard();
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Crown className="h-4 w-4 text-amber-400" />
                                <span>Community Leaderboard</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          {onOpenProfile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenProfile(currentUser, 'squad');
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Users className="h-4 w-4 text-indigo-400" />
                                <span>My Squad & Teammates</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          {onOpenProfile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenProfile(currentUser, 'rivalry');
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Swords className="h-4 w-4 text-amber-400" />
                                <span>Head-to-Head Rivalry</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          {onOpenProfile && (
                            <button
                              id="mobile-menu-heatmap-btn"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenProfile(currentUser, 'location-map');
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Map className="h-4 w-4 text-emerald-400" />
                                <span>Challenge Map</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}
                        </div>

                        {/* Store & Settings Section */}
                        <div className="py-2 border-b border-white/[0.06] space-y-0.5">
                          <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">Store & Settings</p>

                          {onOpenArmory && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenArmory();
                                playSound('purchase');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <ShoppingBag className="h-4 w-4 text-cyan-400" />
                                <span>Rewards & Armory Store</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          {onOpenProfile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                onOpenProfile(currentUser, 'settings');
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Edit3 className="h-4 w-4 text-cyan-400" />
                                <span>Edit Username & Avatar</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}
                        </div>

                        {/* Footer Controls & Sign Out */}
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                if (onOpenLegalModal) onOpenLegalModal('faq');
                                playSound('click');
                              }}
                              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                            >
                              <HelpCircle className="h-4 w-4 text-slate-400" />
                              <span>FAQ & Rules</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSound();
                              }}
                              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                            >
                              {soundActive ? (
                                <>
                                  <Volume2 className="h-4 w-4 text-emerald-400" />
                                  <span>Audio On</span>
                                </>
                              ) : (
                                <>
                                  <VolumeX className="h-4 w-4 text-slate-500" />
                                  <span>Muted</span>
                                </>
                              )}
                            </button>
                          </div>

                          {isAuthenticated ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                if (onSignOut) onSignOut();
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                              <span>Sign Out</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserDropdownOpen(false);
                                if (onSignIn) onSignIn();
                                playSound('click');
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 transition-all cursor-pointer"
                            >
                              <User className="h-4 w-4" />
                              <span>Sign In with Google</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </>
            )}
          </div>
        )}
      </div>

        </div>
      </div>
    </header>
  );
};

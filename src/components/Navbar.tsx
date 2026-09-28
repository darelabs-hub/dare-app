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
  Compass,
  Edit3,
  MessageSquare
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
  stats?: {
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateToPath?: (path: string) => void;
  onOpenDareChat?: () => void;
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
  stats,
  searchQuery,
  setSearchQuery,
  onNavigateToPath,
  onOpenDareChat,
}) => {
  const { t } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [hubMenuOpen, setHubMenuOpen] = React.useState(false);
  const [recentSearchesOpen, setRecentSearchesOpen] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const userDropdownRef = React.useRef<HTMLDivElement>(null);
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
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setRecentSearchesOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (hubMenuRef.current && !hubMenuRef.current.contains(e.target as Node)) {
        setHubMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-8 gap-3">
        
        {/* Logo & Brand Zone */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0 min-w-0">
          <div 
            className="flex items-center cursor-pointer select-none shrink-0" 
            onClick={() => {
              if (onNavigateToPath) {
                if (isAuthenticated) {
                  onNavigateToPath('/app');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  onNavigateToPath('/');
                }
              } else {
                window.location.reload();
              }
            }}
            title={isAuthenticated ? "DARE - Dashboard" : "DARE - Home"}
          >
            <DareDayLogo size={36} showText={false} />
          </div>

          {/* Minimal Clean Navigation Links (Never wrapping or colliding) */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-slate-300 shrink-0">
            {isMarketingMode ? (
              <>
                <button
                  onClick={() => {
                    playSound('click');
                    if (onNavigateToPath) {
                      onNavigateToPath('/app');
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
                  onClick={() => {
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
                  onClick={() => {
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
                <button
                  onClick={() => {
                    playSound('click');
                    const el = document.getElementById('dares-feed-container');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Challenges
                </button>
                {onOpenTournaments && (
                  <button
                    onClick={() => {
                      playSound('laser');
                      onOpenTournaments();
                    }}
                    className="hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                  >
                    <span>Arena</span>
                  </button>
                )}
                {onOpenArmory && (
                  <button
                    onClick={() => {
                      playSound('purchase');
                      onOpenArmory();
                    }}
                    className="hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Armory
                  </button>
                )}
                {onOpenLeaderboard && (
                  <button
                    onClick={() => {
                      playSound('click');
                      onOpenLeaderboard();
                    }}
                    className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Ranks
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
              onOpenCreateModal();
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
                onClick={() => {
                  playSound('click');
                  setHubMenuOpen(prev => !prev);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hubMenuOpen
                    ? 'border-indigo-400 bg-indigo-950/80 text-white ring-1 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'border-slate-700/80 bg-slate-900/90 text-slate-200 hover:border-indigo-400 hover:bg-slate-800'
                }`}
                title="DARE Arena & Feature Hub"
              >
                <Swords className="h-3.5 w-3.5 text-pink-400" />
                <span className="hidden lg:inline">Arena & Hub</span>
                <span className="lg:hidden">Hub</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${hubMenuOpen ? 'rotate-180 text-indigo-400' : ''}`} />
              </button>

              {/* Hub Dropdown Popover */}
              {hubMenuOpen && (
                <div 
                  id="navbar-hub-dropdown-menu"
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-700 bg-[#0c1222]/98 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-1.5 mb-1 flex items-center justify-between">
                    <span>DARE Hub & Features</span>
                    <span className="text-cyan-400">v2.5</span>
                  </div>

                  {onOpenArmory && (
                    <button
                      type="button"
                      onClick={() => {
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

                  {onOpenSeasonPass && (
                    <button
                      type="button"
                      onClick={() => {
                        setHubMenuOpen(false);
                        playSound('levelUp');
                        onOpenSeasonPass();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span>{t('pass')}</span>
                      </div>
                      <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[9px] font-mono text-purple-300">
                        LVL {currentUser?.seasonPassLevel || 1}
                      </span>
                    </button>
                  )}

                  {onOpenDropZones && (
                    <button
                      type="button"
                      onClick={() => {
                        setHubMenuOpen(false);
                        playSound('laser');
                        onOpenDropZones();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-emerald-400 animate-spin-slow" />
                        <span>{t('dropZones')}</span>
                      </div>
                      <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">AR</span>
                    </button>
                  )}

                  {onOpenTournaments && (
                    <button
                      type="button"
                      onClick={() => {
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

                  {onOpenDareChat && (
                    <button
                      type="button"
                      onClick={() => {
                        setHubMenuOpen(false);
                        playSound('click');
                        onOpenDareChat();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-950/50 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-indigo-400" />
                        <span>Dare Chat</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400">AI Coach →</span>
                    </button>
                  )}

                  {onOpenProUpgrade && (
                    <button
                      type="button"
                      onClick={() => {
                        setHubMenuOpen(false);
                        playSound('oracle');
                        onOpenProUpgrade();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span>{currentUser?.isPro ? t('proActive') : t('proUpgrade')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">2x Cred</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EU Language Selector */}
          <LanguageSelector />

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

          {/* User Profile & Account Dropdown Trigger */}
          <div className="relative shrink-0" ref={userDropdownRef}>
            {!isAuthenticated ? (
              <button
                id="navbar-signin-btn"
                type="button"
                onClick={() => {
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
            ) : currentUser ? (
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
            ) : null}

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
                  className="fixed left-1/2 -translate-x-1/2 top-18 sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:absolute mt-2 w-[calc(100vw-1.5rem)] sm:w-84 max-w-sm sm:max-w-none rounded-2xl border border-slate-700 bg-[#0c1222] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[88vh] overflow-y-auto"
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

                  {onOpenProfile && (
                    <button
                      id="menu-edit-profile-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile(currentUser, 'settings');
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Edit3 className="h-4 w-4 text-cyan-400" />
                        <span>Edit Username & Avatar</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">Studio →</span>
                    </button>
                  )}

                  {onOpenLeaderboard && (
                    <button
                      id="menu-leaderboard-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenLeaderboard();
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span>Hall of Fame Leaderboard</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">Ranks →</span>
                    </button>
                  )}

                  {onOpenProfile && (
                    <button
                      id="menu-squad-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile(currentUser, 'squad');
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-indigo-400" />
                        <span>My Squad & Teammates</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">Manage →</span>
                    </button>
                  )}

                  {onOpenProfile && (
                    <button
                      id="menu-rivalry-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile(currentUser, 'rivalry');
                        playSound('click');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Swords className="h-4 w-4 text-amber-400" />
                        <span>Head-to-Head Rivalry</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">Versus →</span>
                    </button>
                  )}

                  {onOpenLiveDuels && (
                    <button
                      id="menu-live-duels-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenLiveDuels();
                        playSound('laser');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 hover:text-white transition-colors text-left cursor-pointer border border-rose-500/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <Swords className="h-4 w-4 text-rose-400 animate-pulse" />
                        <span className="flex items-center gap-1.5">
                          <span>Live 1v1 Duels Arena</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">Live →</span>
                    </button>
                  )}

                  {onOpenTournaments && (
                    <button
                      id="menu-tournaments-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenTournaments();
                        playSound('laser');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-pink-300 hover:bg-pink-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Swords className="h-4 w-4 text-pink-400" />
                        <span>Squad Tournaments</span>
                      </div>
                      <span className="text-[10px] font-mono text-pink-400 font-bold">Active →</span>
                    </button>
                  )}

                  {/* Daily Missions Shortcut */}
                  <button
                    id="menu-daily-missions-btn"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      playSound('pop');
                      const el = document.getElementById('daily-mission-widget');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        el.classList.add('ring-2', 'ring-cyan-400');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2000);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="h-4 w-4 text-cyan-400" />
                      <span>Daily Dares & Challenges</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">3 Dares →</span>
                  </button>

                  {onOpenDropZones && (
                    <button
                      id="menu-drop-zones-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDropZones();
                        playSound('laser');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Compass className="h-4 w-4 text-emerald-400" />
                        <span>Local Dares & Map</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Explore →</span>
                    </button>
                  )}

                  {onOpenArmory && (
                    <button
                      id="menu-armory-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenArmory();
                        playSound('purchase');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 text-cyan-400" />
                        <span>Rewards & Shop</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">Shop →</span>
                    </button>
                  )}

                  {onOpenSeasonPass && (
                    <button
                      id="menu-season-pass-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSeasonPass();
                        playSound('levelUp');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-950/40 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span>Season 1 Pass</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400 font-bold">LVL {currentUser?.seasonPassLevel || 1} →</span>
                    </button>
                  )}

                  {onOpenCredLog && (
                    <button
                      id="menu-cred-log-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenCredLog();
                        playSound('click');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <Coins className="h-4 w-4 text-amber-400" />
                      <span>Cred History & Activity</span>
                    </button>
                  )}

                  {/* Heatmap Link */}
                  {onOpenProfile && (
                    <button
                      id="menu-heatmap-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile(currentUser, 'location-map');
                        playSound('click');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <Map className="h-4 w-4 text-cyan-400" />
                      <span>Challenge Map</span>
                    </button>
                  )}

                  {onOpenEventsMerch && (
                    <button
                      id="menu-events-merch-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenEventsMerch();
                        playSound('click');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4 text-pink-400" />
                      <span>DARE Merch & Events</span>
                    </button>
                  )}

                  {onOpenProUpgrade && (
                    <button
                      id="menu-pro-upgrade-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProUpgrade();
                        playSound('oracle');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/50 hover:text-amber-200 border border-amber-500/30 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span>{currentUser?.isPro ? 'Manage PRO Tier' : 'Upgrade to PRO'}</span>
                      </div>
                      {!currentUser?.isPro && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-400 border border-amber-500/30">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    id="menu-create-dare-btn"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenCreateModal();
                      playSound('click');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-300 transition-colors text-left cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4 text-emerald-400" />
                    <span>Create Custom Dare</span>
                  </button>

                  <button
                    id="menu-sign-out-btn"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSignOut) onSignOut();
                      playSound('click');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-white transition-colors text-left cursor-pointer mt-1 border border-rose-500/30"
                  >
                    <X className="h-4 w-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Footer System Quick Links */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between px-1 text-xs">
                  <button
                    id="menu-faq-rules-btn"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onOpenLegalModal) onOpenLegalModal('faq');
                      playSound('click');
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors p-1 cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                    <span>FAQ & Codex</span>
                  </button>

                  <button
                    id="menu-toggle-audio-btn"
                    type="button"
                    onClick={() => {
                      onToggleSound();
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors p-1 cursor-pointer"
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
              </div>
            </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

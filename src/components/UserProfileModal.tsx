import React, { useState } from 'react';
import { UserProfile, DareItem } from '../types';
import { 
  X, 
  Flame, 
  Coins, 
  Activity, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Crown, 
  PlusCircle, 
  Clock, 
  ExternalLink, 
  Shield, 
  ShieldCheck, 
  Camera, 
  TrendingUp, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Terminal,
  Swords,
  Compass,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Radio,
  Share2,
  LogOut
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { DareActivityHeatmap } from './DareActivityHeatmap';
import { HeatmapView } from './HeatmapView';
import { QRCodeCanvas } from 'qrcode.react';
import { SquadChat } from './SquadChat';
import { CredGrowthChart } from './CredGrowthChart';
import { RivalryView } from './RivalryView';
import { 
  getPushPermissionStatus, 
  requestPushNotificationPermission, 
  getStoredPushPreferences, 
  saveStoredPushPreferences, 
  dispatchSystemNotification,
  PushPreferences 
} from '../utils/pushNotifications';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  dares: DareItem[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onOpenUpgradeModal?: () => void;
  onOpenProofGallery?: () => void;
  onSquadAction?: () => void;
  onOpenProfile?: (u: UserProfile) => void;
  initialTab?: 'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry';
  onDirectChallenge?: (targetHandle: string) => void;
  onOpenProofModal?: (dare: DareItem) => void;
  onRequestRematch?: (targetHandle: string, previousDareTitle: string) => void;
  onOpenDropZones?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  dares,
  currentUser,
  allUsers,
  isAuthenticated,
  onSignIn,
  onSignOut,
  onUpdateUser,
  onOpenUpgradeModal,
  onOpenProofGallery,
  onSquadAction,
  onOpenProfile,
  initialTab = 'heatmap',
  onDirectChallenge,
  onOpenProofModal,
  onRequestRematch,
  onOpenDropZones,
}) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry'>(initialTab);
  const [activating, setActivating] = useState(false);

  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editDisableHelp, setEditDisableHelp] = useState(user?.disableHelpBubbles || false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [squadSearchQuery, setSquadSearchQuery] = useState('');

  const [pushStatus, setPushStatus] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [pushPrefs, setPushPrefs] = useState<PushPreferences>(getStoredPushPreferences());
  const [testPushSent, setTestPushSent] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setPushStatus(getPushPermissionStatus());
      setPushPrefs(getStoredPushPreferences());
    }
  }, [isOpen]);

  const handleRequestPush = async () => {
    playSound('click');
    const result = await requestPushNotificationPermission();
    setPushStatus(result);
  };

  const handleTogglePushPref = (key: keyof PushPreferences) => {
    playSound('click');
    const updated = { ...pushPrefs, [key]: !pushPrefs[key] };
    setPushPrefs(updated);
    saveStoredPushPreferences(updated, user?.id);
  };

  const handleSendTestPush = async () => {
    playSound('laser');
    setTestPushSent(true);
    await dispatchSystemNotification({
      title: '⚡ DARE Telemetry Signal',
      body: `Direct uplink operational for @${user?.handle || 'Agent'}! +150 Cred challenge active on the Grid.`,
      tag: 'dare-test-push',
    });
    setTimeout(() => setTestPushSent(false), 3000);
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'heatmap');
    }
  }, [isOpen, initialTab]);

  React.useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditAvatar(user.avatar);
      setEditDisableHelp(user.disableHelpBubbles || false);
    }
  }, [user]);

  // Auto-generate referral code if missing - MUST be before any conditional returns
  React.useEffect(() => {
    if (isOpen && user && user.id === currentUser.id && !user.referralCode && onUpdateUser) {
      const generatedCode = 'DARE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setTimeout(() => {
        onUpdateUser({ ...user, referralCode: generatedCode });
      }, 0);
    }
  }, [isOpen, user?.id, currentUser.id, user?.referralCode, onUpdateUser]);

  if (!isOpen || !user) return null;

  const isOwnProfile = user.id === currentUser.id;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !onUpdateUser) return;
    playSound('click');
    const updated: UserProfile = {
      ...user,
      name: editName,
      avatar: editAvatar,
      disableHelpBubbles: editDisableHelp,
    };
    setTimeout(() => {
      onUpdateUser(updated);
    }, 0);
    setSaveMessage('Account settings updated successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Find dares completed by this user
  const userCompletedDares = dares.filter(d => 
    d.status === 'verified' && 
    d.proof?.submittedByHandle?.toLowerCase() === user.handle.toLowerCase()
  );

  // Find dares created by this user
  const userCreatedDares = dares.filter(d => 
    d.creator.id === user.id
  );

  const handleActivateShield = async () => {
    if (!user || activating) return;
    setActivating(true);
    playSound('oracle');

    try {
      const res = await fetch(`/api/users/${user.id}/activate-shield`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updated = await res.json();
        if (onUpdateUser) {
          setTimeout(() => {
            onUpdateUser(updated);
          }, 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(false);
    }
  };

  const handleSquadRequest = async (toUserId: string) => {
    playSound('click');
    try {
      const res = await fetch('/api/squad/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: currentUser.id, toUserId })
      });
      if (res.ok) {
        if (onSquadAction) onSquadAction();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSquadAccept = async (fromUserId: string) => {
    playSound('click');
    try {
      const res = await fetch('/api/squad/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId, toUserId: currentUser.id })
      });
      if (res.ok) {
        if (onSquadAction) onSquadAction();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSquadCancel = async (targetId: string) => {
    playSound('click');
    try {
      const res = await fetch('/api/squad/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: currentUser.id, toUserId: targetId })
      });
      if (res.ok) {
        if (onSquadAction) onSquadAction();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSquadRemove = async (friendId: string) => {
    playSound('click');
    try {
      const res = await fetch('/api/squad/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, friendId })
      });
      if (res.ok) {
        if (onSquadAction) onSquadAction();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Modal Container */}
      <div 
        id="user-profile-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0a0f1d] text-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Background Decorative Accent */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        {/* Header Block */}
        <div className="relative flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-800/60 z-10 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                className={`h-14 w-14 sm:h-18 sm:w-18 rounded-full object-cover transition-all ${
                  user.equippedFrame === 'frame_neon_cyan' ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.7)] animate-pulse' :
                  user.equippedFrame === 'frame_matrix_glitch' ? 'ring-2 ring-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.8)]' :
                  user.equippedFrame === 'frame_syndicate_gold' ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.9)]' :
                  user.equippedFrame === 'frame_quantum_void' ? 'ring-2 ring-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.9)] animate-pulse' :
                  'ring-2 ring-indigo-500/40'
                }`}
              />
              {user.isPro && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-amber-500 border-2 border-[#0a0f1d] shadow-md">
                  <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{user.name}</h3>
                {user.equippedTitle && (
                  <span className="rounded-md bg-indigo-500/20 border border-indigo-400/40 px-2 py-0.5 text-[9px] font-bold text-indigo-300">
                    {user.equippedTitle}
                  </span>
                )}
                {isOwnProfile && (
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[8px] sm:text-[9px] font-mono font-bold text-indigo-300 uppercase shrink-0">
                    Your Profile
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-mono text-indigo-400 truncate">{user.handle}</span>
                {user.isPro && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 sm:py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-[8px] sm:text-[9px] font-bold font-mono tracking-wider text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] uppercase shrink-0">
                    <Crown className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-amber-400 fill-amber-400/15" />
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-slate-400 flex-wrap">
                <span className="font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-[10px]">
                  LVL {user.level || 1} • {user.xp || 0} XP
                </span>
                <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 truncate">
                  {user.rank}
                </span>
                {user.streak && user.streak > 0 ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-500/20 shrink-0" />
                    <span>{user.streak}-Day Streak</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwnProfile && isAuthenticated && onSignOut && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onSignOut();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Sign out of this account"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}

            {isOwnProfile && !isAuthenticated && onSignIn && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onSignIn();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:brightness-110 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Close Profile"
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="shrink-0 flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Boosters Row (if any) */}
          {user.activeBoosters && user.activeBoosters.length > 0 && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Active Telemetry Overclock</div>
                  <div className="text-xs font-bold text-white">
                    {user.activeBoosters.map(b => `${b.name} (${b.usesRemaining ? `${b.usesRemaining} uses left` : 'Active'})`).join(', ')}
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300">
                BUFF APPLIED
              </span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-3 text-center">
              <Coins className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Cred Balance</p>
              <p className="text-base font-mono font-bold text-white mt-0.5">{user.cred}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Completed</p>
              <p className="text-base font-mono font-bold text-white mt-0.5">{user.completedDaresCount}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-3 text-center">
              <PlusCircle className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Created</p>
              <p className="text-base font-mono font-bold text-white mt-0.5">{user.createdDaresCount}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-3 text-center">
              <Flame className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Stake Payouts</p>
              <p className="text-base font-mono font-bold text-amber-300 mt-0.5">+{user.totalCredWonInStakes || 0} CR</p>
            </div>
          </div>

          {/* Cred Growth 30-Day Mini-Line Chart Visualization */}
          <CredGrowthChart user={user} dares={dares} />

          {/* Squad Interaction Banner */}
          {!isOwnProfile && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/10 gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400 shrink-0 animate-pulse" />
                <div className="text-left">
                  <span className="block text-[10px] font-mono font-bold text-indigo-400 tracking-wider">SQUAD HUB</span>
                  <span className="text-xs text-slate-300">
                    {currentUser.squadFriends?.includes(user.id) 
                      ? 'You are active squad mates.' 
                      : currentUser.squadReceivedRequests?.includes(user.id)
                      ? 'Sent you a connection request!'
                      : currentUser.squadSentRequests?.includes(user.id)
                      ? 'Waiting for response...'
                      : 'Connect to track progress.'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentUser.squadFriends?.includes(user.id) ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 shrink-0" /> CONNECTED
                    </span>
                    <button
                      onClick={() => handleSquadRemove(user.id)}
                      className="px-2.5 py-1 bg-rose-950/30 border border-rose-900/40 text-rose-300 hover:bg-rose-900/40 hover:border-rose-500/60 text-[10px] font-mono rounded-md transition-colors cursor-pointer"
                    >
                      Leave Squad
                    </button>
                  </div>
                ) : currentUser.squadReceivedRequests?.includes(user.id) ? (
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleSquadAccept(user.id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold font-mono rounded-md transition-colors cursor-pointer uppercase shadow-md shadow-indigo-500/10"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleSquadCancel(user.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono rounded-md transition-colors cursor-pointer uppercase"
                    >
                      Ignore
                    </button>
                  </div>
                ) : currentUser.squadSentRequests?.includes(user.id) ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-400 animate-pulse uppercase">Request Pending</span>
                    <button
                      onClick={() => handleSquadCancel(user.id)}
                      className="px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono rounded transition-colors cursor-pointer"
                    >
                      Retract
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSquadRequest(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold font-mono rounded-md transition-all cursor-pointer shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    <span>ADD TO SQUAD</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isOwnProfile && onOpenProofGallery && (
            <button
              onClick={() => {
                playSound('click');
                onOpenProofGallery();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/20 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-400 transition-all"
            >
              <Camera className="h-4 w-4" />
              Browse My Proof Gallery
            </button>
          )}

          {isOwnProfile && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/15 p-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">Refer & Earn</h4>
              
              {/* Referral Progress Tracker */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Referrals</span>
                  <span>{(user.referralCount || 0)} / 5 to Next Milestone</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${Math.min(((user.referralCount || 0) / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg">
                  <QRCodeCanvas value={`https://dare.app/?ref=${user.referralCode || 'NEWUSER'}`} size={64} />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Share your referral code: <strong>{user.referralCode || 'NOT SET'}</strong></p>
                  <p className="text-[10px] text-slate-500 mt-1">Friends get 100 Cred on signup!</p>
                </div>
              </div>
            </div>
          )}

          {/* Streak Shield Status Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/15 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                user.streakShieldActive
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse'
                  : user.isPro
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}>
                {user.streakShieldActive ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <Shield className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Streak Shield {user.streakShieldActive ? 'PROTECTION ON' : 'INACTIVE'}
                  </h4>
                  {user.streakShieldActive && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {user.streakShieldActive
                    ? `Your ${user.streak || 0}-day dare streak is frozen! You won't lose progress if you miss today.`
                    : user.isPro
                      ? "A 24-Hour streak buffer is available to prevent progress loss from unexpected offline gaps."
                      : "Lock in your progress indefinitely. Requires Premium PRO membership to activate."
                  }
                </p>
                {user.streakShieldActive && user.streakShieldExpiresAt && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                    <Clock className="h-3 w-3" />
                    <span>Active until: {new Date(user.streakShieldExpiresAt).toLocaleTimeString()}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action CTA depending on profile ownership and Pro status */}
            {isOwnProfile && (
              <div className="w-full md:w-auto shrink-0">
                {user.streakShieldActive ? (
                  <span className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs font-bold font-mono text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Shield Engaged</span>
                  </span>
                ) : user.isPro ? (
                  <button
                    type="button"
                    disabled={activating}
                    onClick={handleActivateShield}
                    className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold font-mono text-white transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                  >
                    {activating ? 'Engaging...' : 'Activate 24H Shield'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenUpgradeModal) onOpenUpgradeModal();
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/40 text-xs font-bold font-mono text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <span>Unlock with PRO</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Badges Section */}
          {user.badges && user.badges.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-indigo-400" />
                <span>Earned Profile Badges</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/40 border border-indigo-900/40 text-indigo-300"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section Selector Tabs */}
          <div className="flex border-b border-slate-800/60">
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('heatmap');
              }}
              className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all ${
                activeTab === 'heatmap'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Activity Grid
            </button>
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('location-map');
              }}
              className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all ${
                activeTab === 'location-map'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Location Map
            </button>
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('rivalry');
              }}
              className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'rivalry'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Rivalry</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('completed');
              }}
              className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all ${
                activeTab === 'completed'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Completions ({userCompletedDares.length})
            </button>
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('created');
              }}
              className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all ${
                activeTab === 'created'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Created ({userCreatedDares.length})
            </button>
            {isOwnProfile && (
              <button
                onClick={() => {
                  playSound('click');
                  setActiveTab('squad');
                }}
                className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all relative ${
                  activeTab === 'squad'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Squad ({ (user.squadFriends || []).length })</span>
                { (user.squadReceivedRequests || []).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white animate-pulse">
                    { (user.squadReceivedRequests || []).length }
                  </span>
                ) }
              </button>
            )}
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('settings');
              }}
              className={`flex-1 py-2.5 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition-all ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Settings & Analytics
            </button>
          </div>

          {/* Dynamic Tab Contents */}
          <div className="pt-2">
            {activeTab === 'rivalry' && (
              <RivalryView
                user={user}
                currentUser={currentUser}
                allUsers={allUsers}
                dares={dares}
                onChallengeRival={(targetHandle) => {
                  onClose();
                  if (onDirectChallenge) {
                    onDirectChallenge(targetHandle);
                  }
                }}
                onOpenProofModal={(dareItem) => {
                  onClose();
                  if (onOpenProofModal) {
                    onOpenProofModal(dareItem);
                  }
                }}
                onRequestRematch={(targetHandle, previousDareTitle) => {
                  if (onRequestRematch) {
                    onRequestRematch(targetHandle, previousDareTitle);
                  }
                }}
              />
            )}

            {activeTab === 'squad' && (
              <div className="space-y-6">
                {/* Squad Comms Channel */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Squad Comms Channel</span>
                  </h4>
                  <SquadChat currentUser={currentUser} />
                </div>

                {/* Pending Requests */}
                { (user.squadReceivedRequests || []).length > 0 && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/10 p-4 space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Pending Squad Requests ({(user.squadReceivedRequests || []).length})</span>
                    </h4>
                    <div className="space-y-2">
                      {allUsers
                        .filter(u => (user.squadReceivedRequests || []).includes(u.id))
                        .map(requester => (
                          <div 
                            key={requester.id}
                            className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={requester.avatar} alt={requester.name} className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-slate-700" />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{requester.name}</h5>
                                <p className="text-[10px] font-mono text-indigo-400 truncate">{requester.handle}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleSquadAccept(requester.id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold font-mono rounded transition-colors cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleSquadCancel(requester.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono rounded transition-colors cursor-pointer"
                              >
                                Ignore
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Active Friends List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Your Squad ({(user.squadFriends || []).length})</span>
                  </h4>
                  { (user.squadFriends || []).length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/10">
                      <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-mono text-slate-400 uppercase">Your Squad is Empty</p>
                      <p className="text-[11px] text-slate-500 mt-1">Search for other runners below to assemble your team!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {allUsers
                        .filter(u => (user.squadFriends || []).includes(u.id))
                        .map(friend => (
                          <div 
                            key={friend.id}
                            className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                          >
                            <div 
                              onClick={() => {
                                if (onOpenProfile) {
                                  onOpenProfile(friend);
                                }
                              }}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                            >
                              <img src={friend.avatar} alt={friend.name} className="h-10 w-10 rounded-full object-cover shrink-0 ring-1 ring-indigo-500/20 group-hover:ring-indigo-500/50 transition-all" />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{friend.name}</h5>
                                <p className="text-[10px] font-mono text-indigo-400 truncate">{friend.handle}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{friend.cred} Cred</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSquadRemove(friend.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-rose-950/40 hover:border-rose-900/40 hover:text-rose-300 text-[9px] font-mono rounded text-slate-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              Leave
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Explore & Search Users */}
                <div className="pt-4 border-t border-slate-800/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Discover New Mates</span>
                    </h4>
                    <input
                      type="text"
                      placeholder="Search handles or names..."
                      value={squadSearchQuery}
                      onChange={(e) => setSquadSearchQuery(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-full sm:w-48 font-mono"
                    />
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {(() => {
                      const discoverable = allUsers.filter(u => {
                        // Exclude self
                        if (u.id === user.id) return false;
                        // Exclude existing friends
                        if ((user.squadFriends || []).includes(u.id)) return false;
                        // Exclude pending received
                        if ((user.squadReceivedRequests || []).includes(u.id)) return false;
                        
                        // Apply search filter if specified
                        if (squadSearchQuery) {
                          const q = squadSearchQuery.toLowerCase();
                          return u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q);
                        }
                        return true;
                      });

                      if (discoverable.length === 0) {
                        return (
                          <p className="text-center py-6 text-[11px] font-mono text-slate-500 uppercase">
                            No discoverable profiles match your filter
                          </p>
                        );
                      }

                      return discoverable.map(discover => {
                        const hasSentRequest = (user.squadSentRequests || []).includes(discover.id);
                        return (
                          <div 
                            key={discover.id}
                            className="p-3 rounded-lg border border-slate-800 bg-slate-900/10 flex items-center justify-between gap-3"
                          >
                            <div 
                              onClick={() => {
                                if (onOpenProfile) onOpenProfile(discover);
                              }}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                            >
                              <img src={discover.avatar} alt={discover.name} className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-slate-800" />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white hover:text-indigo-400 transition-colors truncate">{discover.name}</h5>
                                <p className="text-[10px] font-mono text-indigo-400 truncate">{discover.handle}</p>
                              </div>
                            </div>
                            <div>
                              {hasSentRequest ? (
                                <button
                                  onClick={() => handleSquadCancel(discover.id)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  Pending...
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSquadRequest(discover.id)}
                                  className="px-2.5 py-1 bg-indigo-600/30 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-300 text-[10px] font-mono font-bold rounded transition-all cursor-pointer"
                                >
                                  Add to Squad
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'heatmap' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time synchronization of decentralized activity. This grid tracks verification events approved by the AI verification engine or community consensus.
                </p>
                <DareActivityHeatmap user={user} dares={dares} />
              </div>
            )}

            {activeTab === 'location-map' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Geographical visualization of dare activity. Data points are aggregated based on completed dares.
                </p>
                <HeatmapView 
                  dares={dares} 
                  onOpenDropZones={() => {
                    onClose();
                    if (onOpenDropZones) onOpenDropZones();
                  }}
                />
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-3">
                {userCompletedDares.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/10">
                    <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-mono text-slate-400 uppercase">No recent completed dares found in this sector</p>
                    <p className="text-[11px] text-slate-500 mt-1">Accept open dares on the feed and submit proof to log completions.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {userCompletedDares.map((dare) => (
                      <div 
                        key={dare.id}
                        className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-all flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <h5 className="text-xs font-semibold text-white truncate">{dare.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-900/40 uppercase">
                              {dare.category}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono">
                              +{dare.rewardCred} Cred
                            </span>
                          </div>
                        </div>
                        {dare.proof?.aiJudgement?.verdict && (
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border shrink-0 ${
                            dare.proof.aiJudgement.verdict === 'LEGENDARY'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {dare.proof.aiJudgement.verdict}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'created' && (
              <div className="space-y-3">
                {userCreatedDares.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/10">
                    <PlusCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-mono text-slate-400 uppercase">No created challenges found in this sector</p>
                    <p className="text-[11px] text-slate-500 mt-1">Click &quot;Create Challenge&quot; on the navbar to deploy your first custom dare.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {userCreatedDares.map((dare) => (
                      <div 
                        key={dare.id}
                        className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-all flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <h5 className="text-xs font-semibold text-white truncate">{dare.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-900/40 uppercase">
                              {dare.category}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono">
                              Bounty: {dare.rewardCred} Cred
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-[10px] text-slate-400 font-mono capitalize">
                              {dare.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          {dare.targetType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-5">
                {/* Account Analytics Section */}
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/10 p-4 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    <span>Account Performance & Analytics</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 text-center">
                      <div className="text-[10px] text-slate-400 font-mono">Success Ratio</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                        {user.completedDaresCount > 0 ? '98.5%' : '0%'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 text-center">
                      <div className="text-[10px] text-slate-400 font-mono">Total Earned</div>
                      <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                        {user.cred} CR
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 text-center">
                      <div className="text-[10px] text-slate-400 font-mono">Active Streak</div>
                      <div className="text-sm font-mono font-bold text-indigo-400 mt-0.5">
                        {user.streak || 0} Days
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 text-center">
                      <div className="text-[10px] text-slate-400 font-mono">Global Rank</div>
                      <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                        {user.rank}
                      </div>
                    </div>
                  </div>

                  {/* Cred Growth 30-Day Mini-Line Chart Visualization */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <CredGrowthChart user={user} dares={dares} className="border-0 bg-transparent p-0" />
                  </div>
                </div>

                {/* Web Push & System Telemetry Notifications Hub */}
                {isOwnProfile && (
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400 bg-cyan-950/60 text-cyan-400">
                          <BellRing className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                            Web Push & System Alerts Protocol
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Native device push notifications & instant telemetry
                          </span>
                        </div>
                      </div>

                      {/* Push Permission Indicator & Button */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          pushStatus === 'granted'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : pushStatus === 'denied'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}>
                          <Radio className="h-2.5 w-2.5 animate-pulse" />
                          <span>Status: {pushStatus}</span>
                        </span>

                        {pushStatus !== 'granted' && (
                          <button
                            type="button"
                            onClick={handleRequestPush}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech text-xs font-bold uppercase transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
                          >
                            Grant Permission
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preference Toggles Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                        <span className="text-slate-300">Direct Challenge Targets</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.directDares}
                          onChange={() => handleTogglePushPref('directDares')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                        <span className="text-slate-300">High-Roller Stakes & Wagers</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.stakes}
                          onChange={() => handleTogglePushPref('stakes')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                        <span className="text-slate-300">AR Drop Zone Proximity</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.dropZones}
                          onChange={() => handleTogglePushPref('dropZones')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                        <span className="text-slate-300">Daily Mission Drops & Streaks</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.dailyOps}
                          onChange={() => handleTogglePushPref('dailyOps')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                        />
                      </label>
                    </div>

                    {/* Test Push Button */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Verify system notification dispatch and acoustic telemetry
                      </span>
                      <button
                        type="button"
                        id="test-push-notification-btn"
                        onClick={handleSendTestPush}
                        disabled={testPushSent}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Bell className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{testPushSent ? 'Signal Dispatched!' : 'Send Test Web Push'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Settings Form */}
                {isOwnProfile ? (
                  <form onSubmit={handleSaveSettings} className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <span>Account Settings & Profile Customization</span>
                    </h4>

                    {saveMessage && (
                      <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                        {saveMessage}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Display Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avatar Image URL</label>
                      <input
                        type="url"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60">
                      <div className="flex flex-col">
                        <label htmlFor="disable-help-bubbles-toggle" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide cursor-pointer">
                          Disable Navigation Help Bubbles
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Hide the interactive tutorial overlay guides</span>
                      </div>
                      <input
                        id="disable-help-bubbles-toggle"
                        type="checkbox"
                        checked={editDisableHelp}
                        onChange={(e) => setEditDisableHelp(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('start-dareday-tour'));
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 py-2.5 text-xs font-bold text-indigo-200 transition-all shadow-sm cursor-pointer"
                    >
                      <Compass className="h-4 w-4 text-indigo-400" />
                      <span>Launch Interactive Platform Tour</span>
                    </button>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                    >
                      Save Account Settings
                    </button>

                    {/* Account Session Controls */}
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Account Session
                      </h4>
                      {isAuthenticated ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5 space-y-2.5">
                          <p className="text-[11px] text-slate-300">
                            Currently signed in as <span className="font-bold text-white">{user.name}</span> (<span className="text-indigo-300 font-mono">{user.handle}</span>).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              playSound('click');
                              if (onSignOut) onSignOut();
                              onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/50 bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 py-2.5 text-xs font-bold transition-all cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out of this Device</span>
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 space-y-2.5">
                          <p className="text-[11px] text-slate-300">
                            You are using an isolated guest session. Sign in with Google to save your Cred and profile.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              playSound('click');
                              if (onSignIn) onSignIn();
                              onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-2.5 text-xs font-bold transition-all shadow-md hover:brightness-110 cursor-pointer"
                          >
                            <span>Sign In with Google</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-mono">
                    Account settings can only be managed on your own active profile.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60 bg-[#07090e]/80 flex justify-between items-center text-[10px] font-mono text-slate-400 z-10">
          <span>Grid Active Telemetry Established</span>
          <span>Rank • {user.rank}</span>
        </div>
      </div>
    </div>
  );
};

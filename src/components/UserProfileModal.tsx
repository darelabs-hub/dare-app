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
  Swords, 
  Compass, 
  Bell, 
  BellRing, 
  Radio, 
  Share2, 
  LogOut, 
  Edit3, 
  Trash2, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  MapPin,
  Target
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { DareActivityHeatmap } from './DareActivityHeatmap';
import { auth, db, getAuthHeaders, getSafeIdToken } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { HeatmapView } from './HeatmapView';
import { QRCodeCanvas } from 'qrcode.react';
import { SquadChat } from './SquadChat';
import { CredGrowthChart } from './CredGrowthChart';
import { RivalryView } from './RivalryView';
import { ShareProfileModal } from './ShareProfileModal';
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
  onEditDare?: (dare: DareItem) => void;
  onDeleteDare?: (dare: DareItem) => void;
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
  onEditDare,
  onDeleteDare,
}) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry'>(initialTab);
  const [activating, setActivating] = useState(false);
  const [isShareProfileOpen, setIsShareProfileOpen] = useState(false);

  const [editHandle, setEditHandle] = useState(user?.handle || '');
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editDisableHelp, setEditDisableHelp] = useState(user?.disableHelpBubbles || false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  // Synchronize edit inputs whenever user prop changes or modal opens
  React.useEffect(() => {
    if (user && isOpen) {
      setEditName(user.name || '');
      setEditHandle(user.handle || '');
      setEditAvatar(user.avatar || '');
      setEditDisableHelp(user.disableHelpBubbles || false);
      setSaveError(null);
    }
  }, [user?.id, user?.name, user?.handle, user?.avatar, user?.disableHelpBubbles, isOpen]);

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
    playSound('pop');
    setTestPushSent(true);
    await dispatchSystemNotification({
      title: '⚡ DARE Notification Test',
      body: `Challenge alert for ${user?.name || 'Member'} (${user?.handle || '@user'})! +250 Cred challenge active.`,
      tag: 'DARE NOTIFICATION',
      userId: user?.id,
    });
    setTimeout(() => setTestPushSent(false), 3500);
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'heatmap');
    }
  }, [isOpen, initialTab]);

  // Auto-generate referral code if missing
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

  // Handle local image file upload & compression (JPEG / PNG)
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid JPEG or PNG image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Uploaded image exceeds 10MB size limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setEditAvatar(compressedDataUrl);
          playSound('click');
          setSaveError(null);
        } else {
          setEditAvatar(dataUrl);
          playSound('click');
          setSaveError(null);
        }
      };
      img.onerror = () => {
        setSaveError('Failed to process image file. Please try another JPEG/PNG.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setSaveError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveError(null);
    setSaveMessage(null);
    setIsSaving(true);
    playSound('click');

    let formattedHandle = editHandle.trim();
    if (!formattedHandle.startsWith('@')) {
      formattedHandle = `@${formattedHandle}`;
    }

    const handleRegex = /^@[a-zA-Z0-9_]{3,24}$/;
    if (!handleRegex.test(formattedHandle)) {
      setSaveError('Username must be 3-24 characters using letters, numbers, and underscores (e.g. @dare_alex).');
      setIsSaving(false);
      return;
    }

    const isTaken = allUsers.some(
      (u) => u.id !== user.id && u.handle.toLowerCase() === formattedHandle.toLowerCase()
    );
    if (isTaken) {
      setSaveError(`Username ${formattedHandle} is already taken. Please choose another.`);
      setIsSaving(false);
      return;
    }

    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName.length < 1) {
      setSaveError('Please provide a valid Display Name.');
      setIsSaving(false);
      return;
    }

    const trimmedAvatar = editAvatar.trim();
    if (!trimmedAvatar) {
      setSaveError('Please select or provide an avatar image.');
      setIsSaving(false);
      return;
    }

    const updatedUserObj: UserProfile = {
      ...user,
      handle: formattedHandle,
      name: trimmedName,
      avatar: trimmedAvatar,
      disableHelpBubbles: editDisableHelp,
    };

    try {
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: trimmedName,
            photoURL: trimmedAvatar,
          });
        } catch (authErr) {
          console.warn('Firebase Auth updateProfile notice:', authErr);
        }
      }

      if (!user.id.startsWith('guest_')) {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            handle: formattedHandle,
            name: trimmedName,
            avatar: trimmedAvatar,
            disableHelpBubbles: editDisableHelp,
            updatedAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          try {
            await setDoc(
              doc(db, 'users', user.id),
              {
                id: user.id,
                handle: formattedHandle,
                name: trimmedName,
                avatar: trimmedAvatar,
                disableHelpBubbles: editDisableHelp,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (setErr) {
            console.warn('Firestore direct profile update notice:', setErr);
          }
        }
      }

      let idToken: string | null = null;
      try {
        idToken = await getSafeIdToken(auth.currentUser, true);
      } catch (_tokenErr) {}

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          handle: formattedHandle,
          name: trimmedName,
          avatar: trimmedAvatar,
          disableHelpBubbles: editDisableHelp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedUser = data.user || updatedUserObj;
        try {
          localStorage.setItem('dareday_custom_name', trimmedName);
          if (!savedUser.id.startsWith('guest_')) {
            localStorage.setItem(`dareday_profile_${savedUser.id}`, JSON.stringify(savedUser));
          } else {
            localStorage.setItem('dareday_guest_session', JSON.stringify(savedUser));
          }
          localStorage.setItem('dareday_last_custom_profile', JSON.stringify(savedUser));
        } catch (_e) {}
        if (onUpdateUser) {
          onUpdateUser(savedUser);
        }
        playSound('purchase');
        setSaveMessage('Profile successfully updated!');
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        if (onUpdateUser) {
          onUpdateUser(updatedUserObj);
        }
        try {
          if (!user.id.startsWith('guest_')) {
            localStorage.setItem(`dareday_profile_${user.id}`, JSON.stringify(updatedUserObj));
          }
        } catch (_e) {}
        playSound('purchase');
        setSaveMessage('Profile picture and details updated!');
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } catch (err: any) {
      console.warn('Profile update fallback:', err);
      if (onUpdateUser) {
        onUpdateUser(updatedUserObj);
      }
      try {
        if (!user.id.startsWith('guest_')) {
          localStorage.setItem(`dareday_profile_${user.id}`, JSON.stringify(updatedUserObj));
        }
      } catch (_e) {}
      setSaveMessage('Profile changes saved.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const userCompletedDares = dares.filter(d => 
    d.status === 'verified' && 
    d.proof?.submittedByHandle?.toLowerCase() === user.handle.toLowerCase()
  );

  const userCreatedDares = dares.filter(d => 
    d.creator.id === user.id
  );

  const handleActivateShield = async () => {
    if (!user || activating) return;
    setActivating(true);
    playSound('complete');

    try {
      const headers = await getAuthHeaders(user.id);
      const res = await fetch(`/api/users/${user.id}/activate-shield`, {
        method: 'POST',
        headers
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
      const headers = await getAuthHeaders(currentUser.id);
      const res = await fetch('/api/squad/request', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders(currentUser.id);
      const res = await fetch('/api/squad/accept', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders(currentUser.id);
      const res = await fetch('/api/squad/cancel', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders(currentUser.id);
      const res = await fetch('/api/squad/remove', {
        method: 'POST',
        headers,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container: Apple / Nike clean dark slate standard */}
      <div 
        id="user-profile-modal-container"
        className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] text-slate-100 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
      >
        {/* Top Header Row */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0C1018] shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Profile
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              · Member
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile && isAuthenticated && onSignOut && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onSignOut();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              aria-label="Close Profile"
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Profile Identity Card: Modern Social Profile Layout */}
        <div className="px-6 pt-5 pb-5 bg-white/[0.01] border-b border-white/[0.08] shrink-0 space-y-4">
          <div className="flex items-start gap-4">
            {/* Avatar with clean border */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full p-0.5 border border-white/20 bg-slate-900 shadow-sm">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover bg-slate-950"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              {user.isPro && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold shadow-sm border-2 border-[#0A0D14]">
                  👑
                </span>
              )}
            </div>

            {/* Name, Handle, Rank & Bio */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {user.name}
                </h3>
                {user.isPro && <span className="text-xs">👑</span>}
                {user.rank && (
                  <span className="text-xs text-slate-400 font-normal">
                    · {user.rank}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {user.handle}
              </p>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Living for the next dare. Complete challenges, earn Cred, and level up.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 pt-1">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setActiveTab('settings');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setIsShareProfileOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Share Profile</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    handleSquadRequest(user.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Join Squad</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setIsShareProfileOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Share Profile</span>
                </button>
              </>
            )}
          </div>

          {/* Inline Stats Row */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
            <div className="px-2 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-sm font-bold text-white font-mono tabular-nums">{userCompletedDares.length}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Completed</div>
            </div>
            <div className="px-2 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-sm font-bold text-white font-mono tabular-nums">{userCreatedDares.length}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Created</div>
            </div>
            <div className="px-2 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-sm font-bold text-amber-300 font-mono tabular-nums">{user.cred}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Cred</div>
            </div>
            <div className="px-2 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-sm font-bold text-slate-200 font-mono tabular-nums">{(user.squadFriends || []).length}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Squad</div>
            </div>
          </div>
        </div>

        {/* Clean Segmented Tab Navigation Bar */}
        <div className="flex items-center overflow-x-auto no-scrollbar px-4 sm:px-6 py-2.5 bg-[#070A10]/95 border-b border-white/[0.08] shrink-0">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] max-w-full">
            {[
              { id: 'heatmap', label: 'Activity' },
              { id: 'completed', label: `Dares · ${userCompletedDares.length}` },
              { id: 'created', label: `Created · ${userCreatedDares.length}` },
              { id: 'squad', label: `Squad · ${(user.squadFriends || []).length}` },
              { id: 'rivalry', label: 'Rivalry' },
              { id: 'settings', label: 'Settings' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Single Smooth Scroll Container (No nested scroll traps!) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain">
          
          {/* TAB 1: ACTIVITY (Default overview: score, streak, heatmap, performance, badges) */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Trust Score & Streak Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Reputation & Trust Score
                      </span>
                      <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        {user.reputationScore || 960}/1000
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2.5">
                      <div className="h-2 w-36 sm:w-48 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.round(((user.reputationScore || 960) / 1000) * 100))}%` }} 
                        />
                      </div>
                      <span className="text-[11px] text-slate-300 font-mono">
                        {Math.round(((user.reputationScore || 960) / 1000) * 100)}% Authenticity Index
                      </span>
                    </div>
                  </div>

                  {/* Daily Streak Highlight */}
                  <div className="flex items-center gap-2.5 bg-black/50 border border-amber-500/30 px-3.5 py-2 rounded-xl shrink-0">
                    <Flame className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                    <div className="text-left font-mono">
                      <span className="text-xs font-bold text-amber-300 block">{user.streak || 0}-Day Streak</span>
                      <span className="text-[10px] text-slate-400">Multiplier Active</span>
                    </div>
                  </div>
                </div>

                {/* Unlockable Titles Carousel */}
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                    Equipped Title:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      'Risk Runner',
                      'Urban Explorer',
                      'Fearless',
                      'Daredevil',
                      'Apex Challenger'
                    ].map(title => {
                      const isEquipped = user.equippedTitle === title;
                      return (
                        <button
                          key={title}
                          type="button"
                          onClick={async () => {
                            if (isOwnProfile && onUpdateUser) {
                              playSound('click');
                              onUpdateUser({ ...user, equippedTitle: title });
                              try {
                                const headers = await getAuthHeaders(user.id);
                                await fetch(`/api/users/${user.id}/profile`, {
                                  method: 'PATCH',
                                  headers,
                                  body: JSON.stringify({ equippedTitle: title }),
                                });
                              } catch (_e) {}
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            isEquipped
                              ? 'border border-cyan-400 bg-cyan-950/80 text-cyan-200'
                              : isOwnProfile
                              ? 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200 cursor-pointer'
                              : 'border border-slate-800/60 bg-slate-950 text-slate-500 cursor-default'
                          }`}
                        >
                          {isEquipped ? '★ ' : ''}{title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 30-Day Activity Heatmap */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>30-Day Activity Grid</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Verified challenges</span>
                </div>
                <DareActivityHeatmap user={user} dares={dares} />
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-center">
                  <Coins className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Cred Balance</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">{user.cred}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Completed</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">{user.completedDaresCount}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-center">
                  <PlusCircle className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Created</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">{user.createdDaresCount}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-center">
                  <Flame className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Bounties Won</p>
                  <p className="text-sm font-mono font-bold text-amber-300 mt-0.5">+{user.totalCredWonInStakes || 0} CR</p>
                </div>
              </div>

              {/* Cred Growth Trend Chart */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                <CredGrowthChart user={user} dares={dares} />
              </div>

              {/* Badges Section */}
              {user.badges && user.badges.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-2.5">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-400" />
                    <span>Earned Community Badges</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700/80 text-slate-200"
                      >
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak Shield Status Section */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border shrink-0 ${
                    user.streakShieldActive
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-900 text-slate-500'
                  }`}>
                    {user.streakShieldActive ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Streak Shield {user.streakShieldActive ? 'Active' : 'Inactive'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {user.streakShieldActive
                        ? `Your ${user.streak || 0}-day streak is protected for 24 hours.`
                        : user.isPro
                          ? '24-hour streak buffer is ready to activate.'
                          : 'Protect your streak from missed days. Included with PRO.'}
                    </p>
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="w-full sm:w-auto shrink-0">
                    {user.streakShieldActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold font-mono text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        <span>Protected</span>
                      </span>
                    ) : user.isPro ? (
                      <button
                        type="button"
                        disabled={activating}
                        onClick={handleActivateShield}
                        className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        {activating ? 'Activating...' : 'Activate Shield'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenUpgradeModal) onOpenUpgradeModal();
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition-all cursor-pointer"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        <span>Get PRO Shield</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETED DARES */}
          {activeTab === 'completed' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Proof Gallery Quick Action */}
              {isOwnProfile && onOpenProofGallery && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onOpenProofGallery();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 py-3 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm"
                >
                  <Camera className="h-4 w-4 text-cyan-400" />
                  <span>Open Completed Proof Gallery</span>
                </button>
              )}

              {userCompletedDares.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 px-4">
                  <Target className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white">No Completed Dares Yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Accept open dares from the community feed and submit your proof to record verified completions here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      onClose();
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-black text-xs font-bold transition-all cursor-pointer"
                  >
                    Explore Open Dares
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                    <span>Verified Achievements</span>
                    <span>{userCompletedDares.length} Completed</span>
                  </div>

                  {userCompletedDares.map((dare) => (
                    <div 
                      key={dare.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-white truncate">{dare.title}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40 uppercase">
                            {dare.category}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            +{dare.rewardCred} Cred
                          </span>
                        </div>
                      </div>
                      {dare.proof?.aiJudgement?.verdict && (
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border shrink-0 ${
                          dare.proof.aiJudgement.verdict === 'LEGENDARY'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
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

          {/* TAB 3: CREATED DARES */}
          {activeTab === 'created' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {userCreatedDares.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 px-4">
                  <PlusCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white">No Created Challenges Yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Deploy your own dares for the community or challenge friends with a custom pot.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      onClose();
                      window.dispatchEvent(new CustomEvent('open-create-dare-modal'));
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    Create Challenge
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                    <span>Active & Past Challenges</span>
                    <span>{userCreatedDares.length} Total</span>
                  </div>

                  {userCreatedDares.map((dare) => (
                    <div 
                      key={dare.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-white truncate">{dare.title}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40 uppercase">
                            {dare.category}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            Bounty: {dare.rewardCred} Cred
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[10px] text-slate-400 font-mono capitalize">
                            {dare.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOwnProfile && (
                          <>
                            {onEditDare && (
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  onEditDare(dare);
                                }}
                                title="Edit Dare"
                                className="p-1.5 rounded-lg border border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {onDeleteDare && (
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  onDeleteDare(dare);
                                }}
                                title="Delete Dare"
                                className="p-1.5 rounded-lg border border-rose-900/40 bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-900/60 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                        <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-800/80 px-2 py-0.5 rounded">
                          {dare.targetType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SQUAD */}
          {activeTab === 'squad' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Squad Chat */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Squad Chat Channel</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Live Team Comms</span>
                </div>
                <SquadChat currentUser={currentUser} />
              </div>

              {/* Pending Requests */}
              {(user.squadReceivedRequests || []).length > 0 && (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Pending Requests ({(user.squadReceivedRequests || []).length})</span>
                  </h4>
                  <div className="space-y-2">
                    {allUsers
                      .filter(u => (user.squadReceivedRequests || []).includes(u.id))
                      .map(requester => (
                        <div 
                          key={requester.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3"
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
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleSquadCancel(requester.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] rounded-lg transition-colors cursor-pointer"
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
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Your Squad ({(user.squadFriends || []).length})</span>
                  </h4>
                </div>

                {(user.squadFriends || []).length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/10">
                    <Users className="h-7 w-7 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">Your Squad is Empty</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Search for friends below to assemble your team!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {allUsers
                      .filter(u => (user.squadFriends || []).includes(u.id))
                      .map(friend => (
                        <div 
                          key={friend.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div 
                            onClick={() => {
                              if (onOpenProfile) onOpenProfile(friend);
                            }}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          >
                            <img src={friend.avatar} alt={friend.name} className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-slate-700" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{friend.name}</h5>
                              <p className="text-[10px] font-mono text-slate-400 truncate">{friend.handle}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSquadRemove(friend.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-[10px] font-mono rounded text-slate-400 transition-all cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                          >
                            Leave
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Discover Mates */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Find Members</span>
                  </h4>
                  <input
                    type="text"
                    placeholder="Search handles or names..."
                    value={squadSearchQuery}
                    onChange={(e) => setSquadSearchQuery(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-full sm:w-52 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  {(() => {
                    const discoverable = allUsers.filter(u => {
                      if (u.id === user.id) return false;
                      if ((user.squadFriends || []).includes(u.id)) return false;
                      if ((user.squadReceivedRequests || []).includes(u.id)) return false;
                      if (squadSearchQuery) {
                        const q = squadSearchQuery.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q);
                      }
                      return true;
                    });

                    if (discoverable.length === 0) {
                      return (
                        <p className="text-center py-6 text-xs text-slate-500 font-mono">
                          No discoverable profiles match your search
                        </p>
                      );
                    }

                    return discoverable.slice(0, 6).map(discover => {
                      const hasSentRequest = (user.squadSentRequests || []).includes(discover.id);
                      return (
                        <div 
                          key={discover.id}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3"
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
                              <p className="text-[10px] font-mono text-slate-400 truncate">{discover.handle}</p>
                            </div>
                          </div>
                          <div>
                            {hasSentRequest ? (
                              <button
                                onClick={() => handleSquadCancel(discover.id)}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Pending...
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSquadRequest(discover.id)}
                                className="px-3 py-1 bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600 text-indigo-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
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

          {/* TAB 5: RIVALRY */}
          {activeTab === 'rivalry' && (
            <div className="animate-in fade-in duration-200">
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
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {isOwnProfile ? (
                <>
                  {/* Account Identity Form */}
                  <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-cyan-400" />
                        <span>Profile & Details</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Account Info
                      </span>
                    </div>

                    {saveError && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 font-mono flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    {saveMessage && (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 font-mono flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{saveMessage}</span>
                      </div>
                    )}

                    {/* Avatar Upload Area */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="relative shrink-0 group">
                        <img
                          src={editAvatar || user.avatar}
                          alt="Avatar Preview"
                          className="h-18 w-18 rounded-full object-cover ring-2 ring-slate-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.png';
                          }}
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-mono font-bold text-center">
                          <Camera className="h-4 w-4 mb-0.5" />
                          <span>Change</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-slate-300 font-medium">Update Profile Picture</p>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Choose JPEG/PNG</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            setSaveError(null);
                          }}
                          placeholder="Your Name"
                          maxLength={40}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Username (@handle)
                        </label>
                        <input
                          type="text"
                          value={editHandle.startsWith('@') ? editHandle.substring(1) : editHandle}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            setEditHandle(`@${cleaned}`);
                            setSaveError(null);
                          }}
                          placeholder="username"
                          maxLength={24}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </form>

                  {/* Notification Preferences */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                        <Bell className="h-4 w-4 text-slate-400" />
                        <span>Notification Preferences</span>
                      </h4>
                      {pushStatus !== 'granted' && (
                        <button
                          type="button"
                          onClick={handleRequestPush}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                        >
                          Enable Alerts
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                        <span className="text-xs text-slate-300">Direct Challenge Alerts</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.directDares}
                          onChange={() => handleTogglePushPref('directDares')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-white focus:ring-white cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                        <span className="text-xs text-slate-300">Challenge Pot & Bounty Updates</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.stakes}
                          onChange={() => handleTogglePushPref('stakes')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-white focus:ring-white cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                        <span className="text-xs text-slate-300">Daily Drop Reminders</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.dailyOps}
                          onChange={() => handleTogglePushPref('dailyOps')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-white focus:ring-white cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                        <span className="text-xs text-slate-300">Sound Effects & Audio Chimes</span>
                        <input
                          type="checkbox"
                          checked={pushPrefs.soundEnabled}
                          onChange={() => handleTogglePushPref('soundEnabled')}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-white focus:ring-white cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSendTestPush}
                        disabled={testPushSent}
                        className="px-3.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {testPushSent ? '✓ Alert Sent' : 'Send Test Notification'}
                      </button>
                    </div>
                  </div>

                  {/* Refer & Earn Card */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                      Invite Friends & Earn Cred
                    </h4>
                    <div className="flex items-center gap-4 p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <div className="p-1.5 bg-white rounded-lg shrink-0 shadow-sm">
                        <QRCodeCanvas value={`https://dare.app/?ref=${user.referralCode || 'NEWUSER'}`} size={64} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium">Your Invite Code: <strong className="text-amber-300 font-mono">{user.referralCode || 'NOT SET'}</strong></p>
                        <p className="text-xs text-slate-400 mt-0.5">Friends receive 100 Cred upon signup.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400 font-mono">
                  Account settings can only be managed on your own profile.
                </div>
              )}
            </div>
          )}

          {/* Location Map Tab */}
          {activeTab === 'location-map' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <HeatmapView 
                dares={dares} 
              />
            </div>
          )}

        </div>

        {/* Modal Footer: Clean Social Status Bar */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 bg-[#070A10] flex justify-between items-center text-xs text-slate-400 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">
              Community Member · <span className="text-cyan-400 font-semibold">{user.rank || 'Active'}</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {user.streak ? `${user.streak}d streak · ` : ''}{user.cred || 0} Cred
          </span>
        </div>
      </div>

      {/* Share Profile Modal Dialog */}
      {user && (
        <ShareProfileModal
          isOpen={isShareProfileOpen}
          onClose={() => setIsShareProfileOpen(false)}
          user={user}
        />
      )}
    </div>
  );
};

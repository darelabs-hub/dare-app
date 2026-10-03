/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPageExperience } from './components/LandingPageExperience';
import { HeroBanner } from './components/HeroBanner';
import { DareCard } from './components/DareCard';
import { SocialFeedWall } from './components/SocialFeedWall';
import { DailyMissionWidget } from './components/DailyMissionWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { SystemAlertHUD } from './components/SystemAlertHUD';
import { HelpBubbleSystem } from './components/HelpBubbleSystem';
import { Footer } from './components/Footer';
import { SocialActivityFeed } from './components/SocialActivityFeed';
import { ConfettiEffect, triggerConfetti } from './components/ConfettiEffect';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ShareToast, ToastData } from './components/ShareToast';
import { ExpiryNotificationToast, ExpiryToastData } from './components/ExpiryNotificationToast';
import type { LegalTab } from './components/LegalAndFaqModal';
import type { StoryItem } from './components/StoryViewerModal';

// Code-split dynamic chunks loaded on-demand to minimize initial bundle size and parse time
const CreateDareModal = React.lazy(() => import('./components/CreateDareModal').then(m => ({ default: m.CreateDareModal })));
const DeleteDareModal = React.lazy(() => import('./components/DeleteDareModal').then(m => ({ default: m.DeleteDareModal })));
const ProofModal = React.lazy(() => import('./components/ProofModal').then(m => ({ default: m.ProofModal })));
const ProofGalleryModal = React.lazy(() => import('./components/ProofGalleryModal').then(m => ({ default: m.ProofGalleryModal })));
const ProofViewerModal = React.lazy(() => import('./components/ProofViewerModal').then(m => ({ default: m.ProofViewerModal })));
const LeaderboardModal = React.lazy(() => import('./components/LeaderboardModal').then(m => ({ default: m.LeaderboardModal })));
const OracleSurpriseModal = React.lazy(() => import('./components/OracleSurpriseModal').then(m => ({ default: m.OracleSurpriseModal })));
const CommentsDrawer = React.lazy(() => import('./components/CommentsDrawer').then(m => ({ default: m.CommentsDrawer })));
const LegalAndFaqModal = React.lazy(() => import('./components/LegalAndFaqModal').then(m => ({ default: m.LegalAndFaqModal })));
const CredLogModal = React.lazy(() => import('./components/CredLogModal').then(m => ({ default: m.CredLogModal })));
const ProUpgradeModal = React.lazy(() => import('./components/ProUpgradeModal').then(m => ({ default: m.ProUpgradeModal })));
const UserProfileModal = React.lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const ArmoryModal = React.lazy(() => import('./components/ArmoryModal').then(m => ({ default: m.ArmoryModal })));
const DareStakingModal = React.lazy(() => import('./components/DareStakingModal').then(m => ({ default: m.DareStakingModal })));
const SquadTournamentsModal = React.lazy(() => import('./components/SquadTournamentsModal').then(m => ({ default: m.SquadTournamentsModal })));
const LiveDuelsArenaModal = React.lazy(() => import('./components/LiveDuelsArenaModal').then(m => ({ default: m.LiveDuelsArenaModal })));
const ShareCardModal = React.lazy(() => import('./components/ShareCardModal').then(m => ({ default: m.ShareCardModal })));
const DareCoachModal = React.lazy(() => import('./components/DareCoachModal').then(m => ({ default: m.DareCoachModal })));
const AiDareLabModal = React.lazy(() => import('./components/AiDareLabModal').then(m => ({ default: m.AiDareLabModal })));
const SignInModal = React.lazy(() => import('./components/SignInModal').then(m => ({ default: m.SignInModal })));
const StoryViewerModal = React.lazy(() => import('./components/StoryViewerModal').then(m => ({ default: m.StoryViewerModal })));
const CreateStoryModal = React.lazy(() => import('./components/CreateStoryModal').then(m => ({ default: m.CreateStoryModal })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = React.lazy(() => import('./pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
import { useAuth } from './hooks/useAuth';
import { db, getSafeIdToken } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DareItem, UserProfile, NotificationItem, CredTransaction } from './types';
import { fetchWithRetry } from './utils/api';
import { isSoundEnabled, toggleSound, playSound } from './utils/soundEffects';
import { AlertCircle, Flame, Plus, ShieldCheck, Sparkles, Compass, HelpCircle, FileText, Lock, Mail, Link2, X } from 'lucide-react';
import { initAnalytics, trackEvent, identifyUser, resetAnalytics } from './utils/analytics';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname.toLowerCase();
    const hasSignedInBefore = localStorage.getItem('dareday_user_has_signed_in') === 'true';
    const isLegalPage = path === '/privacy' || path === '/privacy-policy' || path === '/terms' || path === '/terms-of-service';
    if (hasSignedInBefore && (path === '/' || path === '') && !isLegalPage) {
      window.history.replaceState({}, '', '/app');
      return '/app';
    }
    return path;
  });

  useEffect(() => {
    // Initialize external analytics (PostHog EU, GA4, etc.) and pageview tracking
    initAnalytics();

    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      setCurrentPath(path);
      trackEvent({
        event: 'page_view',
        category: 'navigation',
        label: window.location.pathname,
      });
    };
    window.addEventListener('popstate', handlePopState);

    // Check for Stripe Checkout return
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment_status');

    if (paymentStatus === 'success' && sessionId) {
      fetch(`/api/stripe/verify-session/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
            setUsers(prev => prev.map(u => u.id === data.user.id ? data.user : u));
          }
          triggerConfetti();
          playSound('complete');
          fetchNotifications();
          fetchStats();
        })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.toLowerCase());
  };
  const getInitialUser = (): UserProfile => {
    // 1. Check if user is known to be signed in
    const hasSignedIn = localStorage.getItem('dareday_user_has_signed_in') === 'true';
    if (hasSignedIn) {
      try {
        const lastCustom = localStorage.getItem('dareday_last_custom_profile');
        if (lastCustom) {
          const parsed = JSON.parse(lastCustom);
          if (parsed && parsed.id && parsed.name && !parsed.id.startsWith('guest_') && parsed.name !== 'Guest Player') {
            return parsed;
          }
        }
      } catch (_e) {}
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const guest: UserProfile = {
      id: `guest_${randomSuffix}`,
      handle: `@guest_${randomNum}`,
      name: 'Guest Player',
      avatar: '/logo.png',
      cred: 0,
      xp: 0,
      level: 1,
      rank: 'Challenger',
      completedDaresCount: 0,
      createdDaresCount: 0,
      streak: 0,
      badges: [],
      isPro: false,
      proTier: null,
      inventory: [],
      activeBoosters: [],
      seasonPassLevel: 1,
      seasonPassXp: 0,
      isGuest: true,
    };
    return guest;
  };

  const { 
    user, 
    signIn: signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    logout, 
    authError, 
    setAuthError 
  } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(getInitialUser);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const lastIdentifiedUidRef = React.useRef<string | null>(null);

  const handleSignIn = () => {
    setIsSignInModalOpen(true);
  };

  const handleSignInWithGoogle = async () => {
    playSound('click');
    const res = await signInWithGoogle();
    if (res?.user) {
      localStorage.setItem('dareday_user_has_signed_in', 'true');
      playSound('levelUp');
      setIsSignInModalOpen(false);
      navigateTo('/app');
    }
    return res;
  };

  const handleSignInWithEmail = async (email: string, pass: string) => {
    playSound('click');
    const res = await signInWithEmail(email, pass);
    if (res?.user) {
      localStorage.setItem('dareday_user_has_signed_in', 'true');
      playSound('levelUp');
      setIsSignInModalOpen(false);
      navigateTo('/app');
    }
    return res;
  };

  const handleSignUpWithEmail = async (email: string, pass: string, handle?: string) => {
    playSound('click');
    const res = await signUpWithEmail(email, pass, handle);
    if (res?.user) {
      localStorage.setItem('dareday_user_has_signed_in', 'true');
      playSound('levelUp');
      setIsSignInModalOpen(false);
      navigateTo('/app');
    }
    return res;
  };

  const requireAuth = (action?: () => void) => {
    if (!user) {
      playSound('pop');
      setIsSignInModalOpen(true);
      return false;
    }
    if (action) action();
    return true;
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    localStorage.removeItem('dareday_user_has_signed_in');
    localStorage.removeItem('dareday_last_custom_profile');
    localStorage.removeItem('dareday_guest_session');
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('dareday_profile_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (_e) {}
    resetAnalytics();
    lastIdentifiedUidRef.current = null;
    const guest = getInitialUser();
    setCurrentUser(guest);
    playSound('pop');
    navigateTo('/');
  };

  // Handle returning user storage and auth shortcuts (/signin, /login, /signup)
  useEffect(() => {
    if (user) {
      localStorage.setItem('dareday_user_has_signed_in', 'true');
    }
    if (currentPath === '/signin' || currentPath === '/login' || currentPath === '/signup') {
      setIsSignInModalOpen(true);
    }
  }, [user, currentPath]);

  useEffect(() => {
    if (user) {
      if (lastIdentifiedUidRef.current === user.uid) return;
      lastIdentifiedUidRef.current = user.uid;

      const normalizedEmail = (user.email || '').toLowerCase().trim();
      if (normalizedEmail === 'daredaylabs@gmail.com') {
        identifyUser('daredaylabs@gmail.com', {
          email: 'daredaylabs@gmail.com',
          is_test_user: true,
        });
      } else {
        identifyUser(user.uid, {
          ...(user.email ? { email: user.email } : {}),
        });
      }
    } else {
      if (lastIdentifiedUidRef.current !== null) {
        lastIdentifiedUidRef.current = null;
        resetAnalytics();
      }
    }
  }, [user]);

  const [dares, setDares] = useState<DareItem[]>([]);
  const [stats, setStats] = useState<{
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  }>({
    totalDares: 0,
    totalCredPool: 0,
    verifiedDares: 0,
  });

  const [loading, setLoading] = useState(true);
  const [soundActive, setSoundActive] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('feed');
  const [activeCategory, setActiveCategory] = useState('all');
  const [targetFilter, setTargetFilter] = useState<'all' | 'public' | 'direct'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modals & Notifications state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCredLogOpen, setIsCredLogOpen] = useState(false);
  const [isProofGalleryOpen, setIsProofGalleryOpen] = useState(false);
  const [isOracleSurpriseOpen, setIsOracleSurpriseOpen] = useState(false);
  const [isProUpgradeOpen, setIsProUpgradeOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [stakingDare, setStakingDare] = useState<DareItem | null>(null);
  const [isTournamentsOpen, setIsTournamentsOpen] = useState(false);
  const [isLiveDuelsOpen, setIsLiveDuelsOpen] = useState(false);
  const [isAiDareLabOpen, setIsAiDareLabOpen] = useState(false);
  const [isDareChatOpen, setIsDareChatOpen] = useState(false);
  const [shareCardDare, setShareCardDare] = useState<DareItem | null>(null);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  const [proofSubmissionDare, setProofSubmissionDare] = useState<DareItem | null>(null);
  const [proofViewingDare, setProofViewingDare] = useState<DareItem | null>(null);
  const [coachingDare, setCoachingDare] = useState<DareItem | null>(null);
  const [commentsViewingDare, setCommentsViewingDare] = useState<DareItem | null>(null);
  const [shareToast, setShareToast] = useState<ToastData | null>(null);
  const [expiryReminderToast, setExpiryReminderToast] = useState<ExpiryToastData | null>(null);
  const [notifiedExpiries, setNotifiedExpiries] = useState<Record<string, boolean>>({});
  const [highlightedDareId, setHighlightedDareId] = useState<string | null>(null);
  const [profileViewingUser, setProfileViewingUser] = useState<UserProfile | null>(null);
  const [profileModalTab, setProfileModalTab] = useState<'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry'>('heatmap');
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyModalIndex, setStoryModalIndex] = useState(0);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);

  // Local/persistent custom stories created by the user
  const [userStories, setUserStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('dareday_user_stories_v1');
      if (saved) {
        const parsed: StoryItem[] = JSON.parse(saved);
        const now = Date.now();
        return parsed.filter(s => {
          const exp = s.expiresAt ? new Date(s.expiresAt).getTime() : new Date(s.createdAt).getTime() + 24 * 3600 * 1000;
          return exp > now;
        });
      }
    } catch (_e) {}
    return [];
  });

  const handlePublishStory = (newStory: StoryItem) => {
    setUserStories(prev => {
      const updated = [newStory, ...prev];
      try {
        localStorage.setItem('dareday_user_stories_v1', JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dare:system-alert', {
        detail: {
          title: 'Story Shared!',
          body: 'Your story is now live for 24 hours to your squad and community.',
          icon: '⚡',
          tag: 'Social'
        }
      }));
    }
  };

  const handleDeleteStory = (storyId: string) => {
    setUserStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      try {
        localStorage.setItem('dareday_user_stories_v1', JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });
  };

  const hasUserStory = userStories.some(s => s.user?.id === currentUser.id);

  const storyList: StoryItem[] = useMemo(() => {
    const list: StoryItem[] = [...userStories];
    for (const u of users) {
      if (u.id === currentUser.id) continue;
      list.push({
        id: `story_${u.id}`,
        user: u,
        type: 'text',
        text: `Checked in on daily challenge & banked active streak!`,
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [userStories, users, currentUser.id]);

  const handleViewUserStory = () => {
    const userStoryIdx = storyList.findIndex(s => s.user?.id === currentUser.id);
    if (userStoryIdx !== -1) {
      setStoryModalIndex(userStoryIdx);
      setIsStoryModalOpen(true);
    } else {
      setIsCreateStoryModalOpen(true);
    }
  };
  const [directTargetUserHandle, setDirectTargetUserHandle] = useState<string | undefined>(undefined);
  const [editingDare, setEditingDare] = useState<DareItem | null>(null);
  const [deletingDare, setDeletingDare] = useState<DareItem | null>(null);
  const [isDeletingDare, setIsDeletingDare] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [transactions, setTransactions] = useState<CredTransaction[]>([]);
  const [dailyMission, setDailyMission] = useState<DareItem | null>(null);
  const [showGuestViralBanner, setShowGuestViralBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dareday_hide_guest_banner') !== 'true';
    } catch {
      return true;
    }
  });

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetchWithRetry(`/api/notifications?userId=${currentUser.id}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Notice: notifications momentarily unavailable, will retry on refresh');
    }
  };

  const fetchDailyMission = async () => {
    try {
      const res = await fetchWithRetry(`/api/users/${currentUser.id}/daily-mission`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setDailyMission(data);
      }
    } catch (e) {
      console.warn('Notice: daily mission momentarily unavailable');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetchWithRetry('/api/transactions');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.warn('Notice: transactions momentarily unavailable');
    }
  };

  // Fetch Users & Leaderboard
  const fetchUsers = async () => {
    try {
      const res = await fetchWithRetry('/api/users');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        
        // Merge currentUser into data so the active user is always represented with their current name/avatar
        const updatedUsers = data.map((u: UserProfile) => {
          if (u.id === currentUser.id) {
            return {
              ...u,
              name: currentUser.name || u.name,
              handle: currentUser.handle || u.handle,
              avatar: currentUser.avatar || u.avatar,
              completedDaresCount: currentUser.completedDaresCount ?? u.completedDaresCount,
              cred: currentUser.cred ?? u.cred,
            };
          }
          return u;
        });
        if (!currentUser.id.startsWith('guest_') && !updatedUsers.some((u: UserProfile) => u.id === currentUser.id)) {
          updatedUsers.push(currentUser);
        }
        setUsers(updatedUsers);

        // Sync currentUser object if in list without clobbering active custom name/avatar
        const found = data.find((u: UserProfile) => u.id === currentUser.id);
        if (found) {
          setCurrentUser(prev => {
            const hasLocalName = Boolean(prev.name && prev.name !== 'Guest Operative' && prev.name !== 'Active Operative' && prev.name !== 'Guest Player');
            const isCustomAvatar = Boolean(prev.avatar && !prev.avatar.includes('photo-1535713875002'));
            return {
              ...found,
              name: hasLocalName ? prev.name : (found.name || prev.name),
              handle: (prev.handle && !prev.handle.startsWith('@guest_')) ? prev.handle : (found.handle || prev.handle),
              avatar: isCustomAvatar ? prev.avatar : (found.avatar || prev.avatar),
            };
          });
        }
        
        // Sync profileViewingUser if currently viewing someone without clobbering updated name/avatar
        if (profileViewingUser) {
          const updatedViewing = data.find((u: UserProfile) => u.id === profileViewingUser.id);
          if (updatedViewing) {
            setProfileViewingUser(prev => {
              if (!prev) return updatedViewing;
              const isCustom = prev.name && prev.name !== 'Guest Operative' && prev.name !== 'Active Operative' && prev.name !== 'Guest Player';
              return {
                ...updatedViewing,
                name: isCustom ? prev.name : (updatedViewing.name || prev.name),
                handle: prev.handle || updatedViewing.handle,
                avatar: prev.avatar || updatedViewing.avatar,
              };
            });
          }
        }
      }
    } catch (e) {
      console.warn('Notice: users directory momentarily unavailable');
    }
  };

  // Fetch Dares
  const fetchDares = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('tab', activeTab);
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (targetFilter !== 'all') params.append('target', targetFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      params.append('userId', currentUser.id);

      const res = await fetchWithRetry(`/api/dares?${params.toString()}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setDares(data);
      }
    } catch (e) {
      console.warn('Notice: dares momentarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetchWithRetry('/api/stats');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setStats(data);
        }
      }
    } catch (e) {
      console.warn('Notice: community stats momentarily unavailable');
    }
  };

  useEffect(() => {
    if (!user) {
      setCurrentUser(prev => {
        if (prev.id.startsWith('guest_')) return prev;
        return getInitialUser();
      });
      return;
    }

    let isMounted = true;
    const syncUserProfile = async () => {
      try {
        // Retrieve local profile saved specifically for this user.uid
        let localCustom: Partial<UserProfile> | null = null;
        try {
          const userSaved = localStorage.getItem(`dareday_profile_${user.uid}`);
          if (userSaved) {
            localCustom = JSON.parse(userSaved);
          }
        } catch (_e) {}

        // If we have a local custom profile for this specific user, apply it
        if (localCustom && localCustom.name && localCustom.name !== 'Guest Operative') {
          setCurrentUser(prev => ({
            ...prev,
            ...localCustom,
            id: user.uid,
            name: localCustom?.name || prev.name,
            handle: localCustom?.handle || prev.handle,
            avatar: localCustom?.avatar || prev.avatar,
          }));
        }

        const isDareOpsAccount = Boolean(
          user.email?.toLowerCase().includes('daredaylabs') || 
          user.email?.toLowerCase().includes('daydare') ||
          user.email?.toLowerCase().includes('dareday') ||
          user.displayName?.toLowerCase().includes('dareday') ||
          user.displayName?.toLowerCase().includes('daydare')
        );

        let savedData: UserProfile | null = null;

        // 1. Check if user profile is already saved in Firestore (Cloud Source of Truth)
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            savedData = userDocSnap.data() as UserProfile;
          }
        } catch (dbErr) {
          console.warn('Firestore user profile lookup notice:', dbErr);
        }

        const defaultHandle = isDareOpsAccount 
          ? '@dare' 
          : (user.email ? `@${user.email.split('@')[0]}` : `@${user.uid.slice(0, 8)}`);
        
        const defaultAvatar = isDareOpsAccount 
          ? '/logo.png' 
          : (user.photoURL || '/logo.png');
        
        const defaultName = isDareOpsAccount 
          ? 'Jay' 
          : (user.displayName || 'DARE Member');

        // Check Firestore saved data first
        const isSavedNameValid = Boolean(savedData?.name && 
          savedData.name !== 'Guest Operative' && 
          savedData.name !== 'Guest Player' && 
          savedData.name !== 'Active Operative' && 
          savedData.name !== 'DARE Operative' && 
          savedData.name !== 'DARE Member');

        const isLocalNameValid = Boolean(localCustom?.name && 
          localCustom.name !== 'Guest Operative' && 
          localCustom.name !== 'Guest Player' && 
          localCustom.name !== 'Active Operative' && 
          localCustom.name !== 'DARE Operative' && 
          localCustom.name !== 'DARE Member');

        const resolvedName = isSavedNameValid 
          ? savedData!.name 
          : (isLocalNameValid ? localCustom!.name! : defaultName);

        const isSavedHandleValid = Boolean(savedData?.handle && 
          !savedData.handle.startsWith('@guest_') && 
          savedData.handle !== '@operative');

        const isLocalHandleValid = Boolean(localCustom?.handle && 
          !localCustom.handle.startsWith('@guest_') && 
          localCustom.handle !== '@operative');

        const resolvedHandle = isSavedHandleValid 
          ? savedData!.handle 
          : (isLocalHandleValid ? localCustom!.handle! : defaultHandle);

        const isSavedAvatarValid = Boolean(savedData?.avatar && 
          !savedData.avatar.includes('photo-1535713875002'));

        const isLocalAvatarValid = Boolean(localCustom?.avatar && 
          !localCustom.avatar.includes('photo-1535713875002'));

        const resolvedAvatar = isSavedAvatarValid 
          ? savedData!.avatar 
          : (isLocalAvatarValid ? localCustom!.avatar! : defaultAvatar);

        const profileToSync: UserProfile = {
          ...(savedData || {}),
          ...(localCustom || {}),
          id: user.uid,
          name: resolvedName,
          handle: resolvedHandle,
          avatar: resolvedAvatar,
          cred: savedData?.cred !== undefined ? savedData.cred : (localCustom?.cred !== undefined ? localCustom.cred : 0),
          xp: savedData?.xp !== undefined ? savedData.xp : (localCustom?.xp !== undefined ? localCustom.xp : 0),
          level: savedData?.level !== undefined ? savedData.level : (localCustom?.level !== undefined ? localCustom.level : 1),
          rank: savedData?.rank || localCustom?.rank || 'New Recruit',
          completedDaresCount: savedData?.completedDaresCount || localCustom?.completedDaresCount || 0,
          createdDaresCount: savedData?.createdDaresCount || localCustom?.createdDaresCount || 0,
          streak: savedData?.streak !== undefined ? savedData.streak : (localCustom?.streak !== undefined ? localCustom.streak : 0),
          lastActiveDate: savedData?.lastActiveDate || new Date().toISOString().split('T')[0],
          badges: savedData?.badges || localCustom?.badges || [],
          isPro: savedData?.isPro !== undefined ? savedData.isPro : (localCustom?.isPro !== undefined ? localCustom.isPro : isDareOpsAccount),
          proTier: savedData?.proTier || localCustom?.proTier || (isDareOpsAccount ? 'ultra' : null),
          inventory: savedData?.inventory || localCustom?.inventory || [],
          activeBoosters: savedData?.activeBoosters || localCustom?.activeBoosters || [],
          seasonPassLevel: savedData?.seasonPassLevel || localCustom?.seasonPassLevel || 1,
          seasonPassXp: savedData?.seasonPassXp || localCustom?.seasonPassXp || 0,
          disableHelpBubbles: savedData?.disableHelpBubbles !== undefined ? savedData.disableHelpBubbles : (localCustom?.disableHelpBubbles || false),
          referralCode: savedData?.referralCode || localCustom?.referralCode,
          referralCount: savedData?.referralCount || localCustom?.referralCount || 0,
        };

        // Persist to localStorage immediately
        try {
          localStorage.setItem(`dareday_profile_${user.uid}`, JSON.stringify(profileToSync));
        } catch (_e) {}

        // Persist to Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), profileToSync, { merge: true });
        } catch (writeErr) {
          console.warn('Firestore profile save warning:', writeErr);
        }

        // Apply to currentUser state
        if (isMounted) {
          setCurrentUser(profileToSync);
        }

        // Sync to backend API with resilient retry and fallback handling
        try {
          const idToken = await getSafeIdToken(user);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
          }

          const res = await fetchWithRetry('/api/users/sync', {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...profileToSync, isExplicitUpdate: true, email: user.email }),
          }, { retries: 3, initialDelayMs: 400 });

          if (res.ok && isMounted) {
            const syncedUser = await res.json();
            if (syncedUser && syncedUser.id) {
              setCurrentUser(prev => ({
                ...syncedUser,
                name: resolvedName,
                handle: resolvedHandle,
                avatar: resolvedAvatar,
              }));
            }
          }
        } catch (apiErr) {
          console.warn('Backend user profile sync deferred (local profile active):', apiErr);
        }

        if (isMounted) {
          fetchUsers();
          fetchDailyMission();
        }
      } catch (err) {
        console.warn('User profile initialization warning (using cached profile):', err);
      }
    };

    syncUserProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchDailyMission();
    fetchTransactions();

    // Check if direct link to dare was passed via ?dare=<id> or referral ?ref=...
    const urlParams = new URLSearchParams(window.location.search);
    const linkedDareId = urlParams.get('dare');
    if (linkedDareId) {
      setHighlightedDareId(linkedDareId);
    }

    // Check if deep link to user profile was passed via ?u=<handle> or ?user=<id> or ?profile=<id>
    const linkedUserHandle = urlParams.get('u');
    const linkedUserId = urlParams.get('user') || urlParams.get('profile');
    if (linkedUserHandle || linkedUserId) {
      const targetQuery = (linkedUserHandle || linkedUserId || '').replace(/^@/, '');
      if (targetQuery) {
        fetchWithRetry(`/api/users/${encodeURIComponent(targetQuery)}`)
          .then(async (res) => {
            if (res.ok) {
              const uData = await res.json();
              if (uData && uData.id) {
                setProfileViewingUser(uData);
              }
            }
          })
          .catch(() => {});
      }
    }

    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('dareday_applied_ref', refCode);
      // Auto credit referral bonus toast or state if needed
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchDailyMission();
  }, [currentUser.id]);

  useEffect(() => {
    fetchDares();
  }, [activeTab, activeCategory, targetFilter, debouncedSearch, currentUser.id]);

  // Smooth scroll to targeted dare once dares are loaded
  useEffect(() => {
    if (!highlightedDareId || loading || dares.length === 0) return;
    const timer = setTimeout(() => {
      const targetElement = document.getElementById(`dare-card-${highlightedDareId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightedDareId, loading, dares]);

  // Check for dares close to expiration (1 hour before expiry reminder)
  useEffect(() => {
    const runExpiryCheck = () => {
      if (!currentUser || dares.length === 0) return;

      const now = Date.now();
      
      // Filter for dares currently accepted by the user
      const userAcceptedDares = dares.filter(
        (d) => d.status === 'accepted' && d.acceptedBy?.id === currentUser.id && d.expiresAt
      );

      for (const dare of userAcceptedDares) {
        if (!dare.expiresAt) continue;

        const expiresTime = new Date(dare.expiresAt).getTime();
        const msLeft = expiresTime - now;

        // Trigger reminder if less than 1 hour (3600000ms) left, but still in progress (> 0)
        if (msLeft > 0 && msLeft <= 3600000) {
          if (!notifiedExpiries[dare.id]) {
            const minutesLeft = Math.ceil(msLeft / 60000);
            
            setExpiryReminderToast({
              id: `${dare.id}_${now}`,
              dareId: dare.id,
              dareTitle: dare.title,
              timeLeftMinutes: minutesLeft,
              expiresAtString: dare.expiresAt,
            });

            // Mark as notified so we don't spam the user
            setNotifiedExpiries((prev) => ({ ...prev, [dare.id]: true }));
            
            // Play notification sound
            playSound('notification');
            break; // Show one at a time
          }
        }
      }
    };

    runExpiryCheck();
    const interval = setInterval(runExpiryCheck, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [dares, currentUser.id, notifiedExpiries]);

  const handleToggleSound = () => {
    const updated = toggleSound();
    setSoundActive(updated);
  };

  // Direct Dare Share Handler
  const handleDareShare = (dare: DareItem, url: string) => {
    playSound('oracle');
    setShareToast({
      id: String(Date.now()),
      dareId: dare.id,
      dareTitle: dare.title,
      url,
    });
  };

  // Accept a Dare
  const handleAcceptDare = async (dare: DareItem) => {
    if (!requireAuth()) return;
    playSound('accept');
    try {
      const res = await fetch(`/api/dares/${dare.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDares((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        fetchStats();
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to accept dare:', e);
    }
  };

  // Edit Published Dare Handler (Creator only)
  const handleStartEditDare = (dare: DareItem) => {
    playSound('click');
    setEditingDare(dare);
    setIsCreateModalOpen(true);
  };

  // Delete Published Dare Confirmation Initiator (Creator only)
  const handleStartDeleteDare = (dare: DareItem) => {
    playSound('click');
    setDeletingDare(dare);
  };

  // Confirm and Execute Dare Deletion
  const handleConfirmDeleteDare = async (dare: DareItem) => {
    try {
      setIsDeletingDare(true);
      const res = await fetch(`/api/dares/${dare.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-handle': currentUser.handle,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userHandle: currentUser.handle,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete challenge');
      }

      playSound('laser');
      setDares((prev) => prev.filter((d) => d.id !== dare.id));
      setDeletingDare(null);
      fetchStats();
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to delete dare:', err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dare:system-alert', {
            detail: {
              title: 'Action Failed',
              body: err.message || 'Failed to delete challenge',
              tag: 'ERROR',
            },
          })
        );
      }
    } finally {
      setIsDeletingDare(false);
    }
  };

  // Toggle Like
  const handleToggleLike = async (dareId: string) => {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/dares/${dareId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setDares((prev) =>
          prev.map((d) =>
            d.id === dareId
              ? { ...d, likes: data.likes, likedUserIds: data.likedUserIds }
              : d
          )
        );
      }
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  // Community Vote on Proof (Legit vs Busted)
  const handleVoteProof = async (dareId: string, vote: 'legit' | 'busted') => {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/dares/${dareId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, vote }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDares((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setProofViewingDare(updated);
        fetchUsers();
        fetchStats();
        fetchNotifications();
        if (vote === 'legit') {
          triggerConfetti();
        }
      }
    } catch (e) {
      console.error('Failed to vote:', e);
    }
  };

  // Direct Rematch Request Handler
  const handleRequestRematch = async (targetHandle: string, previousDareTitle: string) => {
    try {
      const res = await fetch('/api/rivalry/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          targetUserHandle: targetHandle,
          previousDareTitle,
        }),
      });
      if (res.ok) {
        setShareToast({
          id: `toast_rematch_${Date.now()}`,
          dareId: 'rematch',
          dareTitle: `🔥 Rematch challenge transmitted to ${targetHandle}!`,
          url: window.location.origin,
        });
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to send rematch:', e);
    }
  };

  // Add Comment (Text or Voice Note)
  const handleAddComment = async (
    dareId: string, 
    text: string, 
    isVoiceNote?: boolean, 
    voiceDuration?: number
  ) => {
    try {
      const res = await fetch(`/api/dares/${dareId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          text, 
          isVoiceNote: Boolean(isVoiceNote),
          voiceDuration 
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setDares((prev) =>
          prev.map((d) =>
            d.id === dareId ? { ...d, comments: [...d.comments, newComment] } : d
          )
        );
        if (commentsViewingDare && commentsViewingDare.id === dareId) {
          setCommentsViewingDare({
            ...commentsViewingDare,
            comments: [...commentsViewingDare.comments, newComment],
          });
        }
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
    }
  };

  // Notification Action Handlers
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
    } catch (e) {
      console.error('Failed to mark all notifications read:', e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) {
          setUnreadNotificationsCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await fetch(`/api/notifications?userId=${currentUser.id}`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const handleNavigateToDare = (dareId: string) => {
    playSound('click');
    setSearchQuery('');
    setActiveCategory('all');
    setActiveTab('feed');
    setHighlightedDareId(dareId);
    setTimeout(() => {
      const el = document.getElementById(`dare-card-${dareId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  };

  const handleOpenUserProfile = async (
    userIdOrHandle: string, 
    tab?: 'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry'
  ) => {
    if (!userIdOrHandle) return;
    if (tab) setProfileModalTab(tab);

    const cleanIdentifier = String(userIdOrHandle).trim();
    const handleWithoutAt = cleanIdentifier.replace(/^@/, '').toLowerCase();
    const handleWithAt = `@${handleWithoutAt}`;

    // 1. If it's currentUser
    if (
      cleanIdentifier === currentUser.id ||
      currentUser.handle.toLowerCase() === handleWithAt ||
      currentUser.handle.toLowerCase() === handleWithoutAt ||
      (currentUser.name && currentUser.name.toLowerCase() === cleanIdentifier.toLowerCase())
    ) {
      setProfileViewingUser(currentUser);
      return;
    }

    // 2. Check in all loaded users
    const foundInUsers = users.find((u) => 
      u.id === cleanIdentifier ||
      u.handle.toLowerCase() === handleWithAt ||
      u.handle.toLowerCase() === handleWithoutAt ||
      (u.name && u.name.toLowerCase() === cleanIdentifier.toLowerCase())
    );

    if (foundInUsers) {
      setProfileViewingUser(foundInUsers);
      return;
    }

    // 3. Check in active dares creators or acceptedBy
    const matchingDare = dares.find((d) => 
      d.creator.id === cleanIdentifier ||
      d.creator.handle.toLowerCase() === handleWithAt ||
      d.creator.handle.toLowerCase() === handleWithoutAt ||
      d.creator.name.toLowerCase() === cleanIdentifier.toLowerCase() ||
      d.acceptedBy?.id === cleanIdentifier ||
      d.acceptedBy?.handle.toLowerCase() === handleWithAt ||
      d.acceptedBy?.handle.toLowerCase() === handleWithoutAt
    );

    if (matchingDare) {
      const isCreator = matchingDare.creator.id === cleanIdentifier ||
        matchingDare.creator.handle.toLowerCase() === handleWithAt ||
        matchingDare.creator.handle.toLowerCase() === handleWithoutAt ||
        matchingDare.creator.name.toLowerCase() === cleanIdentifier.toLowerCase();

      const target: any = isCreator ? matchingDare.creator : matchingDare.acceptedBy!;
      const dareUser: UserProfile = {
        id: target.id || `u_${Date.now().toString(36)}`,
        handle: target.handle?.startsWith('@') ? target.handle : `@${target.handle || 'member'}`,
        name: target.name || 'DARE Member',
        avatar: target.avatar || '/logo.png',
        cred: target.cred || 0,
        xp: target.xp || 0,
        level: target.level || 1,
        rank: target.rank || (target.isPro ? 'Pro Challenger' : 'Challenger'),
        completedDaresCount: dares.filter((d) => d.acceptedBy?.id === target.id && d.status === 'verified').length,
        createdDaresCount: dares.filter((d) => d.creator.id === target.id).length || (isCreator ? 1 : 0),
        streak: target.streak || 0,
        lastActiveDate: target.lastActiveDate || new Date().toISOString().split('T')[0],
        badges: target.badges || (target.isPro ? ['👑 PRO Member'] : []),
        isPro: !!target.isPro,
        proTier: target.proTier || (target.isPro ? 'ultra' : null),
        inventory: target.inventory || [],
        activeBoosters: target.activeBoosters || [],
        seasonPassLevel: target.seasonPassLevel || 1,
        seasonPassXp: target.seasonPassXp || 0,
        seasonPassClaimedFree: [],
        seasonPassClaimedElite: [],
        activeStakes: [],
        totalCredWonInStakes: 0,
        squadFriends: target.squadFriends || [],
        squadSentRequests: [],
        squadReceivedRequests: [],
        disableHelpBubbles: false,
      };
      setProfileViewingUser(dareUser);
    }

    // 4. Also asynchronously try to fetch fresh from server
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(cleanIdentifier)}`);
      if (res.ok) {
        const fetchedUser = await res.json();
        if (fetchedUser) {
          setProfileViewingUser(fetchedUser);
          setUsers(prev => {
            if (!prev.some(u => u.id === fetchedUser.id)) {
              return [...prev, fetchedUser];
            }
            return prev.map(u => u.id === fetchedUser.id ? fetchedUser : u);
          });
        }
      }
    } catch (_err) {
      // Handled gracefully
    }
  };

  if (currentPath === '/privacy' || currentPath === '/privacy-policy') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#07090e]" />}>
        <PrivacyPolicyPage
          onBack={() => {
            navigateTo('/');
          }}
        />
      </React.Suspense>
    );
  }

  if (currentPath === '/terms' || currentPath === '/terms-of-service') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#07090e]" />}>
        <TermsOfServicePage
          onBack={() => {
            navigateTo('/');
          }}
        />
      </React.Suspense>
    );
  }

  const appContent = (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        isAuthenticated={!!user}
        allUsers={users}
        isMarketingMode={currentPath === '/about' || currentPath === '/manifesto'}
        onSelectUser={(u) => setCurrentUser(u)}
        onSignIn={() => setIsSignInModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenCreateModal={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          requireAuth(() => setIsCreateModalOpen(true));
        }}
        onOpenLeaderboard={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setIsLeaderboardOpen(true);
        }}
        onOpenTournaments={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setIsTournamentsOpen(true);
        }}
        onOpenLiveDuels={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setIsLiveDuelsOpen(true);
        }}
        onOpenLegalModal={(tab) => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setLegalModalTab(tab || 'faq');
        }}
        onOpenCredLog={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setIsCredLogOpen(true);
        }}
        onOpenProUpgrade={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setIsProUpgradeOpen(true);
        }}
        onOpenArmory={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setIsArmoryOpen(true);
        }}
        onOpenFeed={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setActiveTab('feed');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={(u, tab) => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setProfileModalTab(tab || 'heatmap');
          setProfileViewingUser(u);
        }}
        soundActive={soundActive}
        onToggleSound={handleToggleSound}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onNavigateToDare={handleNavigateToDare}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateToPath={navigateTo}
        onOpenDareChat={() => setIsDareChatOpen(true)}
        onNavigateToChallenges={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setActiveTab('all');
          setActiveCategory('all');
          setTargetFilter('all');
          setSearchQuery('');
          setTimeout(() => {
            const el = document.getElementById('dares-feed-container');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }}
        onNavigateToMyDares={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setActiveTab('my_dares');
          setActiveCategory('all');
          setTargetFilter('all');
          setSearchQuery('');
          setTimeout(() => {
            const el = document.getElementById('dares-feed-container');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
        onNavigateToDailyMissions={() => {
          if (currentPath === '/about' || currentPath === '/manifesto' || currentPath === '/privacy' || currentPath === '/privacy-policy' || currentPath === '/terms' || currentPath === '/terms-of-service') {
            navigateTo('/');
          }
          setActiveTab('all');
          setActiveCategory('all');
          setTimeout(() => {
            const el = document.getElementById('daily-mission-widget');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              el.classList.add('ring-2', 'ring-cyan-400');
              setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2500);
            }
          }, 150);
        }}
      />

      {/* Route Separation: Optional Manifesto/About (/about, /manifesto) vs Live Platform Default (/, /app) */}
      {(currentPath === '/about' || currentPath === '/manifesto') ? (
        /* DARE — High-Energy Cinematic Landing Page Experience */
        <LandingPageExperience
          currentUser={currentUser}
          dailyMission={dailyMission}
          onOpenSignIn={() => setIsSignInModalOpen(true)}
          onStartMission={async (dare) => {
            navigateTo('/');
            setSearchQuery('');
            setActiveCategory('all');
            setActiveTab('feed');
            if (dare.status === 'open') {
              await handleAcceptDare(dare);
            }
            setHighlightedDareId(dare.id);
            setTimeout(() => {
              const el = document.getElementById(`dare-card-${dare.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          }}
          onExploreChallenges={() => {
            navigateTo('/');
          }}
          onOpenCreateModal={() => {
            navigateTo('/');
            setIsCreateModalOpen(true);
          }}
          onOpenLiveDuels={() => {
            navigateTo('/');
            setIsLiveDuelsOpen(true);
          }}
          onOpenTournaments={() => {
            navigateTo('/');
            setIsTournamentsOpen(true);
          }}
          onOpenLeaderboard={() => {
            navigateTo('/');
            setIsLeaderboardOpen(true);
          }}
          onOpenProUpgrade={() => {
            navigateTo('/');
            setIsProUpgradeOpen(true);
          }}
          onOpenArmory={() => {
            navigateTo('/');
            setIsArmoryOpen(true);
          }}
          onAcceptDare={handleAcceptDare}
          onViewProof={(dare) => setProofViewingDare(dare)}
          dares={dares}
        />
      ) : (
        <>
        {/* First-Time Viral Social Welcome Banner for Guests */}
        {!user && showGuestViralBanner && (
          <div className="mx-auto max-w-[1600px] w-full px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3.5 sm:p-4.5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm">
                  <Flame className="w-4.5 h-4.5 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm tracking-tight">Welcome to DARE</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Live Challenges
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Real-world challenges, video proof, Cred bounties & daily missions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setIsSignInModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Join / Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setShowGuestViralBanner(false);
                    try {
                      localStorage.setItem('dareday_hide_guest_banner', 'true');
                    } catch (_e) {}
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Hero Banner with Filters & Quick Oracle Button */}
      <HeroBanner
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        targetFilter={targetFilter}
        onSelectTarget={setTargetFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        allUsers={users}
        dares={dares}
        stats={stats}
        onTriggerOracle={() => setIsOracleSurpriseOpen(true)}
        onOpenLiveDuels={() => setIsLiveDuelsOpen(true)}
        onOpenStory={(user, index) => {
          playSound('pop');
          setStoryModalIndex(index);
          setIsStoryModalOpen(true);
        }}
        onOpenCreateModal={() => requireAuth(() => setIsCreateModalOpen(true))}
        onOpenCreateStory={() => requireAuth(() => setIsCreateStoryModalOpen(true))}
        hasUserStory={hasUserStory}
        onViewUserStory={handleViewUserStory}
        dailyMission={dailyMission}
        onStartMission={async (dare) => {
          if (!requireAuth()) return;
          setSearchQuery('');
          setActiveCategory('all');
          setActiveTab('feed');
          if (dare.status === 'open') {
            await handleAcceptDare(dare);
          }
          setHighlightedDareId(dare.id);
          setTimeout(() => {
            const el = document.getElementById(`dare-card-${dare.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 250);
        }}
      />

      {/* Main Content Feed Area */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        
        {/* In-App PWA Install Banner */}
        <PWAInstallButton variant="banner" />

        {activeTab === 'feed' ? (
          <div className="py-2">
            <SocialFeedWall
              currentUser={currentUser}
              dares={dares}
              onOpenDare={(dare) => {
                setHighlightedDareId(dare.id);
                setActiveTab('all');
                setTimeout(() => {
                  const el = document.getElementById(`dare-card-${dare.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 250);
              }}
              onOpenCreateDare={() => requireAuth(() => setIsCreateModalOpen(true))}
            />
          </div>
        ) : (
          <>
            {/* Daily Goals & Highlights Hub */}
            <DailyMissionWidget
              currentUser={currentUser}
              onUserUpdate={(updated) => {
                setCurrentUser(updated);
                setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                fetchStats();
              }}
              mission={dailyMission}
              onStartMission={async (dare) => {
                setSearchQuery('');
                setActiveCategory('all');
                if (dare && dare.status === 'open') {
                  await handleAcceptDare(dare);
                }
                if (dare) {
                  setHighlightedDareId(dare.id);
                  setDares(prev => prev.some(d => d.id === dare.id) ? prev : [dare, ...prev]);
                  setTimeout(() => {
                    const el = document.getElementById(`dare-card-${dare.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 250);
                }
              }}
              onNavigateAction={(action) => {
                if (action === 'feed_vote') {
                  setActiveTab('review');
                  setSearchQuery('');
                  setActiveCategory('all');
                } else if (action === 'create_dare') {
                  setIsCreateModalOpen(true);
                } else {
                  setActiveTab('all');
                }
              }}
              onOpenAiDareLab={() => setIsAiDareLabOpen(true)}
            />



            {/* Direct Targeted Dare Notice for Current User if any exist */}
            {dares.some(d => d.targetType === 'direct' && d.targetUserHandle === currentUser.handle && d.status === 'open') && (
              <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <Flame className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight">
                        {t('directPendingTitle')}
                      </h3>
                      <p className="text-xs text-rose-200/80">
                        {t('directPendingDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTargetFilter('direct');
                      playSound('click');
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    {t('viewDirectDares')} →
                  </button>
                </div>
              </div>
            )}

            {/* Dares Grid */}
            <div id="dares-feed-container" className="scroll-mt-24">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Sparkles className="h-5 w-5 text-slate-300 animate-spin" />
                </div>
                <div className="text-xs text-slate-400 tracking-normal font-medium">
                  Loading challenges...
                </div>
              </div>
            ) : dares.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
                <Compass className="h-10 w-10 text-slate-500 mb-3" />
                <h3 className="text-base font-semibold text-white">
                  {activeTab === 'my_dares' ? 'No Challenges Published Yet' : 'No Challenges Found'}
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-md">
                  {activeTab === 'my_dares'
                    ? 'You have not published any custom dares yet. Deploy your first dare to challenge friends or the global community!'
                    : 'No dares match the selected filters or search terms. Try clearing filters or create a brand new dare!'}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setActiveCategory('all');
                      setTargetFilter('all');
                      setSearchQuery('');
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => {
                      setEditingDare(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100 shadow-sm cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Dare</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Feed Section Title & Active Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      {activeTab === 'feed' && 'Community Feed'}
                      {activeTab === 'my_dares' && 'My Challenges'}
                      {activeTab === 'review' && 'Proof Gallery & Verification'}
                      {activeTab === 'verified' && 'Completed Challenges'}
                      {activeTab === 'friends' && 'Squad & Direct Duels'}
                      {activeTab === 'open' && 'Open Challenges'}
                      {activeTab === 'all' && (targetFilter === 'direct' ? 'Direct Challenges' : targetFilter === 'public' ? 'Public Challenges' : 'All Challenges')}
                    </h2>
                    <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full shadow-sm">
                      {dares.length} {dares.length === 1 ? 'Challenge' : 'Challenges'}
                    </span>
                    {activeCategory !== 'all' && (
                      <span className="text-xs font-medium text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md capitalize">
                        {activeCategory}
                      </span>
                    )}
                  </div>

                  {(activeTab !== 'all' || activeCategory !== 'all' || targetFilter !== 'all' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('all');
                        setActiveCategory('all');
                        setTargetFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Reset Filters</span>
                      <span className="text-slate-500">✕</span>
                    </button>
                  )}
                </div>
                {highlightedDareId && (
                  <div 
                    id="direct-dare-link-banner"
                    className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-slate-200 shadow-md backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300">
                        <Link2 className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                          <span>Direct Challenge Link Active</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Highlighting challenge <span className="text-white font-bold">#{highlightedDareId}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`dare-card-${highlightedDareId}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="rounded-lg border border-cyan-500/40 bg-cyan-900/40 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-800/60 transition-colors"
                      >
                        Scroll To Dare
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHighlightedDareId(null);
                          const url = new URL(window.location.href);
                          url.searchParams.delete('dare');
                          window.history.replaceState({}, '', url.toString());
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        Clear Target
                      </button>
                    </div>
                  </div>
                )}

                <SocialActivityFeed transactions={transactions} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dares.map((dare) => (
                    <DareCard
                      key={dare.id}
                      dare={dare}
                      currentUser={currentUser}
                      onAccept={handleAcceptDare}
                      onSubmitProof={(d) => setProofSubmissionDare(d)}
                      onViewProof={(d) => setProofViewingDare(d)}
                      onOpenCoach={(d) => setCoachingDare(d)}
                      onOpenStake={(d) => setStakingDare(d)}
                      onOpenShareCard={(d) => setShareCardDare(d)}
                      onToggleLike={handleToggleLike}
                      onToggleComments={(d) => setCommentsViewingDare(d)}
                      onShare={handleDareShare}
                      onOpenProfile={(userId) => {
                        handleOpenUserProfile(userId);
                      }}
                      onEditDare={handleStartEditDare}
                      onDeleteDare={handleStartDeleteDare}
                      isHighlighted={dare.id === highlightedDareId}
                    />
                  ))}
                </div>
              </div>
            )}
            </div>
          </>
        )}

      </main>
      </>
      )}




      {/* Modals & Drawers */}
      <React.Suspense fallback={null}>
      <CreateDareModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingDare(null);
          setDirectTargetUserHandle(undefined);
        }}
        currentUser={currentUser}
        allUsers={users}
        initialTargetUserHandle={directTargetUserHandle}
        editingDare={editingDare}
        onDareUpdated={(updatedDare) => {
          setDares((prev) => prev.map((d) => (d.id === updatedDare.id ? updatedDare : d)));
          setEditingDare(null);
          fetchStats();
          fetchUsers();
        }}
        onOpenSafetyModal={() => setLegalModalTab('terms')}
        onOpenProUpgrade={() => setIsProUpgradeOpen(true)}
        onSignIn={handleSignIn}
        isAuthenticated={!!user}
        onDareCreated={(newDare) => {
          setDares((prev) => [newDare, ...prev]);
          fetchStats();
          fetchUsers();
          trackEvent({
            event: 'dare_created',
            category: 'dares',
            label: newDare.title,
            value: newDare.credReward,
            userId: currentUser?.id,
            userHandle: currentUser?.handle,
            metadata: {
              category: newDare.category,
              credReward: newDare.credReward,
              targetType: newDare.targetType,
              dareId: newDare.id,
            },
          });
        }}
      />

      {/* Delete Published Dare Confirmation Modal */}
      <DeleteDareModal
        isOpen={!!deletingDare}
        onClose={() => setDeletingDare(null)}
        dare={deletingDare}
        onConfirmDelete={handleConfirmDeleteDare}
        isDeleting={isDeletingDare}
      />

      <ProofModal
        dare={proofSubmissionDare}
        currentUser={currentUser}
        isOpen={!!proofSubmissionDare}
        onClose={() => setProofSubmissionDare(null)}
        onProofSubmitted={(updated) => {
          setDares((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setProofViewingDare(updated);
          fetchStats();
          fetchUsers();
          trackEvent({
            event: 'proof_submitted',
            category: 'dares',
            label: updated.title,
            userId: currentUser?.id,
            userHandle: currentUser?.handle,
            metadata: {
              dareId: updated.id,
              status: updated.status,
              hasProofMedia: !!(updated.proof?.mediaUrl || (updated as any).proofMedia || (updated as any).proofText),
            },
          });
          if (updated.status === 'verified') {
            triggerConfetti();
          }
        }}
      />

      <ProofViewerModal
        dare={proofViewingDare}
        currentUser={currentUser}
        isOpen={!!proofViewingDare}
        onClose={() => setProofViewingDare(null)}
        onVote={handleVoteProof}
        onShare={handleDareShare}
        onRequestRematch={handleRequestRematch}
        onOpenShareCard={(d) => setShareCardDare(d)}
      />

      {/* Holographic Share Card Modal */}
      <ShareCardModal
        isOpen={!!shareCardDare}
        onClose={() => setShareCardDare(null)}
        dare={shareCardDare}
        currentUser={currentUser}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        users={users}
        currentUserId={currentUser.id}
        onOpenProfile={(u) => setProfileViewingUser(u)}
      />

      <CredLogModal
        isOpen={isCredLogOpen}
        onClose={() => setIsCredLogOpen(false)}
        currentUser={currentUser}
      />

      <OracleSurpriseModal
        isOpen={isOracleSurpriseOpen}
        onClose={() => setIsOracleSurpriseOpen(false)}
        currentUser={currentUser}
        onDeployGeneratedDare={(newDare) => {
          setDares((prev) => [newDare, ...prev]);
          fetchStats();
          fetchUsers();
        }}
        onOpenProUpgrade={() => setIsProUpgradeOpen(true)}
      />

      <CommentsDrawer
        dare={commentsViewingDare}
        currentUser={currentUser}
        isOpen={!!commentsViewingDare}
        onClose={() => setCommentsViewingDare(null)}
        onAddComment={handleAddComment}
      />

      {/* Comprehensive FAQ, Terms of Service & Safety Codex Modal */}
      <LegalAndFaqModal
        isOpen={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        defaultTab={legalModalTab || 'faq'}
      />

      {/* AI Dare Coach Modal */}
      <DareCoachModal
        isOpen={!!coachingDare}
        dare={coachingDare}
        currentUser={currentUser}
        onClose={() => setCoachingDare(null)}
        onAccept={handleAcceptDare}
        onSubmitProof={(d) => setProofSubmissionDare(d)}
      />

      {/* Pro Upgrade Premium Tier Selection & Subscription Engine */}
      <ProUpgradeModal
        isOpen={isProUpgradeOpen}
        onClose={() => setIsProUpgradeOpen(false)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onUpgradeSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
          fetchStats();
          triggerConfetti();
        }}
      />

      {/* Visual Direct Share Link Copied Toast Notification */}
      <ShareToast
        toast={shareToast}
        onDismiss={() => setShareToast(null)}
      />

      {/* In-App Telemetry & Push System Alert HUD */}
      <SystemAlertHUD />

      {/* Expiry Reminder Push Toast */}
      <ExpiryNotificationToast
        toast={expiryReminderToast}
        onDismiss={() => setExpiryReminderToast(null)}
        onSubmitProof={() => {
          const dare = dares.find((d) => d.id === expiryReminderToast?.dareId);
          if (dare) {
            setProofSubmissionDare(dare);
          }
          setExpiryReminderToast(null);
        }}
      />

      <UserProfileModal
        isOpen={!!profileViewingUser}
        onClose={() => {
          setProfileViewingUser(null);
          try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('u') || url.searchParams.has('user') || url.searchParams.has('profile')) {
              url.searchParams.delete('u');
              url.searchParams.delete('user');
              url.searchParams.delete('profile');
              window.history.replaceState({}, '', url.toString());
            }
          } catch (_e) {}
        }}
        user={profileViewingUser}
        dares={dares}
        currentUser={currentUser}
        allUsers={users}
        isAuthenticated={!!user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        initialTab={profileModalTab}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === updated.id);
            return exists ? prev.map((u) => u.id === updated.id ? updated : u) : [updated, ...prev];
          });
          setProfileViewingUser(updated);
          try {
            localStorage.setItem('dareday_last_custom_profile', JSON.stringify(updated));
            if (updated.id.startsWith('guest_')) {
              localStorage.setItem('dareday_guest_session', JSON.stringify(updated));
            } else {
              localStorage.setItem(`dareday_profile_${updated.id}`, JSON.stringify(updated));
            }
          } catch (_e) {}
          if (user && (updated.id === user.uid || updated.id === currentUser.id)) {
            try {
              setDoc(doc(db, 'users', updated.id), updated, { merge: true }).catch((err) => {
                console.warn('Firestore user update notice:', err);
              });
            } catch (_e) {}
          }
          setDares((prevDares) =>
            prevDares.map((d) => {
              let modified = false;
              const copy = { ...d };
              if (copy.creator && copy.creator.id === updated.id) {
                copy.creator = {
                  ...copy.creator,
                  handle: updated.handle,
                  name: updated.name,
                  avatar: updated.avatar,
                };
                modified = true;
              }
              if (copy.acceptedBy && copy.acceptedBy.id === updated.id) {
                copy.acceptedBy = {
                  ...copy.acceptedBy,
                  handle: updated.handle,
                  name: updated.name,
                  avatar: updated.avatar,
                };
                modified = true;
              }
              return modified ? copy : d;
            })
          );
        }}
        onOpenUpgradeModal={() => setIsProUpgradeOpen(true)}
        onOpenProofGallery={() => setIsProofGalleryOpen(true)}
        onSquadAction={() => {
          fetchUsers();
          fetchDares();
          fetchNotifications();
        }}
        onOpenProfile={(u) => {
          setProfileModalTab('heatmap');
          setProfileViewingUser(u);
        }}
        onDirectChallenge={(targetHandle) => {
          setProfileViewingUser(null);
          setDirectTargetUserHandle(targetHandle);
          setIsCreateModalOpen(true);
        }}
        onOpenProofModal={(dare) => {
          setProfileViewingUser(null);
          setProofViewingDare(dare);
        }}
        onRequestRematch={handleRequestRematch}

        onEditDare={(dare) => {
          setProfileViewingUser(null);
          handleStartEditDare(dare);
        }}
        onDeleteDare={(dare) => {
          setProfileViewingUser(null);
          handleStartDeleteDare(dare);
        }}
      />

      <SquadTournamentsModal
        isOpen={isTournamentsOpen}
        onClose={() => setIsTournamentsOpen(false)}
        currentUser={currentUser}
        onUserCredUpdated={(newCred) => {
          setCurrentUser(prev => ({ ...prev, cred: newCred }));
          fetchUsers();
          fetchTransactions();
        }}
        onOpenCreateDare={(prefillTitle) => {
          setIsTournamentsOpen(false);
          setIsCreateModalOpen(true);
        }}
        onOpenLiveDuels={() => {
          setIsTournamentsOpen(false);
          setIsLiveDuelsOpen(true);
        }}
      />

      {/* Live Head-to-Head Duels Arena Modal */}
      <LiveDuelsArenaModal
        isOpen={isLiveDuelsOpen}
        onClose={() => setIsLiveDuelsOpen(false)}
        currentUser={currentUser}
        onUserCredUpdated={(newCred) => {
          setCurrentUser(prev => ({ ...prev, cred: newCred }));
          fetchUsers();
          fetchTransactions();
        }}
      />

      {/* Rewards Armory & Rewards Exchange Modal */}
      <ArmoryModal
        isOpen={isArmoryOpen}
        onClose={() => setIsArmoryOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          fetchStats();
        }}
        onOpenStipendOrPro={() => {
          setIsArmoryOpen(false);
          setIsProUpgradeOpen(true);
        }}
      />

      {/* High-Roller Dare Staking Modal */}
      <DareStakingModal
        isOpen={!!stakingDare}
        dare={stakingDare}
        currentUser={currentUser}
        onClose={() => setStakingDare(null)}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          fetchStats();
        }}
      />

      <ProofGalleryModal
        isOpen={isProofGalleryOpen}
        onClose={() => setIsProofGalleryOpen(false)}
        currentUser={currentUser}
        onSelectProofDare={(dare) => setProofViewingDare(dare)}
      />

      <HelpBubbleSystem
        currentUser={currentUser}
        onOpenCreateModal={() => {
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setIsCreateModalOpen(true);
        }}
        onTriggerOracle={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setIsOracleSurpriseOpen(true);
        }}
        onOpenLeaderboard={() => {
          setIsCreateModalOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setIsLeaderboardOpen(true);
        }}
        onOpenCredLog={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setIsCredLogOpen(true);
        }}
        onOpenProofGallery={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setIsProofGalleryOpen(true);
        }}
        onOpenTournaments={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setIsTournamentsOpen(true);
        }}
        onOpenProfile={(u, tab) => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileModalTab(tab || 'heatmap');
          setProfileViewingUser(u);
        }}
        onSelectTargetFilter={(target) => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setTargetFilter(target);
        }}
        onSelectCategory={(cat) => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setActiveCategory(cat);
        }}
        onResetFilters={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setProfileViewingUser(null);
          setActiveTab('all');
          setActiveCategory('all');
          setTargetFilter('all');
          setSearchQuery('');
        }}
        onCloseAllModals={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsTournamentsOpen(false);
          setProfileViewingUser(null);
        }}
      />



      {/* AI Dare Lab Modal */}
      <AiDareLabModal
        isOpen={isAiDareLabOpen}
        onClose={() => setIsAiDareLabOpen(false)}
        currentUser={currentUser}
        onAcceptDare={handleAcceptDare}
        onOpenCreateWithDare={(dare) => {
          setIsAiDareLabOpen(false);
          setHighlightedDareId(dare.id);
          setDares(prev => prev.some(d => d.id === dare.id) ? prev : [dare, ...prev]);
        }}
      />

      {/* Global Sign In / Sign Up Modal */}
      <SignInModal
        isOpen={isSignInModalOpen || currentPath === '/signin' || currentPath === '/login' || currentPath === '/signup'}
        onClose={() => {
          setIsSignInModalOpen(false);
          if (currentPath === '/signin' || currentPath === '/login' || currentPath === '/signup') {
            navigateTo('/');
          }
        }}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignInWithEmail={handleSignInWithEmail}
        onSignUpWithEmail={handleSignUpWithEmail}
        onResetPassword={resetPassword}
        authError={authError}
        onClearError={() => setAuthError(null)}
      />

      <ConfettiEffect />

      {/* Story Creator Modal (Say something / Photo / Short clip) */}
      <CreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        currentUser={currentUser}
        onPublishStory={handlePublishStory}
      />

      {/* Story Viewer Modal (Facebook/Instagram Style) */}
      <StoryViewerModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        stories={storyList}
        initialIndex={storyModalIndex}
        currentUser={currentUser}
        onDeleteStory={handleDeleteStory}
      />
      </React.Suspense>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      {!(currentPath === '/about' || currentPath === '/manifesto') && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenCreate={() => requireAuth(() => setIsCreateModalOpen(true))}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenProfile={() => requireAuth(() => setProfileViewingUser(currentUser))}
        />
      )}

      <Footer
        currentUser={currentUser}
        onOpenProfile={(u, tab) => {
          if (!user) {
            requireAuth();
            return;
          }
          setProfileModalTab((tab as 'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad') || 'heatmap');
          setProfileViewingUser(u);
        }}
        onOpenCredLog={() => requireAuth(() => setIsCredLogOpen(true))}
        onOpenProUpgrade={() => requireAuth(() => setIsProUpgradeOpen(true))}
        onOpenCreateModal={() => requireAuth(() => setIsCreateModalOpen(true))}
        onOpenLegalModal={(tab) => setLegalModalTab((tab as LegalTab) || 'faq')}
        onOpenTournaments={() => requireAuth(() => setIsTournamentsOpen(true))}
      />

      {/* PWA Offline Network Connectivity Toast */}
      <OfflineIndicator />

      {/* Web Push Instant Telemetry Authorization Banner */}
      <PushNotificationBanner
        userId={currentUser.id}
        onNavigateToDare={(dareId) => setHighlightedDareId(dareId)}
      />

    </div>
  );

  return appContent;
}
